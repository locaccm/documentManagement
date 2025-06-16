// src/routes/rentReceiptRoutes.ts
import { Router, Response, NextFunction } from "express";
import { Storage } from "@google-cloud/storage";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { getRentReceiptDataFromLease } from "../services/rentReceiptService";
import { generateRentReceiptTemplate } from "../templates/pdfTemplate";

const router = Router();
const storage = new Storage();

export interface GenerateResponse {
  pdfUrl: string;
}

/**
 * @swagger
 * /api/rent-receipt:
 *   post:
 *     summary: Generate a rent receipt PDF and upload it to Google Cloud Storage
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
 *             required:
 *               - leaseId
 *               - bucketName
 *               - userId
 *             properties:
 *               leaseId:
 *                 type: integer
 *               bucketName:
 *                 type: string
 *               userId:
 *                 oneOf:
 *                   - type: integer
 *                   - type: string
 *                 description: Numeric user ID or stringified number
 *     responses:
 *       200:
 *         description: Rent receipt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateResponse'
 *       400:
 *         description: Bad request (missing or invalid parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/rent-receipt",
  authenticateJWT,
  async (
    req: AuthRequest,
    res: Response<GenerateResponse>,
    next: NextFunction,
  ): Promise<void> => {
    const { leaseId, bucketName } = req.body as {
      leaseId?: number;
      bucketName?: string;
      userId?: unknown;
    };
    const rawUserId = req.body.userId;
    const userId =
      typeof rawUserId === "string"
        ? parseInt(rawUserId, 10)
        : typeof rawUserId === "number"
          ? rawUserId
          : NaN;

    if (typeof leaseId !== "number" || !bucketName || isNaN(userId)) {
      res.sendStatus(400);
      return;
    }

    // Ensure auth middleware ran
    if (!req.user) {
      res.sendStatus(401);
      return;
    }

    const prefix = `${userId}/`;
    const bucket = storage.bucket(bucketName);

    try {
      const [existing] = await bucket.getFiles({ prefix, maxResults: 1 });
      if (existing.length === 0) {
        await bucket.file(prefix).save("", { resumable: false });
      }

      const receiptData = await getRentReceiptDataFromLease(leaseId);
      const pdfBuffer: Buffer = await generateRentReceiptTemplate(receiptData);

      const filenameOnly = `${Date.now()}_receipt_${leaseId}.pdf`;
      const filePath = `${prefix}${filenameOnly}`;
      const file = bucket.file(filePath);
      await file.save(pdfBuffer, {
        metadata: { contentType: "application/pdf" },
        resumable: false,
      });
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
      res.status(200).json({ pdfUrl: publicUrl });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
