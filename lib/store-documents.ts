'use client';

import { printHtml, publicSiteOrigin } from '@/lib/book-labels';
import {
  documentAmount, documentHtml, downloadHtmlPdf, escapeHtml, field, filled, invoiceDate, invoiceTotals, MIN_ROWS, multiline, priceTableHtml,
  type InvoiceLine,
} from '@/lib/store-invoice';

/** Counter payment methods, the same list the backend accepts. */
export const PAYMENT_METHODS = ['Cash', 'POS', 'Bank Transfer', 'Airtel Money agent', 'TNM Mpamba'];
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Malawi number in the form WhatsApp links need, or '' when there is none. */
export const whatsappDigits = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 9) return `265${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `265${digits.slice(1)}`;
  return digits.startsWith('265') ? digits : '';
};

// --- Quotations (PICC_Book_Quotation.docx) ---

export type QuotationStatus = 'open' | 'expired' | 'accepted' | 'declined';

export type StoreQuotation = {
  quotationNumber: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string | null;
  billToName: string;
  billToAddress?: string | null;
  billToContact?: string | null;
  billToEmail?: string | null;
  customerReference?: string | null;
  currency: string;
  items: InvoiceLine[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  terms?: string | null;
  preparedBy?: string | null;
  invoiceNumber?: string | null;
  accessToken: string;
  createdAt?: string;
};

export type AdminQuotation = StoreQuotation & {
  id: string;
  source: 'request' | 'counter' | string;
  customerNote: string | null;
  invoiceId: string | null;
  acceptedAt: string | null;
};

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  open: 'Open',
  expired: 'Expired',
  accepted: 'Invoiced',
  declined: 'Declined',
};

export const quotationShareUrl = (quotation: Pick<StoreQuotation, 'accessToken'>) =>
  `${publicSiteOrigin()}/store/quotation/${encodeURIComponent(quotation.accessToken || '')}`;

const QUOTATION_STAMPS: Partial<Record<QuotationStatus, { text: string; tone: 'green' | 'red' | 'amber' | 'grey' }>> = {
  accepted: { text: 'ACCEPTED', tone: 'green' },
  declined: { text: 'DECLINED', tone: 'red' },
  expired: { text: 'EXPIRED', tone: 'grey' },
};

export function quotationHtml(quotation: StoreQuotation, origin = window.location.origin) {
  const totals = invoiceTotals({ items: quotation.items, discount: quotation.discount, delivery: quotation.delivery, amountPaid: 0 });
  const currency = escapeHtml(quotation.currency || 'MWK');
  const terms = (quotation.terms || '').trim();
  const content = `
  <div class="details">
    <div class="label">Quotation For</div><div class="label">Document Details</div>
    ${field('Name / Organisation', quotation.billToName)}
    ${field('Quotation No.', quotation.quotationNumber)}
    ${field('Address', quotation.billToAddress)}
    ${field('Issue Date', invoiceDate(quotation.issueDate))}
    ${field('Contact', [quotation.billToContact, quotation.billToEmail].filter(Boolean).join(' · '))}
    ${field('Valid Until', invoiceDate(quotation.validUntil))}
  </div>
  ${priceTableHtml(quotation.items, quotation.currency)}
  <div class="lower">
    <div class="side">
      <span class="label">Quotation Terms</span>
      ${terms ? `<div class="lines">${multiline(terms)}</div>` : ''}
    </div>
    <table class="totals">
      <tr><td>Subtotal</td><td>${documentAmount(totals.subtotal)}</td></tr>
      <tr><td>Discount (if applicable)</td><td>${totals.discount ? `− ${documentAmount(totals.discount)}` : '—'}</td></tr>
      <tr><td>Delivery (if applicable)</td><td>${totals.delivery ? documentAmount(totals.delivery) : '—'}</td></tr>
      <tr class="balance"><td>Total Quoted</td><td>${currency} ${documentAmount(totals.total)}</td></tr>
    </table>
  </div>
  <div class="by"><span>Prepared By</span><span class="value">${filled(quotation.preparedBy)}</span></div>`;
  return documentHtml({ title: `Quotation ${quotation.quotationNumber}`, heading: 'Book Quotation', content, stamp: QUOTATION_STAMPS[quotation.status] || null, origin });
}

export const printQuotation = (quotation: StoreQuotation) => printHtml(quotationHtml(quotation), `Quotation ${quotation.quotationNumber}`);
export const downloadQuotationPdf = (quotation: StoreQuotation) => downloadHtmlPdf(quotationHtml(quotation), `quotation-${quotation.quotationNumber}.pdf`);

// --- Delivery notes (PICC_Book_Delivery_Note.docx) ---

export type DeliveryNoteStatus = 'dispatched' | 'delivered' | 'cancelled';

export type DeliveryNoteLine = {
  line: number;
  productId: string | null;
  title: string;
  isbnEdition: string | null;
  qtyOrdered: number;
  qtyDelivered: number;
  unitPrice: number;
};

export type DeliveryNote = {
  id: string;
  deliveryNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  orderReference: string | null;
  status: DeliveryNoteStatus;
  deliverToName: string;
  deliverToAddress: string | null;
  deliverToContact: string | null;
  items: DeliveryNoteLine[];
  totalCopies: number;
  deliveryValue: number;
  deliveryDate: string;
  remarks: string | null;
  deliveredByName: string | null;
  receivedByName: string | null;
  receivedAt: string | null;
  amountCollected: number;
  collectionMethod: string | null;
  collectionReference: string | null;
  createdBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export const DELIVERY_STATUS_LABEL: Record<DeliveryNoteStatus, string> = {
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function deliveryNoteHtml(note: DeliveryNote, origin = window.location.origin) {
  const rows: Array<DeliveryNoteLine | null> = [...note.items];
  while (rows.length < MIN_ROWS) rows.push(null);
  const body = rows.map((line, index) => `<tr class="${index % 2 === 0 ? 'shade' : ''}">
      <td class="num">${index + 1}</td>
      <td>${escapeHtml(line?.title || '')}</td>
      <td>${escapeHtml(line?.isbnEdition || '')}</td>
      <td class="right">${line ? escapeHtml(line.qtyOrdered) : ''}</td>
      <td class="right">${line ? `<strong>${escapeHtml(line.qtyDelivered)}</strong>` : ''}</td>
    </tr>`).join('');
  const ref = [note.invoiceNumber, note.orderReference].filter(Boolean).join(' / ');
  const collected = Number(note.amountCollected || 0) > 0
    ? `<div class="totalrow"><span>Amount Collected on Delivery</span><strong>MWK ${documentAmount(note.amountCollected)}${note.collectionMethod ? ` · ${escapeHtml(note.collectionMethod)}` : ''}${note.collectionReference ? ` · ${escapeHtml(note.collectionReference)}` : ''}</strong></div>`
    : '';
  const receivedDate = note.receivedAt ? invoiceDate(note.receivedAt) : '';
  const sign = (title: string, name: string | null, date: string) => `<div class="sign">
      <div class="label">${title}</div>
      ${field('Name', name)}
      <div class="field"><span>Signature</span><span class="value signline">&nbsp;</span></div>
      ${field('Date', date)}
    </div>`;
  const content = `
  <div class="details">
    <div class="label">Deliver To</div><div class="label">Document Details</div>
    ${field('Name / Organisation', note.deliverToName)}
    ${field('Delivery Note No.', note.deliveryNoteNumber)}
    ${field('Address', note.deliverToAddress)}
    ${field('Delivery Date', invoiceDate(note.deliveryDate))}
    ${field('Contact', note.deliverToContact)}
    ${field('Invoice / Order Ref.', ref)}
  </div>
  <table class="items">
    <colgroup><col style="width:5%"><col style="width:45%"><col style="width:22%"><col style="width:14%"><col style="width:14%"></colgroup>
    <thead><tr><th>#</th><th>Book Title</th><th>ISBN / Edition</th><th class="right">Qty Ordered</th><th class="right">Qty Delivered</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="totalrow"><span>Total Copies Delivered</span><strong>${escapeHtml(note.totalCopies)}</strong></div>
  ${collected}
  <div class="remarks">
    <span class="label">Delivery Remarks</span>
    <div class="lines">${multiline(note.remarks) || '&nbsp;'}</div>
  </div>
  <div class="signs">
    ${sign('Delivered By', note.deliveredByName, invoiceDate(note.deliveryDate))}
    ${sign('Received By', note.receivedByName, receivedDate)}
  </div>`;
  const css = `
  .totalrow { display: flex; justify-content: space-between; margin-top: 4mm; padding: 2.4mm 3mm; background: #E4F1F3; font-size: 10pt; }
  .totalrow + .totalrow { margin-top: 1.5mm; background: #F3F7F8; }
  .remarks { margin-top: 7mm; }
  .remarks .label { font-size: 10pt; text-transform: none; letter-spacing: 0; display: block; margin-bottom: 2mm; }
  .remarks .lines { min-height: 14mm; color: #425B65; line-height: 1.6; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin-top: 8mm; }
  .sign { display: grid; row-gap: 4mm; }
  .sign .field { grid-template-columns: 22mm 1fr; }
  /* A space to sign by hand. */
  .signline { min-height: 9mm !important; border-bottom: 0.6pt solid #9fb3bb; }`;
  const stamp = note.status === 'cancelled' ? { text: 'CANCELLED', tone: 'red' as const } : note.status === 'delivered' && note.receivedByName ? { text: 'RECEIVED', tone: 'green' as const } : null;
  return documentHtml({ title: `Delivery note ${note.deliveryNoteNumber}`, heading: 'Book Delivery Note', content, stamp, css, origin });
}

export const printDeliveryNote = (note: DeliveryNote) => printHtml(deliveryNoteHtml(note), `Delivery note ${note.deliveryNoteNumber}`);
export const downloadDeliveryNotePdf = (note: DeliveryNote) => downloadHtmlPdf(deliveryNoteHtml(note), `delivery-note-${note.deliveryNoteNumber}.pdf`);
