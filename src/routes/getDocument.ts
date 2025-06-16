import { Router, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const storage = new Storage();

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The file name
 *         url:
 *           type: string
 *           format: uri
 *           description: Public URL to download the file
 *         created:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *       required:
 *         - name
 *         - url
 *         - created
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Retrieves the list of user's PDF documents
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bucketName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the GCS bucket to list
 *     responses:
 *       200:
 *         description: List of documents found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentInfo'
 *       400:
 *         description: Missing bucketName
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error during retrieval
 */
router.get(
  "/documents",
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const bucketName = String(req.query.bucketName || "").trim();
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!bucketName) {
      res.status(400).json({ message: "Missing bucketName query parameter" });
      return;
    }

    const userId = req.user.userId;
    const prefix = `${userId}/`;

    try {
      const [files] = await storage.bucket(bucketName).getFiles({ prefix });
      const documents = files.map((file) => ({
        name: file.name.split("/").pop()!,
        url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
        created: file.metadata.timeCreated!,
      }));
      res.status(200).json({ documents });
    } catch (err) {
      console.error("Error retrieving documents:", err);
      res.status(500).json({ message: "Error retrieving documents" });
    }
  },
);

export default router;
