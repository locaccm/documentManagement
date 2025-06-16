import request from "supertest";
import express, { Express } from "express";

function buildApp(): Express {
  const app = express();
  app.use(express.json());

  const authMod = require("../../middleware/auth");
  authMod.authenticateJWT = (req: any, _res: any, next: any) => {
    req.user = { userId: 42, email: "test@example.com", status: "OK" };
    next();
  };

  const router = require("../../routes/postRentReceipt").default;
  app.use("/api", router);

  return app;
}

describe("POST /api/rent-receipt", () => {
  let app: Express;
  let mockGetFiles: jest.Mock;
  let mockSave: jest.Mock;
  let mockGetSignedUrl: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    mockGetFiles = jest.fn().mockResolvedValue([[]]);
    mockSave = jest.fn().mockResolvedValue(undefined);
    mockGetSignedUrl = jest.fn().mockResolvedValue(["https://signed.url"]);
    jest.mock("@google-cloud/storage", () => ({
      Storage: jest.fn().mockImplementation(() => ({
        bucket: () => ({
          getFiles: mockGetFiles,
          file: () => ({
            save: mockSave,
            getSignedUrl: mockGetSignedUrl,
          }),
        }),
      })),
    }));

    jest.mock("../../services/rentReceiptService", () => ({
      getRentReceiptDataFromLease: jest.fn().mockResolvedValue({}),
    }));
    jest.mock("../../templates/pdfTemplate", () => ({
      generateRentReceiptTemplate: jest
        .fn()
        .mockResolvedValue(Buffer.from("PDF")),
    }));

    app = buildApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if leaseId, bucketName or userId is missing or invalid", async () => {
    let res = await request(app)
      .post("/api/rent-receipt")
      .send({ bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(400);

    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, userId: 42 });
    expect(res.statusCode).toBe(400);

    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket" });
    expect(res.statusCode).toBe(400);

    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: "nope", bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(400);

    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket", userId: "NaN" });
    expect(res.statusCode).toBe(400);
  });

  it("accepts userId as string and returns 200 + marker+PDF when no existing files", async () => {
    mockGetFiles.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 2, bucketName: "test-bucket", userId: "42" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("pdfUrl", "https://signed.url");
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("returns 200 + only PDF when files already exist", async () => {
    mockGetFiles.mockResolvedValueOnce([
      [{ name: "42/existing.pdf", metadata: { timeCreated: "" } }],
    ]);

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket", userId: "42" });

    expect(res.statusCode).toBe(200);
    expect(res.body.pdfUrl).toBe("https://signed.url");
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("returns 500 if getFiles throws", async () => {
    mockGetFiles.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 3, bucketName: "test-bucket", userId: "42" });
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 if saving PDF throws", async () => {
    mockGetFiles.mockResolvedValueOnce([[{}]]);
    mockSave.mockRejectedValueOnce(new Error("Upload error"));

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 4, bucketName: "test-bucket", userId: "42" });
    expect(res.statusCode).toBe(500);
  });
});
