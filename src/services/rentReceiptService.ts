import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getRentReceiptDataFromLease = async (accnId: number) => {
  const initialLease = await prisma.accommodation.findUnique({
    where: { ACCN_ID: accnId },
  });

  if (!initialLease || !initialLease.ACCN_ID) {
    throw new Error("Lease not found or missing accommodation ID");
  }

  const lease = await prisma.lease.findFirst({
    where: {
      ACCN_ID: initialLease.ACCN_ID,
      LEAB_ACTIVE: true,
    },
    include: {
      user: true,
      accommodation: {
        include: { owner: true },
      },
    },
  });

  if (!lease) {
    throw new Error("Active lease not found for this accommodation");
  }

  if (!lease.user) {
    throw new Error("Missing tenant information");
  }

  if (!lease.accommodation) {
    throw new Error("Missing accommodation");
  }

  if (!lease.accommodation.owner) {
    throw new Error("Missing landlord information");
  }

  const tenant = lease.user;
  const property = lease.accommodation;
  const landlord = lease.accommodation.owner;

  const rent = parseFloat(lease.LEAN_RENT?.toString() ?? "0");
  const charges = parseFloat(lease.LEAN_CHARGES?.toString() ?? "0");
  const total = rent + charges;

  return {
    receiptNumber: `Q-${lease.LEAN_ID}`,
    rentalType: property.ACCC_TYPE ?? "Location",
    month: lease.LEAD_START
      ? lease.LEAD_START.toLocaleString("fr-FR", {
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" }),
    landlordName:
      `${landlord.USEC_FNAME ?? ""} ${landlord.USEC_LNAME ?? ""}`.trim(),
    landlordAddress: landlord.USEC_ADDRESS ?? "",
    tenantName: `${tenant.USEC_FNAME ?? ""} ${tenant.USEC_LNAME ?? ""}`.trim(),
    tenantAddress: tenant.USEC_ADDRESS ?? "",
    signedAt: landlord.USEC_ADDRESS?.split(",")[0] ?? "Lieu inconnu",
    receiptDate: new Date().toISOString().split("T")[0],
    rentalAddress: property.ACCC_ADDRESS ?? "",
    rentalPeriodStart: lease.LEAD_START?.toISOString().split("T")[0] ?? "",
    rentalPeriodEnd: lease.LEAD_END?.toISOString().split("T")[0] ?? "",
    rentAmount: rent,
    rentAmountText: `${rent.toFixed(2)} euros`,
    chargesAmount: charges,
    energyContribution: 0,
    totalAmount: total,
    paymentDate: lease.LEAD_PAYMENT?.toISOString().split("T")[0] ?? "",
  };
};
