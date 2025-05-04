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
  authenticateJWT: jest
    .fn()
    .mockImplementation((req: any, _res: any, next: any) => {
      req.user = { userId: 42 };
      next();
    }),
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

  it("should return 200 if file is successfully deleted", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "The file fichier-test.pdf has been deleted.",
    );
  });

  it("should return 404 if filename is empty", async () => {
    const res = await request(app).delete("/api/documents/%20");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("The file name is required");
  });

  it("should return 404 if file does not exist", async () => {
    mockExists.mockResolvedValueOnce([false]);

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("File not found");
  });

  it("should return 500 if GCS_BUCKET_NAME is missing", async () => {
    delete process.env.GCS_BUCKET_NAME;

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .set("Authorization", "Bearer valid-token");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during file deletion");
  });

  it("should return 500 if an error occurs during exists check", async () => {
    mockExists.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during file deletion");
  });

  it("should return 500 if an error occurs during delete operation", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockRejectedValueOnce(new Error("Delete error"));

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during file deletion");
  });

  it("should return 401 if user is not authenticated", async () => {
    // Import the mocked authenticateJWT
    const { authenticateJWT } = require("../../middleware/auth");

    // For this test only, modify the mock to simulate missing userId
    authenticateJWT.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { userId: null };
      next();
    });

    const res = await request(app).delete("/api/documents/fichier-test.pdf");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
