import request from "supertest";
import express, { Express } from "express";
import { getRentReceiptDataFromLease } from "../../services/rentReceiptService";
import { generateRentReceiptTemplate } from "../../templates/pdfTemplate";

jest.mock("../../middleware/auth", () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { userId: 42 };
    next();
  },
}));

jest.mock("../../templates/pdfTemplate", () => ({
  generateRentReceiptTemplate: jest.fn(),
}));

jest.mock("../../services/rentReceiptService", () => ({
  getRentReceiptDataFromLease: jest.fn(),
}));

const mockSave = jest.fn().mockResolvedValue(undefined);
jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: () => ({
      file: () => ({
        save: mockSave,
      }),
    }),
  })),
}));

describe("POST /api/rent-receipt", () => {
  let app: Express;

  beforeEach(() => {
    process.env.GCS_BUCKET_NAME = "test-bucket";
    app = express();
    app.use(express.json());

    const router = require("../../routes/postRentReceipt").default;
    app.use("/api", router);
  });

  it("should return 400 if leaseId is missing", async () => {
    const res = await request(app).post("/api/rent-receipt").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("leaseId is required and must be a number.");
  });

  it("should return 200 and PDF URL if everything works", async () => {
    (getRentReceiptDataFromLease as jest.Mock).mockResolvedValue({
      receiptNumber: "Q-1",
      rentalType: "Location",
      month: "Avril 2024",
      landlordName: "John Doe",
      landlordAddress: "1 rue Test",
      tenantName: "Jane Smith",
      tenantAddress: "2 rue Test",
      signedAt: "Paris",
      receiptDate: "2024-04-01",
      rentalAddress: "3 rue Test",
      rentalPeriodStart: "2024-04-01",
      rentalPeriodEnd: "2024-04-30",
      rentAmount: 500,
      rentAmountText: "500 euros",
      chargesAmount: 50,
      energyContribution: 0,
      totalAmount: 550,
      paymentDate: "2024-04-05",
    });

    (generateRentReceiptTemplate as jest.Mock).mockResolvedValue(
      Buffer.from("PDF"),
    );

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Rent receipt successfully generated and saved",
    );
    expect(res.body.pdfUrl).toContain(
      "https://storage.googleapis.com/test-bucket/42/document/",
    );
  });

  it("should return 500 if service throws an error", async () => {
    (getRentReceiptDataFromLease as jest.Mock).mockRejectedValue(
      new Error("DB error"),
    );

    const res = await request(app)
      .post("/api/rent-receipt")
      .send({ leaseId: 1 });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
