import express from "express";
import cors from "cors";
import deleteDocument from "./routes/deleteDocument";
import getDocumentRouter from "./routes/getDocument";
import rentReceiptRouter from "./routes/postRentReceipt";
import { setupSwagger } from "./api_documentation/swagger";
import { authenticateJWT } from "./middleware/auth";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization,user-id",
    credentials: true,
  }),
);

setupSwagger(app);

app.use("/api", authenticateJWT);

app.use("/api", deleteDocument);
app.use("/api", getDocumentRouter);
app.use("/api", rentReceiptRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {});
