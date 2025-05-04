import { Router, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { generateRentReceiptTemplate } from "../templates/pdfTemplate";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { getRentReceiptDataFromLease } from "../services/rentReceiptService";

const router = Router();
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

/**
 * @swagger
 * /api/rent-receipt:
 *   post:
 *     summary: Create a rent receipt PDF and save it to GCP
 *     description: Generates a rent receipt PDF from a provided leaseId, retrieves data from the database, and saves it in a user subfolder in the GCP bucket.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaseId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Rent receipt successfully generated and saved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pdfUrl:
 *                   type: string
 *       400:
 *         description: Invalid data.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.post(
  "/rent-receipt",
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!bucketName) {
      res.status(500).json({
        message: "The environment variable GCS_BUCKET_NAME is not defined",
      });
      return;
    }

    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { leaseId } = req.body;
      if (!leaseId || typeof leaseId !== "number") {
        res
          .status(400)
          .json({ message: "leaseId is required and must be a number." });
        return;
      }

      const receiptData = await getRentReceiptDataFromLease(leaseId);
      const pdfBuffer = await generateRentReceiptTemplate(receiptData);

      const fileName = `quittance-${uuidv4()}.pdf`;
      const filePath = `${req.user.userId}/document/${fileName}`;
      const file = storage.bucket(bucketName).file(filePath);

      await file.save(pdfBuffer, { contentType: "application/pdf" });

      const pdfUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

      res.status(200).json({
        message: "Rent receipt successfully generated and saved",
        pdfUrl,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
