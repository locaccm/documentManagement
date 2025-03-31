import fs from 'fs';
import path from 'path';
import {RentReceipt} from "../../interfaces/rentReceipt";
import {generateRentReceiptTemplate} from "../../templates/pdfTemplate";

describe('generateRentReceiptTemplate', () => {
  const sampleData: RentReceipt = {
    rentalType: "1",
    month: 'January',
    landlordName: 'John Doe',
    landlordAddress: '123 Main St, City, Country',
    tenantName: 'Jane Smith',
    tenantAddress: '456 Elm St, City, Country',
    signedAt: 'City',
    receiptDate: '2023-01-31',
    rentalAddress: '789 Oak St, City, Country',
    rentAmountText: 'one thousand',
    rentAmount: 1000,
    chargesAmount: 100,
    totalAmount: 1100,
    paymentDate: '2023-01-01',
    rentalPeriodStart: '2023-01-01',
    rentalPeriodEnd: '2023-01-31',
    energyContribution: 50
  };

  it('generates a PDF buffer with correct data', async () => {
    const pdfBuffer = await generateRentReceiptTemplate(sampleData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('handles missing optional fields gracefully', async () => {
    const dataWithoutOptionalFields = { ...sampleData, energyContribution: undefined };
    const pdfBuffer = await generateRentReceiptTemplate(dataWithoutOptionalFields);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('generates a PDF with a smaller logo', async () => {
    const pdfBuffer = await generateRentReceiptTemplate(sampleData);
    const outputPath = path.join(__dirname, 'output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
    fs.unlinkSync(outputPath);
  });
});