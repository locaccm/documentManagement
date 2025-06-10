// src/tests/middleware/auth_test.ts
import { Response, NextFunction } from "express";
import axios from "axios";
import { authenticateJWT, AuthRequest } from "../../middleware/auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("authenticateJWT middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = { sendStatus: jest.fn() };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 when no authorization header is present", async () => {
    await authenticateJWT(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is malformed", async () => {
    mockRequest.headers = { authorization: "MalformedHeader" };

    await authenticateJWT(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 403 when axios.post resolves with status 403", async () => {
    mockRequest.headers = { authorization: "Bearer invalidToken" };
    mockedAxios.post.mockResolvedValueOnce({ status: 403 } as any);

    await authenticateJWT(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("adds user to request and calls next when axios.post returns 200", async () => {
    const userData = { userId: 1, email: "test@example.com", status: "active" };
    mockRequest.headers = { authorization: "Bearer validToken" };
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: userData,
    } as any);

    await authenticateJWT(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.user).toEqual(userData);
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 401 when axios.post throws an error", async () => {
    mockRequest.headers = { authorization: "Bearer someToken" };
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

    await authenticateJWT(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Erreur auth:",
      "Network error",
    );
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
