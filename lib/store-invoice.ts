'use client';

import { printHtml, publicSiteOrigin } from '@/lib/book-labels';

/**
 * Hope Publishing House sales documents share one A4 frame, matching the PICC_Book_*.docx designs:
 * PICC seal, HPH address and the Hope Publishing House logo across the top, a large title, then the
 * two-column details block and the book table. This file has that frame and the invoice; the
 * quotation and delivery note are in store-documents.ts.
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
  /** Quotation or order reference: the quotation number when the invoice came from one. */
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
  paidAt?: string | null;
  createdAt?: string;
};

export type InvoicePayment = {
  index: number;
  amount: number;
  method: string;
  reference: string | null;
  at: string;
  by: string | null;
  note?: string | null;
  /** Set when the money was collected on a delivery note. */
  deliveryNoteId?: string | null;
  voided?: boolean;
  voidedAt?: string;
  voidedBy?: string | null;
  voidReason?: string;
};

export type InvoiceFulfilment = {
  ordered: number;
  delivered: number;
  remaining: number;
  notes: number;
  awaitingSignature: number;
  status: 'none' | 'partial' | 'complete';
  lines: Array<{ line: number; ordered: number; delivered: number; remaining: number }>;
};

/** What the admin API returns: the invoice plus staff-only details. */
export type AdminInvoice = StoreInvoice & {
  id: string;
  accessToken: string;
  source: 'request' | 'counter' | 'quotation' | string;
  customerNote: string | null;
  payments: InvoicePayment[];
  saleReference: string | null;
  saleReceiptNumber: string | null;
  /** Why the books could not be taken out of stock when it was paid. */
  stockError: string | null;
  /** Copies of each line already out of stock. */
  stockOut: number[];
  cancelledAt: string | null;
  quotationId: string | null;
  fulfilment: InvoiceFulfilment | null;
  subtotal: number;
  total: number;
  balanceDue: number;
  createdAt: string;
};

export const invoiceShareUrl = (invoice: Pick<StoreInvoice, 'accessToken'>) =>
  `${publicSiteOrigin()}/store/invoice/${encodeURIComponent(invoice.accessToken || '')}`;

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  requested: 'Requested',
  issued: 'Pending',
  partially_paid: 'Part paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const isOverdue = (invoice: Pick<StoreInvoice, 'status' | 'dueDate'>, now = new Date()) =>
  ['issued', 'partially_paid'].includes(invoice.status) && Boolean(invoice.dueDate) && new Date(invoice.dueDate as string) < now;

export const HPH_DETAILS = {
  name: 'PICC HOPE PUBLISHING HOUSE',
  lines: ['P.O Box 31841, Lilongwe Malawi', 'Contact +265 884748498', 'Email: hph@piccworldwide.org', 'Website: piccworldwide.org'],
};

const SEAL_SRC = '/store/invoice/picc-seal.png';
const HPH_LOGO_SRC = '/store/invoice/hope-publishing-house.png';

export const lineAmount = (line: InvoiceLine) => Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0);

export function invoiceTotals(invoice: Pick<StoreInvoice, 'items' | 'discount' | 'delivery' | 'amountPaid'>) {
  const subtotal = invoice.items.reduce((sum, line) => sum + lineAmount(line), 0);
  const discount = Math.max(0, Number(invoice.discount) || 0);
  const delivery = Math.max(0, Number(invoice.delivery) || 0);
  const total = Math.max(0, subtotal - discount + delivery);
  const amountPaid = Math.max(0, Number(invoice.amountPaid) || 0);
  return { subtotal, discount, delivery, total, amountPaid, balanceDue: Math.max(0, total - amountPaid) };
}

export const documentAmount = (value: number) => Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const invoiceDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const multiline = (value?: string | null) => escapeHtml(value || '').replace(/\n/g, '<br>');

/** Shown in place of a value that has not been filled in, as on the printed form. */
const BLANK = '<span class="blank">&nbsp;</span>';
export const filled = (value?: string | null) => (value && value.trim() ? escapeHtml(value.trim()) : BLANK);

