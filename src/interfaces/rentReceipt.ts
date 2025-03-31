export interface RentReceipt {
    receiptNumber?: string;
    rentalType: string;
    month: string;
    landlordName: string;
    landlordAddress: string;
    tenantName: string;
    tenantAddress: string;
    signedAt: string;
    receiptDate: string;
    rentalAddress: string;
    rentalPeriodStart: string;
    rentalPeriodEnd: string;
    rentAmount: number;
    rentAmountText: string;
    chargesAmount: number;
    energyContribution?: number;
    totalAmount: number;
    paymentDate: string;
}
