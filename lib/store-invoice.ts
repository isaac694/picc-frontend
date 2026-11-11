'use client';

import { printHtml, publicSiteOrigin } from '@/lib/book-labels';

/**
 * A Hope Publishing House book invoice, laid out to match PICC_Book_Invoice.docx:
 * PICC seal, HPH address and the Hope Publishing House logo across the top, then
 * Bill To / Document Details, the book table, totals, payment instructions and Issued By.
 */
export type InvoiceStatus = 'requested' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';

export type InvoiceLine = {
  /** Set when the line is a store book; empty for a free-text line staff typed in. */
  productId?: string | null;
  title: string;
  /** ISBN and/or edition, shown in the "ISBN / Edition" column. */
  isbnEdition?: string | null;
  quantity: number;
  unitPrice: number;
};

export type StoreInvoice = {
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  billToName: string;
  billToAddress?: string | null;
  billToContact?: string | null;
  billToEmail?: string | null;
  customerReference?: string | null;
  /** Quotation or order reference, e.g. a store order receipt number. */
  orderReference?: string | null;
  currency: string;
  items: InvoiceLine[];
  discount: number;
  delivery: number;
  amountPaid: number;
  paymentInstructions?: string | null;
  issuedBy?: string | null;
  /** The key to the public invoice page. */
  accessToken?: string;
  subtotal?: number;
  total?: number;
  balanceDue?: number;
  createdAt?: string;
};

export type InvoicePayment = { amount: number; method: string; reference: string | null; at: string; by: string | null };

/** What the admin API returns: the invoice plus staff-only details. */
export type AdminInvoice = StoreInvoice & {
  id: string;
  accessToken: string;
  source: 'request' | 'counter' | string;
  customerNote: string | null;
  payments: InvoicePayment[];
  saleReference: string | null;
  saleReceiptNumber: string | null;
  subtotal: number;
  total: number;
  balanceDue: number;
  createdAt: string;
};

export const invoiceShareUrl = (invoice: Pick<StoreInvoice, 'accessToken'>) =>
  `${publicSiteOrigin()}/store/invoice/${encodeURIComponent(invoice.accessToken || '')}`;

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  requested: 'Requested',
  issued: 'Issued',
  partially_paid: 'Partly paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const HPH_DETAILS = {
  name: 'PICC HOPE PUBLISHING HOUSE',
  lines: ['P.O Box 31841, Lilongwe Malawi', 'Contact +265 884748498', 'Email: hph@piccworldwide.org', 'Website: piccworldwide.org'],
};

const SEAL_SRC = '/store/invoice/picc-seal.png';
const HPH_LOGO_SRC = '/store/invoice/hope-publishing-house.png';

const lineAmount = (line: InvoiceLine) => Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0);

export function invoiceTotals(invoice: Pick<StoreInvoice, 'items' | 'discount' | 'delivery' | 'amountPaid'>) {
  const subtotal = invoice.items.reduce((sum, line) => sum + lineAmount(line), 0);
  const discount = Math.max(0, Number(invoice.discount) || 0);
  const delivery = Math.max(0, Number(invoice.delivery) || 0);
  const total = Math.max(0, subtotal - discount + delivery);
  const amountPaid = Math.max(0, Number(invoice.amountPaid) || 0);
  return { subtotal, discount, delivery, total, amountPaid, balanceDue: Math.max(0, total - amountPaid) };
}

const amount = (value: number) => Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const invoiceDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const multiline = (value?: string | null) => escapeHtml(value || '').replace(/\n/g, '<br>');

/** Shown in place of a value that has not been filled in, as on the printed form. */
const BLANK = '<span class="blank">&nbsp;</span>';
const filled = (value?: string | null) => (value && value.trim() ? escapeHtml(value.trim()) : BLANK);

/** The design shows at least eight item rows so a short invoice still looks like the form. */
const MIN_ROWS = 8;

