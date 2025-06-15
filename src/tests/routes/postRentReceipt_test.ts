import request from "supertest";
import express, { Express } from "express";

function buildApp() {
  const app: Express = express();
  app.use(express.json());
  const router = require("../../routes/postRentReceipt").default;
  app.use("/api", router);
  return app;
}

describe("POST /api/rent-receipt", () => {
  let app: Express;

  beforeEach(() => {
    jest.resetModules();

    jest.mock("../../middleware/auth", () => ({
      authenticateJWT: (req: any, _res: any, next: any) => {
        req.user = { userId: 42, email: "test@example.com", status: "OK" };
        next();
      },
    }));

    jest.mock("@google-cloud/storage", () => ({
      Storage: jest.fn().mockImplementation(() => ({
        bucket: () => ({
          getFiles: jest.fn().mockResolvedValue([[]]),
          file: () => ({
            save: jest.fn().mockResolvedValue(undefined),
            makePublic: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      })),
    }));
    jest.mock("pdfkit", () => {
      const { Readable } = require("stream");
      return jest.fn().mockImplementation(() => {
        const doc = new Readable();
        doc.fontSize = () => doc;
        doc.text = () => doc;
        doc.moveDown = () => doc;
        doc.end = () => doc.emit("finish");
        return doc;
      });
    });
    jest.mock("get-stream", () => ({
      buffer: jest.fn().mockResolvedValue(Buffer.from("PDF")),
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

  it("returns 401 if authenticateJWT does not set req.user", async () => {
    jest.resetModules();
    jest.mock("../../middleware/auth", () => ({
      authenticateJWT: (req: any, _res: any, next: any) => {
        next();
      },
    }));

    app = buildApp();

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1, bucketName: "test-bucket" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({});
  });

  it("returns 400 if leaseId or bucketName is missing or invalid", async () => {
    const res1 = await request(app)
      .post("/api/rent-receipt")
      .send({ bucketName: "test-bucket" });
    expect(res1.statusCode).toBe(400);

    const res2 = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1 });
    expect(res2.statusCode).toBe(400);

    const res3 = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: "not-a-number", bucketName: "test-bucket" });
    expect(res3.statusCode).toBe(400);
  });
});
