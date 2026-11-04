'use client';

import { printHtml } from '@/lib/book-labels';

/** A hard copy order as the backend returns it (all purchase rows sharing one charge id). */
export type StoreOrder = {
  reference: string;
  receiptNumber: string | null;
  channel: 'scan' | 'counter' | 'online' | string;
  status: 'paid' | 'pending' | 'cancelled';
  buyerName: string | null;
  buyerPhone: string | null;
  customerEmail: string | null;
  paymentMethod: string | null;
  recordedBy: string | null;
  currency: string;
  items: Array<{ productId: string; title: string; author?: string | null; kind?: 'branded' | 'hard' | 'soft'; imageUrl?: string | null; unitPrice: number; quantity: number; total: number }>;
  quantity: number;
  total: number;
  paidAt: string | null;
  createdAt: string;
};

export const COUNTER_METHODS = ['POS', 'Cash', 'Bank Transfer', 'Airtel Money agent'] as const;

/** How an item is described to customers: branded items are not books. */
export const itemKindLabel = (kind?: string) => (kind === 'branded' ? 'Branded material' : kind === 'soft' ? 'Soft copy' : 'Hard copy');

export const money = (amount: number, currency = 'MWK') => `${currency} ${Number(amount || 0).toLocaleString()}`;

export const receiptDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const STATUS_LABEL: Record<StoreOrder['status'], string> = { paid: 'PAID', pending: 'AWAITING PAYMENT', cancelled: 'CANCELLED' };

/** Prints an 80 mm receipt, which also suits A4 printers. */
export function printReceipt(order: StoreOrder) {
  const rows = order.items.map((item) => `
    <tr><td>${escapeHtml(item.title)}<br><span class="muted">${escapeHtml(itemKindLabel(item.kind))} · ${item.quantity} × ${escapeHtml(money(item.unitPrice, order.currency))}</span></td>
    <td class="right">${escapeHtml(money(item.total, order.currency))}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(order.receiptNumber || '')}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; width: 72mm; margin: 0 auto; }
  h1 { font-size: 15px; margin: 0; text-align: center; }
  .center { text-align: center; } .muted { color: #555; font-size: 11px; } .right { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  td { padding: 4px 0; vertical-align: top; border-bottom: 1px dashed #bbb; }
  .total td { font-weight: 700; font-size: 14px; border-bottom: 0; }
  .status { margin: 8px 0; padding: 4px; border: 2px solid #111; text-align: center; font-weight: 700; letter-spacing: 1px; }
</style></head><body>
  <h1>HOPE BOOKSHOP</h1>
  <p class="center muted">Pentecost International Christian Centre<br>Area 49, Lilongwe · info@piccworldwide.org</p>
  <p><strong>Receipt:</strong> ${escapeHtml(order.receiptNumber || order.reference.slice(-10))}<br>
  <strong>Date:</strong> ${escapeHtml(receiptDate(order.paidAt || order.createdAt))}<br>
  ${order.buyerName ? `<strong>Customer:</strong> ${escapeHtml(order.buyerName)}<br>` : ''}
  ${order.buyerPhone ? `<strong>Phone:</strong> ${escapeHtml(order.buyerPhone)}<br>` : ''}
  <strong>Payment:</strong> ${escapeHtml(order.paymentMethod || '')}</p>
  <table>${rows}<tr class="total"><td>TOTAL</td><td class="right">${escapeHtml(money(order.total, order.currency))}</td></tr></table>
  <div class="status">${STATUS_LABEL[order.status]}</div>
  ${order.recordedBy ? `<p class="muted">Served by ${escapeHtml(order.recordedBy)}</p>` : ''}
  <p class="center muted">Thank you for shopping with Hope Bookshop.</p>
</body></html>`;
  printHtml(html, 'Receipt');
}

export async function downloadReceiptPdf(order: StoreOrder) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: [80, 140 + order.items.length * 10] });
  let y = 10;
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
  const details: Array<[string, string | null]> = [
    ['Receipt', order.receiptNumber || order.reference.slice(-10)],
    ['Date', receiptDate(order.paidAt || order.createdAt)],
    ['Customer', order.buyerName],
    ['Phone', order.buyerPhone],
    ['Payment', order.paymentMethod],
  ];
  details.filter(([, value]) => value).forEach(([label, value]) => {
    line(`${label}:`, { bold: true });
    line(String(value), { x: 26 });
    y += 5;
  });
  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, 74, y);
  y += 5;
  order.items.forEach((item) => {
    const title = doc.splitTextToSize(item.title, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(title, 6, y);
    line(money(item.total, order.currency), { align: 'right' });
    y += title.length * 4;
    line(`${itemKindLabel(item.kind)} · ${item.quantity} × ${money(item.unitPrice, order.currency)}`, { size: 8 });
    y += 6;
  });
  doc.line(6, y - 2, 74, y - 2);
  y += 4;
  line('TOTAL', { bold: true, size: 11 });
  line(money(order.total, order.currency), { bold: true, size: 11, align: 'right' });
  y += 9;
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.6);
  doc.rect(6, y - 5, 68, 8);
  line(STATUS_LABEL[order.status], { bold: true, size: 10, align: 'center' });
  y += 10;
  if (order.recordedBy) {
    line(`Served by ${order.recordedBy}`, { size: 8 });
    y += 5;
  }
  line('Thank you for shopping with Hope Bookshop.', { size: 8, align: 'center' });
  doc.save(`receipt-${order.receiptNumber || order.reference.slice(-10)}.pdf`);
}
