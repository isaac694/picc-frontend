'use client';

import { printHtml } from '@/lib/book-labels';
import { loadLogoForPdf, money, receiptDate } from '@/lib/store-receipt';

/** One full or part payment towards a book launch order, as the backend returns it. */
export type LaunchPayment = {
  id: string;
  saleId: string;
  amount: number;
  medium: string | null;
  reference: string | null;
  receiptNumber: string;
  paidToDate: number;
  balanceAfter: number;
  recordedBy: string | null;
  createdAt: string;
  buyerName: string | null;
  contact: string | null;
  email: string | null;
  quantity: number | null;
  saleTotal: number | null;
  launchName: string | null;
  bookTitle: string | null;
};

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const settled = (receipt: LaunchPayment) => Number(receipt.balanceAfter || 0) <= 0;
export const launchReceiptStatus = (receipt: LaunchPayment) => (settled(receipt) ? 'PAID IN FULL' : 'PART PAYMENT');

function details(receipt: LaunchPayment): Array<[string, string]> {
  const rows: Array<[string, string | number | null]> = [
    ['Receipt', receipt.receiptNumber],
    ['Date', receiptDate(receipt.createdAt)],
    ['Customer', receipt.buyerName],
    ['Phone', receipt.contact],
    ['Launch', receipt.launchName],
    ['Book', receipt.bookTitle],
    ['Copies', receipt.quantity],
    ['Payment', receipt.medium],
    ['Reference', receipt.reference],
  ];
  return rows.filter(([, value]) => value !== null && value !== '').map(([label, value]) => [label, String(value)]);
}

function totals(receipt: LaunchPayment): Array<[string, string, boolean]> {
  return [
    ['Order total', money(receipt.saleTotal || 0), false],
    ['PAID NOW', money(receipt.amount), true],
    ['Paid to date', money(receipt.paidToDate), false],
    ['BALANCE', money(receipt.balanceAfter), true],
  ];
}

/** Prints an 80 mm receipt for one payment, which also suits A4 printers. */
export function printLaunchReceipt(receipt: LaunchPayment) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.receiptNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; width: 72mm; margin: 0 auto; }
  .logo { display: block; width: 22mm; height: auto; margin: 0 auto 4px; }
  h1 { font-size: 15px; margin: 0; text-align: center; }
  .center { text-align: center; } .muted { color: #555; font-size: 11px; } .right { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  td { padding: 3px 0; vertical-align: top; }
  .totals td { border-top: 1px dashed #bbb; padding: 4px 0; }
  .strong td { font-weight: 700; font-size: 13px; }
  .status { margin: 8px 0; padding: 4px; border: 2px solid #111; text-align: center; font-weight: 700; letter-spacing: 1px; }
</style></head><body>
  <img class="logo" src="${window.location.origin}/logo.png" alt="PICC">
  <h1>HOPE BOOKSHOP</h1>
  <p class="center muted">Pentecost International Christian Centre<br>Area 49, Lilongwe · info@piccworldwide.org</p>
  <table>${details(receipt).map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}:</strong></td><td class="right">${escapeHtml(value)}</td></tr>`).join('')}</table>
  <table class="totals">${totals(receipt).map(([label, value, strong]) => `<tr${strong ? ' class="strong"' : ''}><td>${escapeHtml(label)}</td><td class="right">${escapeHtml(value)}</td></tr>`).join('')}</table>
  <div class="status">${launchReceiptStatus(receipt)}</div>
  ${receipt.recordedBy ? `<p class="muted">Served by ${escapeHtml(receipt.recordedBy)}</p>` : ''}
  <p class="center muted">Thank you for supporting this book launch.</p>
</body></html>`;
  printHtml(html, 'Receipt');
}

export async function downloadLaunchReceiptPdf(receipt: LaunchPayment) {
  const { default: jsPDF } = await import('jspdf');
  const logo = await loadLogoForPdf();
  const rows = details(receipt);
  const doc = new jsPDF({ unit: 'mm', format: [80, 120 + rows.length * 6] });
  let y = 10;
  if (logo) {
    doc.addImage(logo, 'PNG', 29, 5, 22, 22.3);
    y = 32;
  }
  const line = (text: string, options: { bold?: boolean; size?: number; align?: 'left' | 'center' | 'right'; x?: number } = {}) => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size || 9);
    const x = options.x ?? (options.align === 'center' ? 40 : options.align === 'right' ? 74 : 6);
    doc.text(text, x, y, { align: options.align || 'left' });
  };
  line('HOPE BOOKSHOP', { bold: true, size: 13, align: 'center' });
  y += 5;
  line('Pentecost International Christian Centre', { size: 8, align: 'center' });
  y += 4;
  line('Area 49, Lilongwe · info@piccworldwide.org', { size: 8, align: 'center' });
  y += 8;
  rows.forEach(([label, value]) => {
    line(`${label}:`, { bold: true });
    const wrapped = doc.splitTextToSize(value, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(wrapped, 28, y);
    y += Math.max(wrapped.length, 1) * 4 + 1;
  });
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, 74, y);
  y += 5;
  totals(receipt).forEach(([label, value, strong]) => {
    line(label, { bold: strong, size: strong ? 10 : 9 });
    line(value, { bold: strong, size: strong ? 10 : 9, align: 'right' });
    y += 6;
  });
  y += 4;
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.6);
  doc.rect(6, y - 5, 68, 8);
  line(launchReceiptStatus(receipt), { bold: true, size: 10, align: 'center' });
  y += 10;
  if (receipt.recordedBy) {
    line(`Served by ${receipt.recordedBy}`, { size: 8 });
    y += 5;
  }
  line('Thank you for supporting this book launch.', { size: 8, align: 'center' });
  doc.save(`receipt-${receipt.receiptNumber}.pdf`);
}
