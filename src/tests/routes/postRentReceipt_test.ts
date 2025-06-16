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
  let mockMakePublic: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    mockGetFiles = jest.fn().mockResolvedValue([[]]);
    mockSave = jest.fn().mockResolvedValue(undefined);
    mockMakePublic = jest.fn().mockResolvedValue(undefined);
    jest.mock("@google-cloud/storage", () => ({
      Storage: jest.fn().mockImplementation(() => ({
        bucket: () => ({
          getFiles: mockGetFiles,
          file: () => ({
            save: mockSave,
            makePublic: mockMakePublic,
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

    process.env.GCS_BUCKET_NAME = "test-bucket";
    app = buildApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GCS_BUCKET_NAME;
  });

  it("returns 400 if leaseId, bucketName or userId is missing or invalid", async () => {
    // missing leaseId
    let res = await request(app)
      .post("/api/rent-receipt")
      .send({ bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(400);

    // missing bucketName
    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, userId: 42 });
    expect(res.statusCode).toBe(400);

    // missing userId
    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket" });
    expect(res.statusCode).toBe(400);

    // invalid leaseId type
    res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: "nope", bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 200 + marker+PDF when no existing files", async () => {
    mockGetFiles.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 2, bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("pdfUrl");
    expect(res.body.pdfUrl).toMatch(
      /^https:\/\/storage\.googleapis\.com\/test-bucket\/42\/\d+_receipt_2\.pdf$/,
    );
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(mockMakePublic).toHaveBeenCalledTimes(1);
  });

  it("returns 200 + only PDF when files already exist", async () => {
    mockGetFiles.mockResolvedValueOnce([
      [{ name: "42/existing.pdf", metadata: { timeCreated: "" } }],
    ]);

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket", userId: 42 });

    expect(res.statusCode).toBe(200);
    expect(res.body.pdfUrl).toMatch(
      /^https:\/\/storage\.googleapis\.com\/test-bucket\/42\/\d+_receipt_1\.pdf$/,
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockMakePublic).toHaveBeenCalledTimes(1);
  });

  it("returns 500 if getFiles throws", async () => {
    mockGetFiles.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 3, bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(500);
  });

  it("returns 500 if saving PDF throws", async () => {
    mockGetFiles.mockResolvedValueOnce([[{}]]);
    mockSave.mockRejectedValueOnce(new Error("Upload error"));

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 4, bucketName: "test-bucket", userId: 42 });
    expect(res.statusCode).toBe(500);
  });
});
