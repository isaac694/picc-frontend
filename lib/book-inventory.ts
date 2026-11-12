'use client';

import { documentAmount, documentHtml, escapeHtml, field, invoiceDate } from '@/lib/store-invoice';
import { receiptDate } from '@/lib/store-receipt';

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
  lastRestock: LastRestock | null;
  daysSinceLastRestock: number | null;
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
    ${field('Date & Time Received', receiptDate(receipt.receivedAt))}
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

// --- Restock report ---

export type LastRestock = {
  at: string;
  enteredAt: string | null;
  quantity: number;
  unitCost: number | null;
  receiptId: string;
  receiptNumber: string;
  supplier: string | null;
  createdBy: string | null;
};

export type RestockFreshness = 'recent' | 'aging' | 'stale' | 'never';

export const FRESHNESS_LABEL: Record<RestockFreshness, string> = {
  recent: 'Within 30 days',
  aging: '31–90 days ago',
  stale: 'Over 90 days ago',
  never: 'Never restocked',
};

export type RestockReportBook = {
  productId: string;
  title: string;
  barcode: string | null;
  stock: number;
  committed: number;
  free: number;
  reorderLevel: number;
  soldRecently: number;
  lastRestock: LastRestock | null;
  firstRestockAt: string | null;
  daysSinceLastRestock: number | null;
  freshness: RestockFreshness;
  restocksAllTime: number;
  copiesReceivedAllTime: number;
  averageGapDays: number | null;
  soldSinceLastRestock: number;
  sellThrough: number | null;
  period: { restocks: number; copies: number; cost: number };
  nextRestockDue: string | null;
  dueNow: boolean;
};

export type RestockTimelineEntry = {
  id: string;
  receiptNumber: string;
  receivedAt: string;
  enteredAt: string;
  supplier: string | null;
  supplierReference: string | null;
  lines: Array<{ productId: string; title: string; quantity: number; unitCost: number | null }>;
  totalCopies: number;
  totalCost: number;
  createdBy: string | null;
  note: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
};

export type RestockReport = {
  books: RestockReportBook[];
  timeline: RestockTimelineEntry[];
  suppliers: Array<{ supplier: string; restocks: number; copies: number; cost: number; lastAt: string; titles: number }>;
  months: Array<{ month: string; restocks: number; copies: number; cost: number }>;
  summary: {
    lastRestock: { at: string; enteredAt: string; receiptNumber: string; supplier: string | null; copies: number; titles: number; createdBy: string | null; daysAgo: number } | null;
    restocks: number;
    cancelled: number;
    copies: number;
    cost: number;
    titlesRestocked: number;
    averageGapDays: number | null;
    never: number;
    recent: number;
    aging: number;
    stale: number;
    dueNow: number;
    dueSoon: number;
  };
};

