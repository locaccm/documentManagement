export interface RentReceiptInterface {
    month: string;
    landlordName: string;
    landlordAddress: string;
    tenantName: string;
    tenantAddress: string;
    signedAt: Date;
    receiptDate: Date;
    rentalAddress: string;
    rentalPeriodStart: Date;
    rentalPeriodEnd: Date;
    rentAmount: number;
    rentAmountText: string;
    chargesAmount: number;
    totalAmount: number;
    paymentDate: Date;
}
