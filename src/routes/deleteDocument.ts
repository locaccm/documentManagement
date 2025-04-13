import { Router, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

/**
 * @swagger
 * /api/documents/{filename}:
 *   delete:
 *     summary: Supprimer un document PDF de l'utilisateur
 *     description: Supprime un document PDF spécifique depuis le sous-dossier de l'utilisateur connecté dans GCP.
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
 *         description: Nom du fichier à supprimer
 *     responses:
 *       200:
 *         description: Fichier supprimé avec succès
 *       400:
 *         description: Nom de fichier invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Fichier non trouvé
 *       500:
 *         description: Erreur lors de la suppression du fichier
 */
router.delete('/documents/:filename', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
    if (!bucketName) {
        throw new Error("La variable d'environnement GCS_BUCKET_NAME est manquante");
    }

    try {
        const userId = req.user?.userId;
        const { filename } = req.params;

        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }

        if (!filename) {
            res.status(400).json({ message: 'Le nom du fichier est requis' });
            return;
        }

        const filePath = `${userId}/document/${filename}`;
        const file = storage.bucket(bucketName!).file(filePath);

        const [exists] = await file.exists();
        if (!exists) {
            res.status(404).json({ message: 'Fichier non trouvé' });
            return;
        }

        await file.delete();
        res.status(200).json({ message: `Le fichier ${filename} a été supprimé.` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du fichier' });
    }
});

export default router;