export function invoiceHtml(invoice: StoreInvoice, origin = window.location.origin) {
  const totals = invoiceTotals(invoice);
  const currency = escapeHtml(invoice.currency || 'MWK');
  const rows = [...invoice.items];
  while (rows.length < MIN_ROWS) rows.push({ title: '', quantity: 0, unitPrice: 0 });
  const itemRows = rows.map((line, index) => {
    const empty = !line.title;
    return `<tr class="${index % 2 === 0 ? 'shade' : ''}">
      <td class="num">${index + 1}</td>
      <td>${escapeHtml(line.title)}</td>
      <td>${escapeHtml(line.isbnEdition || '')}</td>
      <td class="right">${empty ? '' : escapeHtml(line.quantity)}</td>
      <td class="right">${empty ? '' : amount(line.unitPrice)}</td>
      <td class="right">${empty ? '' : amount(lineAmount(line))}</td>
    </tr>`;
  }).join('');
  const stamp = invoice.status === 'paid' ? 'PAID' : invoice.status === 'cancelled' ? 'CANCELLED' : invoice.status === 'requested' ? 'REQUESTED' : '';
  const paymentLines = (invoice.paymentInstructions || '').trim();

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Calibri, Carlito, 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #123747; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: 210mm; min-height: 297mm; padding: 13mm 18mm 18mm; background: #fff; }
  .head { display: grid; grid-template-columns: 25mm 1fr 43mm; align-items: center; gap: 6mm; padding-bottom: 5mm; border-bottom: 1.5pt solid #123747; }
  .head img.seal { width: 25mm; height: 25mm; object-fit: contain; }
  .head img.hph { width: 43mm; height: auto; justify-self: end; }
  .head .org { text-align: center; line-height: 1.45; font-size: 9.5pt; }
  .head .org strong { display: block; font-size: 12pt; letter-spacing: 0.5pt; margin-bottom: 1mm; }
  h1 { margin: 9mm 0 6mm; font-size: 28pt; font-weight: 700; color: #000; letter-spacing: -0.3pt; }
  .label { color: #087989; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; font-size: 9pt; }
  .details { display: grid; grid-template-columns: 1fr 1fr; column-gap: 10mm; row-gap: 2.6mm; margin-bottom: 7mm; }
  .field { display: grid; grid-template-columns: 34mm 1fr; align-items: start; gap: 2mm; }
  .field .value { min-height: 4.6mm; color: #123747; font-weight: 600; word-break: break-word; }
  .blank { display: inline-block; min-width: 1mm; }
  table.items { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.items th { background: #123747; color: #fff; font-weight: 700; text-align: left; padding: 2.2mm 2mm; }
  table.items td { padding: 2mm; height: 7.4mm; vertical-align: middle; word-break: break-word; }
  table.items tr.shade td { background: #F0F6F7; }
  .right { text-align: right !important; }
  .num { color: #425B65; }
  .lower { display: grid; grid-template-columns: 1fr 76mm; gap: 10mm; margin-top: 6mm; align-items: start; }
  .pay .label { font-size: 10pt; text-transform: none; letter-spacing: 0; display: block; margin-bottom: 2mm; }
  .pay .lines { color: #425B65; line-height: 1.7; }
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { padding: 1.9mm 2.5mm; background: #F3F7F8; border-bottom: 1.2pt solid #fff; }
  table.totals td:last-child { text-align: right; width: 32mm; font-variant-numeric: tabular-nums; }
  table.totals tr.strong td { font-weight: 700; background: #E4F1F3; }
  table.totals tr.balance td { font-weight: 700; background: #123747; color: #fff; }
  .issued { margin-top: 14mm; font-size: 10pt; display: flex; gap: 3mm; align-items: end; }
  .issued .value { min-width: 70mm; font-weight: 600; }
  .stamp { position: absolute; top: 52mm; right: 24mm; transform: rotate(-12deg); border: 2.4pt solid currentColor; padding: 1.5mm 5mm; font-size: 20pt; font-weight: 800; letter-spacing: 2pt; border-radius: 2mm; opacity: 0.8; }
  .stamp.paid { color: #0a7a4f; } .stamp.cancelled { color: #b4232c; } .stamp.requested { color: #8a6d1f; font-size: 15pt; }
  .foot { margin-top: 10mm; font-size: 8pt; color: #425B65; text-align: center; }
</style></head><body><div class="page">
  <div class="head">
    <img class="seal" src="${origin}${SEAL_SRC}" alt="Pentecost International Christian Centre">
    <div class="org"><strong>${HPH_DETAILS.name}</strong>${HPH_DETAILS.lines.map(escapeHtml).join('<br>')}</div>
    <img class="hph" src="${origin}${HPH_LOGO_SRC}" alt="Hope Publishing House">
  </div>
  ${stamp ? `<div class="stamp ${stamp.toLowerCase()}">${stamp}</div>` : ''}
  <h1>Book Invoice</h1>
  <div class="details">
    <div class="label">Bill To</div><div class="label">Document Details</div>
    <div class="field"><span>Name / Organisation</span><span class="value">${filled(invoice.billToName)}</span></div>
    <div class="field"><span>Invoice No.</span><span class="value">${filled(invoice.invoiceNumber)}</span></div>
    <div class="field"><span>Address</span><span class="value">${filled(invoice.billToAddress)}</span></div>
    <div class="field"><span>Issue Date</span><span class="value">${filled(invoiceDate(invoice.issueDate))}</span></div>
    <div class="field"><span>Contact</span><span class="value">${filled([invoice.billToContact, invoice.billToEmail].filter(Boolean).join(' · '))}</span></div>
    <div class="field"><span>Due Date</span><span class="value">${filled(invoiceDate(invoice.dueDate))}</span></div>
    <div class="field"><span>Customer Reference</span><span class="value">${filled(invoice.customerReference)}</span></div>
    <div class="field"><span>Quotation / Order Ref.</span><span class="value">${filled(invoice.orderReference)}</span></div>
  </div>
  <table class="items">
    <colgroup><col style="width:4.9%"><col style="width:35.7%"><col style="width:17.9%"><col style="width:6.9%"><col style="width:16.9%"><col style="width:17.7%"></colgroup>
    <thead><tr><th>#</th><th>Book Title</th><th>ISBN / Edition</th><th class="right">Qty</th><th class="right">Unit Price (${currency})</th><th class="right">Amount (${currency})</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="lower">
    <div class="pay">
      <span class="label">Payment Instructions</span>
      ${paymentLines ? `<div class="lines">${multiline(paymentLines)}</div>` : ''}
    </div>
    <table class="totals">
      <tr><td>Subtotal</td><td>${amount(totals.subtotal)}</td></tr>
      <tr><td>Discount (if applicable)</td><td>${totals.discount ? `− ${amount(totals.discount)}` : '—'}</td></tr>
      <tr><td>Delivery (if applicable)</td><td>${totals.delivery ? amount(totals.delivery) : '—'}</td></tr>
      <tr class="strong"><td>Invoice Total</td><td>${currency} ${amount(totals.total)}</td></tr>
      <tr><td>Amount Paid</td><td>${amount(totals.amountPaid)}</td></tr>
      <tr class="balance"><td>Balance Due</td><td>${currency} ${amount(totals.balanceDue)}</td></tr>
    </table>
  </div>
  <div class="issued"><span>Issued By</span><span class="value">${filled(invoice.issuedBy)}</span></div>
  <p class="foot">Thank you for supporting Hope Publishing House · Let There Be Light</p>
</div></body></html>`;
}

export const invoiceFileName = (invoice: StoreInvoice) => `invoice-${invoice.invoiceNumber || 'draft'}.pdf`;

/** Prints the A4 invoice through the browser's print dialog (also "Save as PDF"). */
export function printInvoice(invoice: StoreInvoice) {
  printHtml(invoiceHtml(invoice), `Invoice ${invoice.invoiceNumber}`);
}

/** Renders the same HTML off screen and turns it into an A4 PDF, adding pages if the item list runs long. */
export async function buildInvoicePdf(invoice: StoreInvoice) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const frame = document.createElement('iframe');
  Object.assign(frame.style, { position: 'fixed', left: '-10000px', top: '0', width: '794px', height: '1123px', border: '0' });
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error('Could not prepare the invoice.');
    doc.open();
    doc.write(invoiceHtml(invoice));
    doc.close();
    await Promise.all(Array.from(doc.images).map((image) => (image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
    }))));
    const page = doc.querySelector('.page') as HTMLElement;
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 794 });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const pxPerPage = Math.floor((canvas.width * pageHeight) / pageWidth);
    for (let offset = 0, index = 0; offset < canvas.height; offset += pxPerPage, index += 1) {
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.min(pxPerPage, canvas.height - offset);
      slice.getContext('2d')?.drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
      if (index > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, (slice.height * pageWidth) / canvas.width);
    }
    return pdf;
  } finally {
    frame.remove();
  }
}

export async function downloadInvoicePdf(invoice: StoreInvoice) {
  const pdf = await buildInvoicePdf(invoice);
  pdf.save(invoiceFileName(invoice));
}
