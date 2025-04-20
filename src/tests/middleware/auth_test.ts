import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {authenticateJWT, AuthRequest} from '../../middleware/auth';

jest.mock('jsonwebtoken');

describe('authenticateJWT middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            sendStatus: jest.fn(),
        };
        mockNext = jest.fn();
    });

    it('returns 401 when no authorization header is present', () => {
        authenticateJWT(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when token verification fails', () => {
        mockRequest.headers = { authorization: 'Bearer invalidToken' };
        (jwt.verify as jest.Mock).mockImplementation((_, __, callback) => {
            callback(new Error('Invalid token'), null);
        });

        authenticateJWT(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.sendStatus).toHaveBeenCalledWith(403);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('adds user to request and calls next when token is valid', () => {
        const decodedToken = { userId: 1, email: 'test@example.com' };
        mockRequest.headers = { authorization: 'Bearer validToken' };
        (jwt.verify as jest.Mock).mockImplementation((_, __, callback) => {
            callback(null, decodedToken);
        });

        authenticateJWT(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockRequest.user).toEqual(decodedToken);
        expect(mockNext).toHaveBeenCalled();
    });

    it('returns 401 when authorization header is malformed', () => {
        mockRequest.headers = { authorization: 'MalformedHeader' };

        authenticateJWT(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });
});