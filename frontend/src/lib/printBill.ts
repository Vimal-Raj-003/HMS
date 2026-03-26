import { pharmacyAPI } from './api';

// HTML escape to prevent XSS
const esc = (str: string | null | undefined): string => {
  if (str == null) return '';
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, c => entities[c]);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatExpiryDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
};

export function generateIndianBillHTML(data: any): string {
  const bill = data.bill;
  const hospital = data.hospital;
  const items = bill.items || [];
  const patient = bill.patient;
  const doctor = bill.prescription?.doctor;
  const prescriptionNumber = bill.prescription?.prescriptionNumber;

  // Compute totals
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  const itemRows = items.map((item: any, idx: number) => {
    const qty = item.quantity || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalPrice = Number(item.totalPrice) || unitPrice * qty;
    const mrp = Number(item.mrp) || unitPrice;
    const gstPct = item.gstPercentage || 5;
    const cgst = item.cgst != null ? Number(item.cgst) : Math.round(totalPrice * (gstPct / 2) / 100 * 100) / 100;
    const sgst = item.sgst != null ? Number(item.sgst) : Math.round(totalPrice * (gstPct / 2) / 100 * 100) / 100;
    const hsnCode = item.hsnCode || '3004';
    const discPct = mrp > unitPrice ? Math.round((1 - unitPrice / mrp) * 100) : 0;
    const amount = totalPrice + cgst + sgst;

    totalTaxable += totalPrice;
    totalCgst += cgst;
    totalSgst += sgst;

    return `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>
          ${esc(item.medicineName)}
          ${item.medicine?.genericName ? `<br><small style="color:#666">${esc(item.medicine.genericName)}</small>` : ''}
        </td>
        <td style="text-align:center">${esc(hsnCode)}</td>
        <td style="text-align:center">${esc(item.batchNumber) || '-'}</td>
        <td style="text-align:center">${formatExpiryDate(item.expiryDate)}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">${mrp.toFixed(2)}</td>
        <td style="text-align:right">${unitPrice.toFixed(2)}</td>
        <td style="text-align:center">${discPct > 0 ? discPct + '%' : '-'}</td>
        <td style="text-align:right">${totalPrice.toFixed(2)}</td>
        <td style="text-align:center">${(gstPct / 2).toFixed(1)}%</td>
        <td style="text-align:right">${cgst.toFixed(2)}</td>
        <td style="text-align:center">${(gstPct / 2).toFixed(1)}%</td>
        <td style="text-align:right">${sgst.toFixed(2)}</td>
        <td style="text-align:right"><strong>${amount.toFixed(2)}</strong></td>
      </tr>`;
  }).join('');

  const grandTotal = totalTaxable + totalCgst + totalSgst - Number(bill.discount || 0);
  const roundOff = Math.round(grandTotal) - grandTotal;
  const finalTotal = Math.round(grandTotal);

  return `<!DOCTYPE html>
<html>
<head>
  <title>Bill - ${esc(bill.billNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; max-width: 900px; margin: 0 auto; font-size: 12px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 12px; margin-bottom: 12px; }
    .hospital-name { font-size: 22px; font-weight: bold; color: #1a56db; }
    .hospital-detail { color: #555; font-size: 11px; margin-top: 3px; }
    .gstin { font-weight: 600; color: #333; margin-top: 4px; }
    .bill-title { text-align: center; font-size: 14px; font-weight: bold; background: #f0f4ff; padding: 6px; margin-bottom: 12px; border: 1px solid #d0d8f0; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .info-box { width: 48%; }
    .info-box p { margin: 2px 0; }
    .info-label { font-weight: 600; color: #555; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #1a56db; color: white; padding: 6px 4px; text-align: center; font-size: 10px; font-weight: 600; }
    td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    tr:hover { background: #f9fafb; }
    .totals-grid { display: flex; justify-content: space-between; margin-top: 10px; }
    .amount-words { flex: 1; padding: 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px; }
    .totals-box { width: 280px; }
    .totals-box table { margin-bottom: 0; }
    .totals-box td { border-bottom: 1px solid #eee; padding: 4px 8px; }
    .totals-box .grand-total td { font-size: 14px; font-weight: bold; background: #f0f4ff; border-top: 2px solid #1a56db; }
    .footer { margin-top: 20px; text-align: center; color: #888; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .payment-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 10px; font-weight: 600; font-size: 11px; }
    @media print {
      body { padding: 0; }
      tr:hover { background: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="hospital-name">${esc(hospital?.name) || 'Hospital'}</div>
    <div class="hospital-detail">${esc(hospital?.address) || ''}</div>
    ${hospital?.phone ? `<div class="hospital-detail">Phone: ${esc(hospital.phone)} ${hospital?.email ? ' | Email: ' + esc(hospital.email) : ''}</div>` : ''}
    ${hospital?.gstNumber ? `<div class="gstin">GSTIN: ${esc(hospital.gstNumber)}</div>` : ''}
  </div>

  <div class="bill-title">Tax Invoice / Pharmacy Bill</div>

  <div class="info-grid">
    <div class="info-box">
      <p><span class="info-label">Bill No:</span> ${esc(bill.billNumber)}</p>
      <p><span class="info-label">Date:</span> ${formatDate(bill.createdAt)}</p>
      ${prescriptionNumber ? `<p><span class="info-label">Rx No:</span> ${esc(prescriptionNumber)}</p>` : ''}
      <p><span class="info-label">Payment:</span> <span class="payment-badge">${esc((bill.paymentMethod || '').toUpperCase())}</span></p>
    </div>
    <div class="info-box" style="text-align:right">
      <p><span class="info-label">Patient:</span> ${esc(patient?.firstName)} ${esc(patient?.lastName)}</p>
      <p><span class="info-label">ID:</span> ${esc(patient?.patientNumber)}</p>
      ${patient?.phone ? `<p><span class="info-label">Phone:</span> ${esc(patient.phone)}</p>` : ''}
      ${doctor ? `<p><span class="info-label">Doctor:</span> Dr. ${esc(doctor.firstName)} ${esc(doctor.lastName)}${doctor.specialty ? ' (' + esc(doctor.specialty) + ')' : ''}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Medicine</th>
        <th>HSN</th>
        <th>Batch</th>
        <th>Expiry</th>
        <th>Qty</th>
        <th>MRP</th>
        <th>Rate</th>
        <th>Disc%</th>
        <th>Taxable</th>
        <th>CGST%</th>
        <th>CGST</th>
        <th>SGST%</th>
        <th>SGST</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals-grid">
    <div class="amount-words">
      <strong>Amount in Words:</strong><br>
      ${numberToWords(finalTotal)}
    </div>
    <div class="totals-box">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(totalTaxable)}</td></tr>
        ${Number(bill.discount) > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatCurrency(Number(bill.discount))}</td></tr>` : ''}
        <tr><td>CGST Total</td><td style="text-align:right">${formatCurrency(totalCgst)}</td></tr>
        <tr><td>SGST Total</td><td style="text-align:right">${formatCurrency(totalSgst)}</td></tr>
        ${Math.abs(roundOff) > 0.001 ? `<tr><td>Round Off</td><td style="text-align:right">${roundOff >= 0 ? '+' : ''}${roundOff.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-total"><td>Grand Total</td><td style="text-align:right">${formatCurrency(finalTotal)}</td></tr>
      </table>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated bill and does not require a signature.</p>
    <p>E. & O.E. | Thank you for your visit!</p>
  </div>

  <script>window.print();</script>
</body>
</html>`;
}

export async function printBill(billId: string): Promise<void> {
  try {
    const response = await pharmacyAPI.getBillForDownload(billId);
    const data = (response as any).data;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateIndianBillHTML(data));
      printWindow.document.close();
    }
  } catch (error) {
    console.error('Error printing bill:', error);
    alert('Failed to generate bill for printing');
  }
}
