import request from "supertest";
import express, { Express } from "express";

const mockExists = jest.fn();
const mockDelete = jest.fn();

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: () => ({
      file: () => ({
        exists: mockExists,
        delete: mockDelete,
      }),
    }),
  })),
}));

jest.mock("../../middleware/auth", () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { userId: 42 };
    next();
  },
}));

describe("DELETE /api/documents/:filename", () => {
  let app: Express;

  beforeEach(() => {
    process.env.GCS_BUCKET_NAME = "test-bucket";

    app = express();
    app.use(express.json());

    const router = require("../../routes/deleteDocument").default;
    app.use("/api", router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if filename is missing", async () => {
    const res = await request(app).delete("/api/documents/");

    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if file does not exist", async () => {
    mockExists.mockResolvedValueOnce([false]);

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Fichier non trouvé");
  });

  it("should return 200 if file is successfully deleted", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Le fichier fichier-test.pdf a été supprimé.",
    );
  });

  it("should return 500 if an error occurs during deletion", async () => {
    mockExists.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Erreur lors de la suppression du fichier");
  });
});
