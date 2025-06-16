// src/tests/services/rentReceiptService.test.ts
import { getRentReceiptDataFromLease } from "../../services/rentReceiptService";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const accommodationMock = { findUnique: jest.fn() };
  const leaseMock = { findFirst: jest.fn() };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      accommodation: accommodationMock,
      lease: leaseMock,
    })),
  };
});

const prisma = new PrismaClient();

describe("getRentReceiptDataFromLease", () => {
  const baseLease = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return properly formatted data when accommodation and active lease exist", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 123,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue(baseLease);

    const data = await getRentReceiptDataFromLease(123);

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
    expect(prisma.accommodation.findUnique).toHaveBeenCalledWith({
      where: { ACCN_ID: 123 },
    });
    expect(prisma.lease.findFirst).toHaveBeenCalledWith({
      where: { ACCN_ID: 123, LEAB_ACTIVE: true },
      include: { user: true, accommodation: { include: { owner: true } } },
    });
  });

  it("should throw if accommodation not found", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getRentReceiptDataFromLease(123)).rejects.toThrow(
      "Lease not found or missing accommodation ID",
    );
  });

  it("should throw if no active lease for this accommodation", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 123,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(getRentReceiptDataFromLease(123)).rejects.toThrow(
      "Active lease not found for this accommodation",
    );
  });

  it("should throw if tenant info missing", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 123,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
      ...baseLease,
      user: null,
    });

    await expect(getRentReceiptDataFromLease(123)).rejects.toThrow(
      "Missing tenant information",
    );
  });

  it("should throw if accommodation info missing on lease", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 123,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
      ...baseLease,
      accommodation: null,
    });

    await expect(getRentReceiptDataFromLease(123)).rejects.toThrow(
      "Missing accommodation",
    );
  });

  it("should throw if landlord info missing", async () => {
    (prisma.accommodation.findUnique as jest.Mock).mockResolvedValue({
      ACCN_ID: 123,
    });
    (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
      ...baseLease,
      accommodation: {
        ...baseLease.accommodation,
        owner: null,
      },
    });

    await expect(getRentReceiptDataFromLease(123)).rejects.toThrow(
      "Missing landlord information",
    );
  });
});
