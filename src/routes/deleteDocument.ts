import { Router, Response } from "express";
import { Storage } from "@google-cloud/storage";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();
const storage = new Storage();

/**
 * @swagger
 * /api/documents/{filename}:
 *   delete:
 *     summary: Delete a user's PDF document
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bucketName
 *             properties:
 *               bucketName:
 *                 type: string
 *                 description: Name of the GCS bucket where the file lives
 *     responses:
 *       200:
 *         description: File successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request (missing bucketName or filename)
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
    const bucketName = req.body.bucketName;
    const filename = req.params.filename;

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!bucketName || typeof bucketName !== "string") {
      res.status(400).json({ message: "Missing bucketName in body" });
      return;
    }
    if (!filename || filename.trim() === "") {
      res.status(400).json({ message: "Invalid filename parameter" });
      return;
    }

    const userId = req.user.userId;
    const filePath = `${userId}/${filename}`;
    const file = storage.bucket(bucketName).file(filePath);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        res.status(404).json({ message: "File not found" });
        return;
      }
      await file.delete();
      res
        .status(200)
        .json({ message: `The file ${filename} has been deleted.` });
    } catch (err) {
      console.error("Error deleting document:", err);
      res.status(500).json({ message: "Error during file deletion" });
    }
  },
);

export default router;
