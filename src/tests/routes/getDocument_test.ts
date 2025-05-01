import request from "supertest";
import express, { Express } from "express";

const mockGetFiles = jest.fn();
jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: () => ({
      getFiles: mockGetFiles,
    }),
  })),
}));

jest.mock("../../middleware/auth", () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { userId: 42 };
    next();
  },
}));

describe("GET /api/documents", () => {
  let app: Express;

  beforeEach(() => {
    process.env.GCS_BUCKET_NAME = "test-bucket";

    app = express();

    const router = require("../../routes/getDocument").default;
    app.use("/api", router);
  });

  it("should return 200 and list of documents", async () => {
    mockGetFiles.mockResolvedValueOnce([
      [
        {
          name: "42/document/quittance-123.pdf",
          metadata: { timeCreated: "2024-04-25T14:00:00Z" },
        },
        {
          name: "42/document/quittance-456.pdf",
          metadata: { timeCreated: "2024-04-26T09:30:00Z" },
        },
      ],
    ]);

    const res = await request(app).get("/api/documents");

    expect(res.statusCode).toBe(200);
    expect(res.body.documents).toHaveLength(2);
    expect(res.body.documents[0].name).toBe("quittance-123.pdf");
    expect(res.body.documents[0].url).toContain(
      "https://storage.googleapis.com/test-bucket/42/document/quittance-123.pdf",
    );
  });

  it("should return 500 if bucket name is not defined", async () => {
    delete process.env.GCS_BUCKET_NAME;

    jest.resetModules();

    const express = require("express");
    const appWithoutBucket = express();
    appWithoutBucket.use(express.json());

    appWithoutBucket.use((req: any, _res: any, next: any) => {
      req.user = { userId: 42 };
      next();
    });

    const router = require("../../routes/getDocument").default;
    appWithoutBucket.use("/api", router);

    const res = await request(appWithoutBucket).get("/api/documents");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("GCP bucket name is missing");
  });

  it("should return 500 if storage throws an error", async () => {
    mockGetFiles.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app).get("/api/documents");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error retrieving documents");
  });
});
