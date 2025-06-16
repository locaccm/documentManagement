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

  function buildApp() {
    const a = express();
    a.use(express.json());
    const router = require("../../routes/getDocument").default;
    a.use("/api", router);
    return a;
  }

  beforeEach(() => {
    mockGetFiles.mockReset();
    app = buildApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and list of documents", async () => {
    mockGetFiles.mockResolvedValueOnce([
      [
        {
          name: "42/quittance-123.pdf",
          metadata: { timeCreated: "2024-04-25T14:00:00Z" },
        },
        {
          name: "42/quittance-456.pdf",
          metadata: { timeCreated: "2024-04-26T09:30:00Z" },
        },
      ],
    ]);

    const res = await request(app).get(
      "/api/documents?bucketName=test-bucket&userId=42",
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.documents).toHaveLength(2);
    expect(res.body.documents[0]).toEqual({
      name: "quittance-123.pdf",
      url: "https://storage.googleapis.com/test-bucket/42/quittance-123.pdf",
      created: "2024-04-25T14:00:00Z",
    });
  });

  it("should return 400 if bucketName or userId is missing or invalid", async () => {
    let res = await request(app).get("/api/documents?userId=42");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing or invalid bucketName or userId");

    res = await request(app).get("/api/documents?bucketName=test-bucket");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing or invalid bucketName or userId");

    res = await request(app).get(
      "/api/documents?bucketName=test-bucket&userId=not-a-number",
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Missing or invalid bucketName or userId");
  });

  it("should return 500 if storage throws an error", async () => {
    mockGetFiles.mockRejectedValueOnce(new Error("GCS error"));

    const res = await request(app).get(
      "/api/documents?bucketName=test-bucket&userId=42",
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Error retrieving documents");
  });
});
