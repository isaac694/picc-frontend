'use client';

import { documentAmount, documentHtml, escapeHtml, field, invoiceDate } from '@/lib/store-invoice';

export type InventoryStatus = 'ok' | 'low' | 'short' | 'out';

export type InventoryBook = {
  productId: string;
  barcode: string | null;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  isActive: boolean;
  price: number;
  averageCost: number | null;
  stock: number;
  /** Copies on open invoices that have not left stock yet. */
  committed: number;
  /** Stock less what is promised: what can still be sold. */
  free: number;
  reorderLevel: number;
  soldRecently: number;
  daysOfCover: number | null;
  suggestedReorder: number;
  valueAtCost: number | null;
  valueAtPrice: number;
  period: { received: number; out: number; adjusted: number };
  status: InventoryStatus;
};

export type InventorySummary = {
  titles: number; copies: number; committed: number; valueAtCost: number; uncostedTitles: number; valueAtPrice: number;
  out: number; short: number; low: number; toReorder: number; received: number; receivedCost: number; copiesOut: number; adjusted: number;
};

export type StockMovement = {
  id: string; productId: string; bookTitle: string; change: number; stockAfter: number; reason: string;
  reference: string | null; note: string | null; unitCost: number | null; receiptId: string | null; createdBy: string | null; createdAt: string;
};

export type StockReceipt = {
  id: string; receiptNumber: string; supplier: string | null; supplierReference: string | null; receivedAt: string;
  lines: Array<{ productId: string; title: string; quantity: number; unitCost: number | null }>;
  totalCopies: number; totalCost: number; note: string | null; createdBy: string | null;
  cancelledAt: string | null; cancelledBy: string | null; cancelReason: string | null; createdAt: string;
};

export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = {
  ok: 'In stock',
  low: 'Low',
  short: 'Promised out',
  out: 'Out of stock',
};

/** A goods received note for a restock, in the Hope Publishing House frame. */
export function receiptHtml(receipt: StockReceipt, origin = window.location.origin) {
  const rows = receipt.lines.map((line, index) => `<tr class="${index % 2 === 0 ? 'shade' : ''}">
    <td class="num">${index + 1}</td><td>${escapeHtml(line.title)}</td>
    <td class="right">${escapeHtml(line.quantity)}</td>
    <td class="right">${line.unitCost === null ? '—' : documentAmount(line.unitCost)}</td>
    <td class="right">${line.unitCost === null ? '—' : documentAmount(line.unitCost * line.quantity)}</td></tr>`).join('');
  const content = `
  <div class="details">
    <div class="label">Received From</div><div class="label">Document Details</div>
    ${field('Supplier / Printer', receipt.supplier)}
    ${field('Receipt No.', receipt.receiptNumber)}
    ${field('Their Reference', receipt.supplierReference)}
    ${field('Date Received', invoiceDate(receipt.receivedAt))}
  </div>
  <table class="items">
    <colgroup><col style="width:5%"><col style="width:47%"><col style="width:12%"><col style="width:18%"><col style="width:18%"></colgroup>
    <thead><tr><th>#</th><th>Book Title</th><th class="right">Copies</th><th class="right">Cost / Copy (MWK)</th><th class="right">Cost (MWK)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="lower">
    <div class="side"><span class="label">Notes</span><div class="lines">${escapeHtml(receipt.note || '')}${receipt.cancelReason ? `<br>Cancelled: ${escapeHtml(receipt.cancelReason)}` : ''}</div></div>
    <table class="totals">
      <tr><td>Total Copies</td><td>${escapeHtml(receipt.totalCopies)}</td></tr>
      <tr class="balance"><td>Total Cost</td><td>MWK ${documentAmount(receipt.totalCost)}</td></tr>
    </table>
  </div>
  <div class="by"><span>Received By</span><span class="value">${escapeHtml(receipt.createdBy || '')}</span></div>`;
  return documentHtml({
    title: `Stock received ${receipt.receiptNumber}`,
    heading: 'Goods Received Note',
    content,
    stamp: receipt.cancelledAt ? { text: 'CANCELLED', tone: 'red' } : null,
    origin,
  });
}

/** The books to reprint or reorder, with suggested quantities: something to send to the printer. */
export function reorderListHtml(books: InventoryBook[], origin = window.location.origin) {
  const rows = books.map((book, index) => `<tr class="${index % 2 === 0 ? 'shade' : ''}">
    <td class="num">${index + 1}</td><td>${escapeHtml(book.title)}${book.barcode ? `<br><span class="num">${escapeHtml(book.barcode)}</span>` : ''}</td>
    <td class="right">${escapeHtml(book.stock)}</td><td class="right">${escapeHtml(book.committed)}</td><td class="right">${escapeHtml(book.soldRecently)}</td>
    <td class="right"><strong>${escapeHtml(book.suggestedReorder)}</strong></td>
    <td class="right">${book.averageCost === null ? '—' : documentAmount(book.averageCost * book.suggestedReorder)}</td></tr>`).join('');
  const copies = books.reduce((sum, book) => sum + book.suggestedReorder, 0);
  const cost = books.reduce((sum, book) => sum + (book.averageCost ?? 0) * book.suggestedReorder, 0);
  const content = `
  <div class="details">
    <div class="label">Reorder List</div><div class="label">Document Details</div>
    ${field('Titles', String(books.length))}
    ${field('Prepared', invoiceDate(new Date().toISOString()))}
  </div>
  <table class="items">
    <colgroup><col style="width:5%"><col style="width:39%"><col style="width:10%"><col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:13%"></colgroup>
    <thead><tr><th>#</th><th>Book Title</th><th class="right">In Stock</th><th class="right">Promised</th><th class="right">Sold 30 Days</th><th class="right">Order</th><th class="right">Est. Cost (MWK)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="lower">
    <div class="side"><span class="label">How the quantity is worked out</span><div class="lines">Enough for a month of sales (at least twice the reorder level), plus copies promised on invoices, less what is in stock. Estimated cost uses each book's average cost.</div></div>
    <table class="totals">
      <tr><td>Copies to order</td><td>${escapeHtml(copies)}</td></tr>
      <tr class="balance"><td>Estimated Cost</td><td>MWK ${documentAmount(cost)}</td></tr>
    </table>
  </div>`;
  return documentHtml({ title: 'Reorder list', heading: 'Book Reorder List', content, origin });
}