/** "today", "yesterday", "12 days ago". */
export const daysAgoText = (days: number | null) => (days === null ? 'never' : days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

/** Time of day in 24-hour form, e.g. 14:05. */
export const timeOfDay = (value?: string | null) => (value ? new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');

/** Day of the week and date, e.g. Thu 12 Nov 2026. */
export const longDay = (value?: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '');

/** Month key "2026-11" as "Nov 2026". */
export const monthLabel = (key: string) => new Date(`${key}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

/** When the next restock is expected: now, or a date with how far away it is. */
export function nextDueText(book: Pick<RestockReportBook, 'dueNow' | 'nextRestockDue'>) {
  if (book.dueNow) return 'Due now';
  if (!book.nextRestockDue) return 'No recent sales';
  const days = Math.max(0, Math.ceil((new Date(book.nextRestockDue).getTime() - Date.now()) / 86400000));
  return `${invoiceDate(book.nextRestockDue)} (in ${days} ${days === 1 ? 'day' : 'days'})`;
}

/** The restock report as an A4 document in the Hope Publishing House frame, for printing or PDF. */
export function restockReportHtml(report: RestockReport, period: string, origin = window.location.origin) {
  const { summary } = report;
  const last = summary.lastRestock;
  const books = [...report.books].sort((a, b) => (a.lastRestock ? new Date(a.lastRestock.at).getTime() : 0) - (b.lastRestock ? new Date(b.lastRestock.at).getTime() : 0));
  const bookRows = books.map((book, index) => `<tr class="${index % 2 === 0 ? 'shade' : ''}">
    <td>${escapeHtml(book.title)}</td>
    <td>${book.lastRestock ? `${escapeHtml(receiptDate(book.lastRestock.at))}<br><span class="muted">${escapeHtml(daysAgoText(book.daysSinceLastRestock))} · ${escapeHtml(book.lastRestock.receiptNumber)}</span>` : '<span class="muted">Never</span>'}</td>
    <td class="right">${book.lastRestock ? escapeHtml(book.lastRestock.quantity) : '—'}</td>
    <td class="right">${book.sellThrough === null ? '—' : `${book.sellThrough}%`}</td>
    <td class="right">${book.averageGapDays === null ? '—' : `${escapeHtml(book.averageGapDays)} d`}</td>
    <td class="right">${escapeHtml(book.stock)}</td>
    <td>${escapeHtml(nextDueText(book))}</td></tr>`).join('');
  const timelineRows = report.timeline.map((entry, index) => `<tr class="${index % 2 === 0 ? 'shade' : ''}${entry.cancelledAt ? ' cancelled' : ''}">
    <td>${escapeHtml(receiptDate(entry.receivedAt))}</td>
    <td class="num">${escapeHtml(entry.receiptNumber)}${entry.cancelledAt ? '<br><span class="muted">cancelled</span>' : ''}</td>
    <td>${escapeHtml(entry.supplier || '—')}</td>
    <td>${escapeHtml(entry.lines.map((line) => `${line.title} ×${line.quantity}`).join(', '))}</td>
    <td class="right">${escapeHtml(entry.totalCopies)}</td>
    <td class="right">${documentAmount(entry.totalCost)}</td></tr>`).join('');
  const content = `
  <div class="details">
    <div class="label">Restock Report</div><div class="label">Document Details</div>
    ${field('Period', period)}
    ${field('Prepared', receiptDate(new Date().toISOString()))}
    ${field('Last Restock', last ? `${receiptDate(last.at)} (${daysAgoText(last.daysAgo)})` : 'None yet')}
    ${field('Last GRN', last ? `${last.receiptNumber}${last.supplier ? ` · ${last.supplier}` : ''}` : '—')}
  </div>
  <div class="kpis">
    <div><span>Restocks</span><strong>${escapeHtml(summary.restocks)}</strong></div>
    <div><span>Copies received</span><strong>${escapeHtml(summary.copies)}</strong></div>
    <div><span>Cost (MWK)</span><strong>${documentAmount(summary.cost)}</strong></div>
    <div><span>Avg. days between restocks</span><strong>${summary.averageGapDays === null ? '—' : escapeHtml(summary.averageGapDays)}</strong></div>
  </div>
  <h3>Restocks in the period</h3>
  <table class="items">
    <colgroup><col style="width:17%"><col style="width:17%"><col style="width:15%"><col style="width:31%"><col style="width:8%"><col style="width:12%"></colgroup>
    <thead><tr><th>Date &amp; Time</th><th>GRN</th><th>Supplier</th><th>Books</th><th class="right">Copies</th><th class="right">Cost (MWK)</th></tr></thead>
    <tbody>${timelineRows || '<tr><td colspan="6" class="muted">No restocks in this period.</td></tr>'}</tbody>
  </table>
  <h3>Last restock of each book</h3>
  <table class="items">
    <colgroup><col style="width:24%"><col style="width:22%"><col style="width:8%"><col style="width:10%"><col style="width:10%"><col style="width:8%"><col style="width:18%"></colgroup>
    <thead><tr><th>Book</th><th>Last Restocked</th><th class="right">Copies</th><th class="right">Sold Since</th><th class="right">Every</th><th class="right">Stock</th><th>Next Due</th></tr></thead>
    <tbody>${bookRows}</tbody>
  </table>
  <p class="muted note">Sold since: share of the last delivery sold since it arrived. Every: average days between restocks. Next due: when free stock (in stock less promised on invoices) is expected to reach the reorder level at the rate of sale over the last 30 days.</p>`;
  const css = `
  h3 { font-size: 10.5pt; color: #087989; margin: 6mm 0 2mm; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-top: 5mm; }
  .kpis div { background: #E4F1F3; padding: 2.5mm 3mm; display: grid; gap: 1mm; }
  .kpis span { font-size: 8pt; color: #425B65; }
  .kpis strong { font-size: 12pt; }
  .muted { color: #6b818a; font-size: 8pt; }
  .note { margin-top: 4mm; line-height: 1.5; }
  tr.cancelled td { text-decoration: line-through; color: #8a9aa1; }
  table.items td { font-size: 8.5pt; vertical-align: top; }`;
  return documentHtml({ title: `Restock report ${period}`, heading: 'Book Restock Report', content, css, origin });
}
