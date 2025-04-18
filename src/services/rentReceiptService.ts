import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRentReceiptDataFromLease = async (leaseId: number) => {
    const lease = await prisma.lease.findUnique({
        where: { LEAN_ID: leaseId },
        include: {
            user: true,
            accommodation: {
                include: { owner: true }
            }
        }
    });

    if (!lease || !lease.user || !lease.accommodation || !lease.accommodation.owner) {
        throw new Error("Missing data to generate the rent receipt");
    }

    const tenant = lease.user;
    const property = lease.accommodation;
    const landlord = lease.accommodation.owner;
    if (!landlord) {
        throw new Error("Missing landlord information");
    }


    const rent = parseFloat(lease.LEAN_RENT?.toString() ?? '0');
    const charges = parseFloat(lease.LEAN_CHARGES?.toString() ?? '0');
    const total = rent + charges;

    return {
        receiptNumber: `Q-${lease.LEAN_ID}`,
        rentalType: property.ACCC_TYPE ?? 'Location',
        month: lease.LEAD_START
            ? lease.LEAD_START.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
            : new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
        landlordName: `${landlord.USEC_FNAME ?? ''} ${landlord.USEC_LNAME ?? ''}`.trim(),
        landlordAddress: landlord.USEC_ADDRESS ?? '',
        tenantName: `${tenant.USEC_FNAME ?? ''} ${tenant.USEC_LNAME ?? ''}`.trim(),
        tenantAddress: tenant.USEC_ADDRESS ?? '',
        signedAt: landlord.USEC_ADDRESS?.split(',')[0] ?? 'Lieu inconnu',
        receiptDate: new Date().toISOString().split('T')[0],
        rentalAddress: property.ACCC_ADDRESS ?? '',
        rentalPeriodStart: lease.LEAD_START?.toISOString().split('T')[0] ?? '',
        rentalPeriodEnd: lease.LEAD_END?.toISOString().split('T')[0] ?? '',
        rentAmount: rent,
        rentAmountText: `${rent.toFixed(2)} euros`,
        chargesAmount: charges,
        energyContribution: 0,
        totalAmount: total,
        paymentDate: lease.LEAD_PAYMENT?.toISOString().split('T')[0] ?? ''
    };
};
