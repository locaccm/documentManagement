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
    app = express();
    app.use(express.json());

    const router = require("../../routes/deleteDocument").default;
    app.use("/api", router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 if file is successfully deleted (userId as number)", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "The file fichier-test.pdf has been deleted.",
    );
  });

  it("should return 200 if file is successfully deleted (userId as string)", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: "42" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "The file fichier-test.pdf has been deleted.",
    );
  });

  it("should return 400 if bucketName or userId is missing", async () => {
    const res1 = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send();
    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toBe("Missing or invalid bucketName or userId");

    const res2 = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket" });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toBe("Missing or invalid bucketName or userId");

    const res3 = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ userId: 42 });
    expect(res3.statusCode).toBe(400);
    expect(res3.body.message).toBe("Missing or invalid bucketName or userId");
  });

  it("should return 400 if filename is invalid", async () => {
    const res = await request(app)
      .delete("/api/documents/%20")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid filename parameter");
  });

  it("should return 404 if file does not exist", async () => {
    mockExists.mockResolvedValueOnce([false]);

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("File not found");
  });

  it("should return 500 if an error occurs during exists check", async () => {
    mockExists.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during file deletion");
  });

  it("should return 500 if an error occurs during delete operation", async () => {
    mockExists.mockResolvedValueOnce([true]);
    mockDelete.mockRejectedValueOnce(new Error("Delete error"));

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error during file deletion");
  });

  it("should return 401 if user is not authenticated", async () => {
    const { authenticateJWT } = require("../../middleware/auth");
    authenticateJWT.mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = undefined;
      next();
    });

    const res = await request(app)
      .delete("/api/documents/fichier-test.pdf")
      .send({ bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
