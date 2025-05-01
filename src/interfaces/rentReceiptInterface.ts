export interface RentReceiptInterface {
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
  totalAmount: number;
  paymentDate: string;
}
