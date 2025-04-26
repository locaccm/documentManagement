import express from "express";
import deleteDocument from "./routes/deleteDocument";
import getDocumentRouter from "./routes/getDocument";
import rentReceiptRouter from "./routes/postRentReceipt";
import { setupSwagger } from "./api_documentation/swagger";

const app = express();
app.use(express.json());

setupSwagger(app);

// ROUTES
app.use("/api", deleteDocument);
app.use("/api", getDocumentRouter);
app.use("/api", rentReceiptRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {});
