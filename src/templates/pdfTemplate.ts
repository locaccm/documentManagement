import PDFDocument from 'pdfkit';
import { RentReceiptInterface } from "../interfaces/rentReceiptInterface";
import path from 'path';

export const generateRentReceiptTemplate = (data: RentReceiptInterface): Promise<Buffer> => {
    return new Promise((resolve) => {
        // Create the document with a margin of 50
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Uint8Array[] = [];

        // Retrieve generated data chunks
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });

        // Add logo in PNG format at the top right
        const logoPath = path.join(__dirname, '../../assets/images/logo.png');
        doc.image(logoPath, doc.page.width - doc.page.margins.right - 75, doc.page.margins.top, { width: 75 });

        // --------------------------
        // Header and general information
        // --------------------------

        // Main title centered
        doc.fontSize(20).text('Quittance de loyer', { align: 'center' });
        doc.moveDown(1);

        // Specify the month of the receipt - centered
        doc.fontSize(12).text(`Quittance de loyer du mois de ${data.month}`, { align: 'center' });
        doc.moveDown(2);

        // --------------------------
        // Information about the landlord and tenant
        // --------------------------

        // Landlord details
        doc.fontSize(12).text(data.landlordName);
        doc.fontSize(12).text(data.landlordAddress);
        doc.moveDown(1);

        // Tenant details aligned to the right
        doc.fontSize(12).text(data.tenantName, { align: 'right' });
        doc.fontSize(12).text(data.tenantAddress, { align: 'right' });
        doc.moveDown(2);

        // Place and date of signing the receipt
        doc.fontSize(12).text(`Fait à ${data.signedAt}, le ${data.receiptDate}`, { align: 'right' });
        doc.moveDown(1);

        // Rental address
        doc.fontSize(12).text('Adresse de la location :');
        doc.fontSize(12).text(data.rentalAddress);
        doc.moveDown(2);

        // --------------------------
        // Receipt declaration
        // --------------------------
        const declarationText =
            `Je soussigné ${data.landlordName}, propriétaire du logement désigné ci-dessus, ` +
            `déclare avoir reçu de Monsieur/Madame ${data.tenantName}, la somme de ${data.rentAmountText} euros (${data.rentAmount} €), ` +
            `au titre du paiement du loyer et des charges pour la période de location du ${data.rentalPeriodStart} au ${data.rentalPeriodEnd} ` +
            `et lui en donne quittance, sous réserve de tous mes droits.`;
        doc.fontSize(12).text(declarationText, { align: 'justify' });
        doc.moveDown(2);

        // --------------------------
        // Payment details
        // --------------------------
        doc.fontSize(12).text('Détail du règlement :');
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Loyer :', { continued: true }).font('Helvetica').text(` ${data.rentAmount} euros`);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Provision pour charges :', { continued: true }).font('Helvetica').text(` ${data.chargesAmount} euros`);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Total :', { continued: true }).font('Helvetica').text(` ${data.totalAmount} euros`);
        doc.moveDown(1);

        // Payment date
        doc.font('Helvetica-Bold').text('Date du paiement :', { continued: true }).font('Helvetica').text(` ${data.paymentDate}`);
        doc.moveDown(2);

        // --------------------------
        // Signature
        // --------------------------
        doc.fontSize(12).text('(Signature)', { align: 'right', width: doc.page.width - doc.page.margins.right - 100 });
        doc.moveDown(2);

        // --------------------------
        // Footer notes
        // --------------------------
        doc.y = doc.page.height - doc.page.margins.bottom - 50;
        doc.fontSize(8).text(
            `Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel ` +
            `du montant du présent terme. Elle est à conserver pendant trois ans par le locataire (loi n° 89-462 du 6 juillet 1989 : art. 7-1).`,
            { align: 'justify' }
        );
        doc.moveDown(0.5);
        doc.fontSize(8).text('Texte de référence : - loi du 6.7.89 : art. 21');

        // Finalize the document
        doc.end();
    });
};