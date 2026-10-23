export type GivingReportCategory = {
  givingType: string;
  currency: string;
  count: number;
  total: number;
};

export type GivingReportEntry = {
  id: string;
  date?: string;
  fullName?: string;
  givingType?: string;
  specialRecipient?: string | null;
  bookletNumber?: string | null;
  amount?: number;
  currency?: string;
  paymentMethod?: string | null;
  status?: string;
};

export type GivingReport = {
  startDate: string;
  endDate: string;
  status: string;
  count: number;
  categories: GivingReportCategory[];
  totals: Array<{ currency: string; count: number; total: number }>;
  entries: GivingReportEntry[];
};

export function formatReportMoney(amount: number, currency = 'MWK') {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatReportDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function reportPeriodLabel(startDate: string, endDate: string) {
  return `${formatReportDate(`${startDate}T00:00:00.000Z`)} to ${formatReportDate(`${endDate}T00:00:00.000Z`)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printGivingReport(report: GivingReport) {
  const period = reportPeriodLabel(report.startDate, report.endDate);
  const categoryRows = report.categories.map((row) => `
    <tr>
      <td>${escapeHtml(row.givingType)}</td>
      <td>${row.count}</td>
      <td>${escapeHtml(formatReportMoney(row.total, row.currency))}</td>
    </tr>
  `).join('');
  const totalRows = report.totals.map((row) => `
    <tr>
      <td colspan="2">Total (${escapeHtml(row.currency)})</td>
      <td>${escapeHtml(formatReportMoney(row.total, row.currency))}</td>
    </tr>
  `).join('');
  const entryRows = report.entries.map((row) => `
    <tr>
      <td>${escapeHtml(formatReportDate(row.date))}</td>
      <td>${escapeHtml(row.fullName || '')}</td>
      <td>${escapeHtml(row.givingType || '')}${row.specialRecipient ? `<br><span class="muted">${escapeHtml(row.specialRecipient)}</span>` : ''}</td>
      <td>${escapeHtml(row.bookletNumber || '')}</td>
      <td>${escapeHtml(formatReportMoney(Number(row.amount || 0), row.currency))}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Giving report ${escapeHtml(period)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 24px; }
    h1 { font-size: 22px; margin: 0; }
    p { margin: 4px 0; }
    h2 { font-size: 14px; margin: 22px 0 8px; letter-spacing: 0.04em; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #ccc; text-align: left; padding: 6px 8px; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    td:last-child, th:last-child { text-align: right; }
    .totals td { font-weight: 700; }
    .muted { color: #555; font-size: 11px; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <p>Pentecost International Christian Centre</p>
  <h1>Giving report</h1>
  <p>${escapeHtml(period)}</p>
  <p>${report.count} record${report.count === 1 ? '' : 's'}${report.status && report.status !== 'all' ? ` · ${escapeHtml(report.status)}` : ''}</p>
  <h2>By offering type</h2>
  <table>
    <thead><tr><th>Type</th><th>Gifts</th><th>Total</th></tr></thead>
    <tbody>${categoryRows || '<tr><td colspan="3">No gifts in this period.</td></tr>'}</tbody>
    <tbody class="totals">${totalRows}</tbody>
  </table>
  <h2>Gifts</h2>
  <table>
    <thead><tr><th>Date</th><th>Name</th><th>Type</th><th>Booklet</th><th>Amount</th></tr></thead>
    <tbody>${entryRows || '<tr><td colspan="5">No gifts in this period.</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'Giving report');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 250);
}

export async function downloadGivingReportPdf(report: GivingReport) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('PICC Giving report', margin, y + 5);
  y += 10;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(reportPeriodLabel(report.startDate, report.endDate), margin, y);
  y += 5;
  doc.text(`${report.count} record${report.count === 1 ? '' : 's'}${report.status && report.status !== 'all' ? ` · ${report.status}` : ''}`, margin, y);
  y += 8;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('By offering type', margin, y);
  y += 6;
  doc.setFontSize(10);
  const typeWidth = pageWidth - margin * 2;
  report.categories.forEach((row) => {
    ensureSpace(6);
    doc.setFont('times', 'normal');
    doc.text(row.givingType, margin, y);
    doc.text(String(row.count), margin + typeWidth * 0.62, y);
    doc.text(formatReportMoney(row.total, row.currency), pageWidth - margin, y, { align: 'right' });
    y += 5;
  });
  if (report.categories.length === 0) {
    doc.setFont('times', 'italic');
    doc.text('No gifts in this period.', margin, y);
    y += 5;
  }
  report.totals.forEach((row) => {
    ensureSpace(6);
    doc.setFont('times', 'bold');
    doc.text(`Total (${row.currency})`, margin, y);
    doc.text(formatReportMoney(row.total, row.currency), pageWidth - margin, y, { align: 'right' });
    y += 6;
  });

  y += 4;
  ensureSpace(12);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('Gifts', margin, y);
  y += 6;
  doc.setFontSize(9);
  report.entries.forEach((row) => {
    const type = row.specialRecipient ? `${row.givingType || ''} (${row.specialRecipient})` : (row.givingType || '');
    const lines = doc.splitTextToSize(`${formatReportDate(row.date)}  ${row.fullName || ''}  ${type}`, typeWidth - 36);
    ensureSpace(lines.length * 4 + 2);
    doc.setFont('times', 'normal');
    doc.text(lines, margin, y);
    doc.text(formatReportMoney(Number(row.amount || 0), row.currency), pageWidth - margin, y, { align: 'right' });
    y += lines.length * 4 + 1.5;
  });

  doc.save(`giving-report-${report.startDate}-to-${report.endDate}.pdf`);
}
