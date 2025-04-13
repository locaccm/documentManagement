import { Router, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { generateRentReceiptTemplate } from '../templates/pdfTemplate';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { getUserById } from '../services/userService';

const router = Router();
const storage = new Storage();

/**
 * @swagger
 * /api/rent-receipt:
 *   post:
 *     summary: Créer une quittance de loyer en PDF et l'enregistrer dans GCP
 *     description: Génère une quittance de loyer en PDF à partir des données fournies,
 *                  la stocke dans un bucket Google Cloud Storage (provisionné via Terraform)
 *                  dans le sous-dossier de l'utilisateur connecté et renvoie l'URL du PDF.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RentReceipt'
 *     responses:
 *       200:
 *         description: Quittance générée et enregistrée.
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
 *         description: Données invalides.
 *       401:
 *         description: Non autorisé.
 *       500:
 *         description: Erreur interne du serveur.
 */
router.post('/rent-receipt', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
        res.status(500).json({ message: "La variable d'environnement GCS_BUCKET_NAME n'est pas définie" });
        return;
    }

    try {
        const rentReceiptData = req.body;

        if (!req.user) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        const user = await getUserById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé.' });
            return;
        }

        const pdfBuffer = await generateRentReceiptTemplate(rentReceiptData);

        const fileName = `quittance-${uuidv4()}.pdf`;
        const filePath = `${req.user.userId}/document/${fileName}`;
        const file = storage.bucket(bucketName).file(filePath);

        await file.save(pdfBuffer, { contentType: 'application/pdf' });

        const pdfUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        res.status(200).json({
            message: "Quittance générée et enregistrée avec succès",
            pdfUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
});

export default router;
