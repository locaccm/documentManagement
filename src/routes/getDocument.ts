import { Router, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const storage = new Storage();

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Retrieves the list of user's PDF documents
 *     description: Lists all PDF files of the logged-in user, present in his or her GCP subfolder.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error during retrieval
 */
router.get(
  "/documents",
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!bucketName) {
      res.status(500).json({ message: "GCP bucket name is missing" });
      return;
    }

    const userId = req.user.userId;
    const prefix = `${userId}/document/`;

    try {
      const [files] = await storage.bucket(bucketName).getFiles({ prefix });

      const documents = files.map((file) => ({
        name: file.name.split("/").pop(),
        url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
        created: file.metadata.timeCreated,
      }));

      res.status(200).json({ documents });
    } catch (_) {
      res.status(500).json({ message: "Error retrieving documents" });
    }
  },
);

export default router;