/** The designs show at least eight item rows so a short document still looks like the form. */
export const MIN_ROWS = 8;

/** A "label  value" pair in the two-column details block. */
export const field = (label: string, value?: string | null) =>
  `<div class="field"><span>${escapeHtml(label)}</span><span class="value">${filled(value)}</span></div>`;

/**
 * The shared A4 page. `content` is everything under the title; `stamp` is an optional rubber stamp
 * (PAID, CANCELLED…) with a colour class.
 */
export function documentHtml({ title, heading, content, stamp, css = '', origin = window.location.origin }: {
  title: string;
  heading: string;
  content: string;
  stamp?: { text: string; tone: 'green' | 'red' | 'amber' | 'grey' } | null;
  css?: string;
  origin?: string;
}) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
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
  .side .label { font-size: 10pt; text-transform: none; letter-spacing: 0; display: block; margin-bottom: 2mm; }
  .side .lines { color: #425B65; line-height: 1.7; }
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { padding: 1.9mm 2.5mm; background: #F3F7F8; border-bottom: 1.2pt solid #fff; }
  table.totals td:last-child { text-align: right; width: 32mm; font-variant-numeric: tabular-nums; }
  table.totals tr.strong td { font-weight: 700; background: #E4F1F3; }
  table.totals tr.balance td { font-weight: 700; background: #123747; color: #fff; }
  .by { margin-top: 14mm; font-size: 10pt; display: flex; gap: 3mm; align-items: end; }
  .by .value { min-width: 70mm; font-weight: 600; }
  .stamp { position: absolute; top: 52mm; right: 24mm; transform: rotate(-12deg); border: 2.4pt solid currentColor; padding: 1.5mm 5mm; font-size: 20pt; font-weight: 800; letter-spacing: 2pt; border-radius: 2mm; opacity: 0.8; }
  .stamp.green { color: #0a7a4f; } .stamp.red { color: #b4232c; } .stamp.amber { color: #a1620b; font-size: 16pt; } .stamp.grey { color: #6b7780; font-size: 16pt; }
  .foot { margin-top: 10mm; font-size: 8pt; color: #425B65; text-align: center; }
  ${css}
</style></head><body><div class="page">
  <div class="head">
    <img class="seal" src="${origin}${SEAL_SRC}" alt="Pentecost International Christian Centre">
    <div class="org"><strong>${HPH_DETAILS.name}</strong>${HPH_DETAILS.lines.map(escapeHtml).join('<br>')}</div>
    <img class="hph" src="${origin}${HPH_LOGO_SRC}" alt="Hope Publishing House">
  </div>
  ${stamp ? `<div class="stamp ${stamp.tone}">${escapeHtml(stamp.text)}</div>` : ''}
  <h1>${escapeHtml(heading)}</h1>
  ${content}
  <p class="foot">Thank you for supporting Hope Publishing House · Let There Be Light</p>
</div></body></html>`;
}

/** The six-column book table shared by the invoice and the quotation. */
export function priceTableHtml(items: InvoiceLine[], currency: string) {
  const rows = [...items];
  while (rows.length < MIN_ROWS) rows.push({ title: '', quantity: 0, unitPrice: 0 });
  const body = rows.map((line, index) => {
    const empty = !line.title;
    return `<tr class="${index % 2 === 0 ? 'shade' : ''}">
      <td class="num">${index + 1}</td>
      <td>${escapeHtml(line.title)}</td>
      <td>${escapeHtml(line.isbnEdition || '')}</td>
      <td class="right">${empty ? '' : escapeHtml(line.quantity)}</td>
      <td class="right">${empty ? '' : documentAmount(line.unitPrice)}</td>
      <td class="right">${empty ? '' : documentAmount(lineAmount(line))}</td>
    </tr>`;
  }).join('');
  const code = escapeHtml(currency || 'MWK');
  return `<table class="items">
    <colgroup><col style="width:4.9%"><col style="width:35.7%"><col style="width:17.9%"><col style="width:6.9%"><col style="width:16.9%"><col style="width:17.7%"></colgroup>
    <thead><tr><th>#</th><th>Book Title</th><th>ISBN / Edition</th><th class="right">Qty</th><th class="right">Unit Price (${code})</th><th class="right">Amount (${code})</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

const INVOICE_STAMPS: Partial<Record<InvoiceStatus, { text: string; tone: 'green' | 'red' | 'amber' | 'grey' }>> = {
  paid: { text: 'PAID', tone: 'green' },
  partially_paid: { text: 'PART PAID', tone: 'amber' },
  cancelled: { text: 'CANCELLED', tone: 'red' },
  requested: { text: 'REQUESTED', tone: 'amber' },
};

export function invoiceHtml(invoice: StoreInvoice, origin = window.location.origin) {
  const totals = invoiceTotals(invoice);
  const currency = escapeHtml(invoice.currency || 'MWK');
  const paymentLines = (invoice.paymentInstructions || '').trim();
  const content = `
  <div class="details">
    <div class="label">Bill To</div><div class="label">Document Details</div>
    ${field('Name / Organisation', invoice.billToName)}
    ${field('Invoice No.', invoice.invoiceNumber)}
    ${field('Address', invoice.billToAddress)}
    ${field('Issue Date', invoiceDate(invoice.issueDate))}
    ${field('Contact', [invoice.billToContact, invoice.billToEmail].filter(Boolean).join(' · '))}
    ${field('Due Date', invoiceDate(invoice.dueDate))}
    ${field('Customer Reference', invoice.customerReference)}
    ${field('Quotation / Order Ref.', invoice.orderReference)}
  </div>
  ${priceTableHtml(invoice.items, invoice.currency)}
  <div class="lower">
    <div class="side">
      <span class="label">Payment Instructions</span>
      ${paymentLines ? `<div class="lines">${multiline(paymentLines)}</div>` : ''}
    </div>
    <table class="totals">
      <tr><td>Subtotal</td><td>${documentAmount(totals.subtotal)}</td></tr>
      <tr><td>Discount (if applicable)</td><td>${totals.discount ? `− ${documentAmount(totals.discount)}` : '—'}</td></tr>
      <tr><td>Delivery (if applicable)</td><td>${totals.delivery ? documentAmount(totals.delivery) : '—'}</td></tr>
      <tr class="strong"><td>Invoice Total</td><td>${currency} ${documentAmount(totals.total)}</td></tr>
      <tr><td>Amount Paid</td><td>${documentAmount(totals.amountPaid)}</td></tr>
      <tr class="balance"><td>Balance Due</td><td>${currency} ${documentAmount(invoice.status === 'cancelled' ? 0 : totals.balanceDue)}</td></tr>
    </table>
  </div>
  <div class="by"><span>Issued By</span><span class="value">${filled(invoice.issuedBy)}</span></div>`;
  return documentHtml({ title: `Invoice ${invoice.invoiceNumber}`, heading: 'Book Invoice', content, stamp: INVOICE_STAMPS[invoice.status] || null, origin });
}

export const invoiceFileName = (invoice: StoreInvoice) => `invoice-${invoice.invoiceNumber || 'draft'}.pdf`;

/** Prints the A4 invoice through the browser's print dialog (also "Save as PDF"). */
export function printInvoice(invoice: StoreInvoice) {
  printHtml(invoiceHtml(invoice), `Invoice ${invoice.invoiceNumber}`);
}

/** Renders a document's HTML off screen and turns it into an A4 PDF, adding pages if it runs long. */
export async function pdfFromHtml(html: string) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const frame = document.createElement('iframe');
  Object.assign(frame.style, { position: 'fixed', left: '-10000px', top: '0', width: '794px', height: '1123px', border: '0' });
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error('Could not prepare the document.');
    doc.open();
    doc.write(html);
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

export async function downloadHtmlPdf(html: string, fileName: string) {
  const pdf = await pdfFromHtml(html);
  pdf.save(fileName);
}

export const buildInvoicePdf = (invoice: StoreInvoice) => pdfFromHtml(invoiceHtml(invoice));

export const downloadInvoicePdf = (invoice: StoreInvoice) => downloadHtmlPdf(invoiceHtml(invoice), invoiceFileName(invoice));
