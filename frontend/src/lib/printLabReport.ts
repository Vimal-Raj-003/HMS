// HTML escape to prevent XSS
const esc = (str: string | null | undefined): string => {
  if (str == null) return '';
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, c => entities[c]);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface LabReportResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: string;
}

interface LabReportData {
  orderNumber?: string;
  testName: string;
  category: string;
  date: string;
  doctorName: string;
  doctorSpecialty?: string;
  status: string;
  results: LabReportResult[];
  notes?: string;
  patientName: string;
  patientId?: string;
}

function getInterpretationStyle(interpretation: string): string {
  switch (interpretation.toUpperCase()) {
    case 'CRITICAL':
      return 'color: #dc2626; font-weight: bold;';
    case 'ABNORMAL':
      return 'color: #d97706; font-weight: 600;';
    case 'NORMAL':
      return 'color: #16a34a;';
    default:
      return 'color: #6b7280;';
  }
}

export function generateLabReportHTML(data: LabReportData): string {
  const resultRows = data.results
    .map(
      (r, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${esc(r.parameter)}</td>
        <td style="text-align:center; font-weight:600">${esc(r.value)}</td>
        <td style="text-align:center">${esc(r.unit)}</td>
        <td style="text-align:center">${esc(r.referenceRange)}</td>
        <td style="text-align:center"><span style="${getInterpretationStyle(r.interpretation)}">${esc(r.interpretation.toUpperCase())}</span></td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Lab Report${data.orderNumber ? ' - ' + esc(data.orderNumber) : ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 13px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #1a56db; padding-bottom: 14px; margin-bottom: 16px; }
    .report-title { font-size: 20px; font-weight: bold; color: #1a56db; letter-spacing: 1px; text-transform: uppercase; }
    .report-subtitle { color: #666; font-size: 12px; margin-top: 4px; }
    .info-grid { display: flex; justify-content: space-between; margin-bottom: 18px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .info-box { width: 48%; }
    .info-box p { margin: 3px 0; font-size: 12px; }
    .info-label { font-weight: 600; color: #475569; display: inline-block; min-width: 80px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #1a56db; color: white; padding: 8px 6px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    tr:nth-child(even) { background: #f9fafb; }
    .notes-box { padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 16px; }
    .notes-box .notes-label { font-weight: 600; color: #1e40af; font-size: 12px; margin-bottom: 4px; }
    .notes-box p { font-size: 12px; color: #1e3a5f; }
    .status-badge { display: inline-block; padding: 2px 12px; border-radius: 12px; font-weight: 600; font-size: 11px; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #e2e8f0; }
    .footer-note { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 8px; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { text-align: center; width: 200px; }
    .signature-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 4px; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="report-title">Laboratory Test Report</div>
    <div class="report-subtitle">Diagnostic Report</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <p><span class="info-label">Patient:</span> ${esc(data.patientName)}</p>
      ${data.patientId ? `<p><span class="info-label">Patient ID:</span> ${esc(data.patientId)}</p>` : ''}
      <p><span class="info-label">Date:</span> ${formatDate(data.date)}</p>
      ${data.orderNumber ? `<p><span class="info-label">Order No:</span> ${esc(data.orderNumber)}</p>` : ''}
    </div>
    <div class="info-box" style="text-align:right">
      <p><span class="info-label">Referred By:</span> Dr. ${esc(data.doctorName)}</p>
      ${data.doctorSpecialty ? `<p><span class="info-label">Specialty:</span> ${esc(data.doctorSpecialty)}</p>` : ''}
      <p><span class="info-label">Category:</span> ${esc(data.category)}</p>
      <p><span class="info-label">Status:</span> <span class="status-badge ${data.status === 'COMPLETED' ? 'status-completed' : 'status-pending'}">${esc(data.status)}</span></p>
    </div>
  </div>

  <div class="section-title">Test: ${esc(data.testName)}</div>

  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th style="text-align:left">Parameter</th>
        <th>Result</th>
        <th>Unit</th>
        <th>Reference Range</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${resultRows || '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">Results pending</td></tr>'}
    </tbody>
  </table>

  ${data.notes ? `
  <div class="notes-box">
    <div class="notes-label">Clinical Notes</div>
    <p>${esc(data.notes)}</p>
  </div>
  ` : ''}

  <div class="footer">
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">Lab Technician</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Pathologist</div>
      </div>
    </div>
    <div class="footer-note">
      <p>This is a computer-generated report.</p>
      <p>Please consult your doctor for interpretation of results.</p>
    </div>
  </div>

  <script>window.print();</script>
</body>
</html>`;
}

export function printLabReport(data: LabReportData): void {
  const html = generateLabReportHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
