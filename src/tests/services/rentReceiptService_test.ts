import { getRentReceiptDataFromLease } from "../../services/rentReceiptService";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const leaseMock = {
    findUnique: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      lease: leaseMock,
    })),
  };
});

const prisma = new PrismaClient();

describe("getRentReceiptDataFromLease", () => {
  const baseMockLease = {
    LEAN_ID: 1,
    LEAD_START: new Date("2024-04-01"),
    LEAD_END: new Date("2024-04-30"),
    LEAD_PAYMENT: new Date("2024-04-05"),
    LEAN_RENT: 500.0,
    LEAN_CHARGES: 50.0,
    user: {
      USEC_FNAME: "Jane",
      USEC_LNAME: "Doe",
      USEC_ADDRESS: "2 rue du Test",
    },
    accommodation: {
      ACCC_TYPE: "Meublé",
      ACCC_ADDRESS: "3 avenue de la Location",
      owner: {
        USEC_FNAME: "John",
        USEC_LNAME: "Smith",
        USEC_ADDRESS: "1 boulevard du Bail",
      },
    },
  };

  it("should return a properly formatted rent receipt data object", async () => {
    (prisma.lease.findUnique as jest.Mock).mockResolvedValue(baseMockLease);

    const data = await getRentReceiptDataFromLease(1);

    expect(data).toMatchObject({
      receiptNumber: "Q-1",
      rentalType: "Meublé",
      landlordName: "John Smith",
      tenantName: "Jane Doe",
      totalAmount: 550,
      rentAmount: 500,
      chargesAmount: 50,
      rentalAddress: "3 avenue de la Location",
    });
  });

  it("should throw if lease is not found", async () => {
    (prisma.lease.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getRentReceiptDataFromLease(1)).rejects.toThrow(
      "Lease not found",
    );
  });

  it("should throw if user is missing", async () => {
    (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
      ...baseMockLease,
      user: null,
    });

    await expect(getRentReceiptDataFromLease(1)).rejects.toThrow(
      "Missing tenant information",
    );
  });

  it("should throw if accommodation is missing", async () => {
    (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
      ...baseMockLease,
      accommodation: null,
    });

    await expect(getRentReceiptDataFromLease(1)).rejects.toThrow(
      "Missing accommodation",
    );
  });

  it("should throw if accommodation.owner is missing", async () => {
    (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
      ...baseMockLease,
      accommodation: {
        ...baseMockLease.accommodation,
        owner: null,
      },
    });

    await expect(getRentReceiptDataFromLease(1)).rejects.toThrow(
      "Missing landlord information",
    );
  });
});
