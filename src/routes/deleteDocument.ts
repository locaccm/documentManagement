import { Router, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

/**
 * @swagger
 * /api/documents/{filename}:
 *   delete:
 *     summary: Delete a user's PDF document
 *     description: Deletes a specific PDF document from the logged-in user's GCP subfolder.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to delete
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Invalid file name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Error during file deletion
 */
router.delete(
  "/documents/:filename",
  authenticateJWT,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!bucketName) {
      throw new Error("The environment variable GCS_BUCKET_NAME is missing");
    }

    try {
      const userId = req.user?.userId;
      const { filename } = req.params;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!filename || filename.trim() === "") {
        res.status(404).json({ message: "The file name is required" });
        return;
      }

      const filePath = `${userId}/document/${filename}`;
      const file = storage.bucket(bucketName).file(filePath);

      const [exists] = await file.exists();

      if (!exists) {
        res.status(404).json({ message: "File not found" });
        return;
      }

      await file.delete();
      res
        .status(200)
        .json({ message: `The file ${filename} has been deleted.` });
    } catch (error) {
      res.status(500).json({ message: "Error during file deletion" });
    }
  },
);

export default router;
