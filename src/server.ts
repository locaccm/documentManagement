import express from 'express';
import rentReceiptRouter from './routes/postRentReceipt';
import getDocumentRouter from './routes/getDocument';
import {setupSwagger} from "./api_documentation/swagger";

const app = express();
app.use(express.json());

setupSwagger(app);

// ROUTES
app.use('/api', getDocumentRouter);
app.use('/api', rentReceiptRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`); // TODO DELETE THIS LINE at the end of dev
});
