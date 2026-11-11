import { loadLogoForPdf } from '@/lib/store-receipt';

/** Best-selling books (hard and soft copies): ranking, insights and the PDF report. */

export type SalesFormat = 'all' | 'hard' | 'soft';

export type BestSellerBook = {
  productId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  inCatalogue: boolean;
  isActive: boolean;
  hardCopyEnabled: boolean;
  softCopyEnabled: boolean;
  stock: number;
  hardUnits: number;
  softUnits: number;
  hardRevenue: number;
  softRevenue: number;
  previousHardUnits: number;
  previousSoftUnits: number;
  channels: { online: number; scan: number; counter: number };
  buyers: number;
  readersStarted: number;
  readersFinished: number;
  hardUnitsLast30Days: number;
  daysOfStockLeft: number | null;
  lastSoldAt: string | null;
};

export type OrderPatterns = {
  orders: number;
  buyers: number;
  repeatBuyers: number;
  averageOrder: number;
  weekdays: number[];
  hours: number[];
  busiestWeekday: number | null;
  busiestHour: number | null;
};

export type BestSellerReport = {
  period: { from: string | null; to: string | null; previousFrom: string | null; previousTo: string | null };
  books: BestSellerBook[];
  patterns: Record<SalesFormat, OrderPatterns>;
  trend: { unit: 'day' | 'month'; points: Array<{ key: string; hard: number; soft: number; revenue: number }> };
};

export type RankedBook = BestSellerBook & {
  units: number;
  revenue: number;
  previousUnits: number;
  rank: number;
  /** Places climbed since the previous period (negative: fell). Null when it did not sell then. */
  movement: number | null;
  share: number;
};

export const FORMAT_LABELS: Record<SalesFormat, string> = { all: 'Hard and soft copies', hard: 'Hard copies', soft: 'Soft copies (e-books)' };
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const bookMoney = (value: number) => `MWK ${Math.round(value).toLocaleString()}`;
export const hourRange = (hour: number) => `${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00`;

const unitsOf = (book: BestSellerBook, format: SalesFormat) =>
  format === 'hard' ? book.hardUnits : format === 'soft' ? book.softUnits : book.hardUnits + book.softUnits;
const revenueOf = (book: BestSellerBook, format: SalesFormat) =>
  format === 'hard' ? book.hardRevenue : format === 'soft' ? book.softRevenue : book.hardRevenue + book.softRevenue;
const previousOf = (book: BestSellerBook, format: SalesFormat) =>
  format === 'hard' ? book.previousHardUnits : format === 'soft' ? book.previousSoftUnits : book.previousHardUnits + book.previousSoftUnits;

const byUnits = (a: { units: number; revenue: number; title: string }, b: { units: number; revenue: number; title: string }) =>
  b.units - a.units || b.revenue - a.revenue || a.title.localeCompare(b.title);

/** Books that sold in the period, best first, with how far each moved since the previous period. */
export function rankBooks(books: BestSellerBook[], format: SalesFormat): RankedBook[] {
  const previousRanks = new Map(
    books
      .map((book) => ({ ...book, units: previousOf(book, format), revenue: 0 }))
      .filter((book) => book.units > 0)
      .sort(byUnits)
      .map((book, index) => [book.productId, index + 1]),
  );
  const sold = books
    .map((book) => ({ ...book, units: unitsOf(book, format), revenue: revenueOf(book, format), previousUnits: previousOf(book, format) }))
    .filter((book) => book.units > 0)
    .sort(byUnits);
  const total = sold.reduce((sum, book) => sum + book.units, 0);
  return sold.map((book, index) => {
    const previousRank = previousRanks.get(book.productId);
    return { ...book, rank: index + 1, movement: previousRank ? previousRank - (index + 1) : null, share: total ? book.units / total : 0 };
  });
}

/** Catalogue books on sale in this format that did not sell at all in the period. */
export function unsoldBooks(books: BestSellerBook[], format: SalesFormat) {
  return books.filter((book) => book.inCatalogue && book.isActive && unitsOf(book, format) === 0
    && (format === 'hard' ? book.hardCopyEnabled : format === 'soft' ? book.softCopyEnabled : book.hardCopyEnabled || book.softCopyEnabled));
}

/** Hard copies that are selling and will run out within two weeks at the last 30 days' pace (or already have). */
export function restockSoon(books: BestSellerBook[]) {
  return books
    .filter((book) => book.inCatalogue && book.isActive && book.hardCopyEnabled && book.hardUnitsLast30Days > 0
      && book.daysOfStockLeft !== null && book.daysOfStockLeft <= 14)
    .sort((a, b) => (a.daysOfStockLeft ?? 0) - (b.daysOfStockLeft ?? 0));
}

export const stockLeftLabel = (book: BestSellerBook) =>
  book.stock <= 0 ? 'Out of stock' : book.daysOfStockLeft === null ? `${book.stock} in stock` : book.daysOfStockLeft < 1 ? 'Runs out today' : `About ${book.daysOfStockLeft} days left`;

export function reportTotals(books: BestSellerBook[], format: SalesFormat) {
  const units = books.reduce((sum, book) => sum + unitsOf(book, format), 0);
  const previousUnits = books.reduce((sum, book) => sum + previousOf(book, format), 0);
  return {
    units,
    revenue: books.reduce((sum, book) => sum + revenueOf(book, format), 0),
    hardUnits: books.reduce((sum, book) => sum + book.hardUnits, 0),
    softUnits: books.reduce((sum, book) => sum + book.softUnits, 0),
    hardRevenue: books.reduce((sum, book) => sum + book.hardRevenue, 0),
    softRevenue: books.reduce((sum, book) => sum + book.softRevenue, 0),
    previousUnits,
    /** Percentage change on the previous period; null when there is nothing to compare with. */
    change: previousUnits ? Math.round(((units - previousUnits) / previousUnits) * 100) : null,
    readersStarted: books.reduce((sum, book) => sum + book.readersStarted, 0),
    readersFinished: books.reduce((sum, book) => sum + book.readersFinished, 0),
  };
}

const NAVY: [number, number, number] = [30, 58, 95];
const GOLD: [number, number, number] = [201, 162, 39];
const MEDALS: Array<[number, number, number]> = [[201, 162, 39], [148, 163, 184], [180, 83, 9]];

export async function downloadBestSellersPdf(input: {
  report: BestSellerReport;
  format: SalesFormat;
  periodLabel: string;
  comparedWith: string | null;
  fileName: string;
}) {
  const { default: jsPDF } = await import('jspdf');
  const logo = await loadLogoForPdf();
  const { report, format } = input;
  const ranked = rankBooks(report.books, format);
  const totals = reportTotals(report.books, format);
  const patterns = report.patterns[format];
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usable = pageWidth - margin * 2;
  let y = 0;

  const ensure = (height: number) => {
    if (y + height <= pageHeight - 12) return;
    doc.addPage();
    y = margin;
  };
  const heading = (title: string) => {
    ensure(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(title, margin, y + 5);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 7, margin + 24, y + 7);
    doc.setLineWidth(0.2);
    y += 11;
  };

  // Cover band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 30, pageWidth, 1.2, 'F');
  if (logo) doc.addImage(logo, 'PNG', margin, 5, 20, 20.2);
  const textX = margin + (logo ? 24 : 0);
  doc.setTextColor(255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('HOPE BOOKSHOP  |  PENTECOST INTERNATIONAL CHRISTIAN CENTRE', textX, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Best-selling books', textX, 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${input.periodLabel}  |  ${FORMAT_LABELS[format]}${input.comparedWith ? `  |  Compared with ${input.comparedWith}` : ''}`, textX, 25);
  y = 35;

  // Headline figures
  const boxes: Array<[string, string, string]> = [
    ['Copies sold', totals.units.toLocaleString(), format === 'all' ? `${totals.hardUnits} hard, ${totals.softUnits} soft` : `${ranked.length} ${ranked.length === 1 ? 'title' : 'titles'} sold`],
    ['Sales value', bookMoney(totals.revenue), format === 'all' ? `${bookMoney(totals.hardRevenue)} hard` : FORMAT_LABELS[format]],
    ['Orders', patterns.orders.toLocaleString(), `Average ${bookMoney(patterns.averageOrder)}`],
    ['Buyers', patterns.buyers.toLocaleString(), `${patterns.repeatBuyers} came back for more`],
    ['Against before', totals.change === null ? 'No comparison' : `${totals.change > 0 ? '+' : ''}${totals.change}%`, input.comparedWith ? `${totals.previousUnits} copies before` : 'Choose a period to compare'],
  ];
  const gap = 3;
  const boxWidth = (usable - gap * (boxes.length - 1)) / boxes.length;
  boxes.forEach(([label, value, detail], index) => {
    const x = margin + index * (boxWidth + gap);
    doc.setFillColor(244, 246, 249);
    doc.roundedRect(x, y, boxWidth, 19, 1.5, 1.5, 'F');
    doc.setFillColor(...NAVY);
    doc.rect(x, y + 1.5, 0.8, 16, 'F');
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(label, x + 3, y + 5);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(value, x + 3, y + 11);
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(detail, boxWidth - 5)[0], x + 3, y + 16);
  });
  y += 25;

  // Top three
  if (ranked.length) {
    heading('Top sellers');
    const podium = ranked.slice(0, 3);
    const cardWidth = (usable - gap * 2) / 3;
    podium.forEach((book, index) => {
      const x = margin + index * (cardWidth + gap);
      doc.setDrawColor(...MEDALS[index]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardWidth, 22, 1.5, 1.5, 'S');
      doc.setLineWidth(0.2);
      doc.setFillColor(...MEDALS[index]);
      doc.circle(x + 7, y + 7, 4.2, 'F');
      doc.setTextColor(255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(String(index + 1), x + 7, y + 8.5, { align: 'center' });
      doc.setTextColor(20);
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(book.title, cardWidth - 17)[0], x + 13, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90);
      if (book.author) doc.text(doc.splitTextToSize(book.author, cardWidth - 17)[0], x + 13, y + 11);
      doc.setTextColor(20);
      doc.setFontSize(8.5);
      doc.text(`${book.units} copies  |  ${bookMoney(book.revenue)}  |  ${Math.round(book.share * 100)}% of copies`, x + 4, y + 17);
      doc.setTextColor(90);
      doc.setFontSize(7.5);
      const buyers = `${book.buyers} ${book.buyers === 1 ? 'buyer' : 'buyers'}`;
      doc.text(format === 'all' ? `${book.hardUnits} hard, ${book.softUnits} soft  |  ${buyers}` : buyers, x + 4, y + 20.5);
    });
    y += 28;
  }

  // Full ranking
  heading('Ranking');
  type Column = { label: string; width: number; align?: 'right' | 'center'; value: (book: RankedBook) => string };
  const columns: Column[] = [
    { label: '#', width: 9, align: 'center', value: (book) => String(book.rank) },
    { label: 'Move', width: 15, align: 'center', value: (book) => (book.movement === null ? (input.comparedWith ? 'New' : '-') : book.movement > 0 ? `Up ${book.movement}` : book.movement < 0 ? `Down ${-book.movement}` : 'Same') },
    // A report on one kind of copy has no hard/soft split, so its book and author columns take that space.
    { label: 'Book', width: format === 'all' ? 70 : 84, value: (book) => book.title },
    { label: 'Author', width: format === 'all' ? 42 : 56, value: (book) => book.author || '-' },
    ...(format === 'all'
      ? [
          { label: 'Hard', width: 14, align: 'right', value: (book: RankedBook) => String(book.hardUnits) },
          { label: 'Soft', width: 14, align: 'right', value: (book: RankedBook) => String(book.softUnits) },
        ] satisfies Column[]
      : []),
    { label: 'Copies', width: 16, align: 'right', value: (book) => String(book.units) },
    { label: 'Sales value', width: 30, align: 'right', value: (book) => bookMoney(book.revenue) },
    { label: 'Share', width: 15, align: 'right', value: (book) => `${Math.round(book.share * 100)}%` },
    ...(format === 'soft' ? [] : [{ label: 'Hard copy stock', width: 52, value: (book: RankedBook) => (book.hardCopyEnabled && book.inCatalogue ? stockLeftLabel(book) : '-') }]),
  ];
  // Soft copy reports drop the stock column too; give the space back to the book title.
  if (format === 'soft') columns[2].width += 52;
  const place = (column: (typeof columns)[number], x: number) =>
    column.align === 'right' ? x + column.width - 1.5 : column.align === 'center' ? x + column.width / 2 : x + 1.5;
  const paintHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(margin, y, usable, 7, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let x = margin;
    for (const column of columns) {
      doc.text(column.label, place(column, x), y + 4.6, { align: column.align || 'left' });
      x += column.width;
    }
    y += 7;
  };
  ensure(14);
  paintHeader();
  ranked.forEach((book, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const cells = columns.map((column) => doc.splitTextToSize(column.value(book), column.width - 3) as string[]);
    const height = Math.max(...cells.map((lines) => lines.length)) * 3.8 + 2.6;
    if (y + height > pageHeight - 12) {
      doc.addPage();
      y = margin;
      paintHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    if (index % 2) {
      doc.setFillColor(247, 248, 250);
      doc.rect(margin, y, usable, height, 'F');
    }
    let x = margin;
    columns.forEach((column, columnIndex) => {
      const warn = column.label === 'Hard copy stock' && (book.stock <= 0 || (book.daysOfStockLeft !== null && book.daysOfStockLeft <= 14));
      const move = column.label === 'Move' && book.movement !== null && book.movement !== 0;
      if (warn) doc.setTextColor(185, 28, 28);
      else if (move) doc.setTextColor(...((book.movement ?? 0) > 0 ? ([21, 128, 61] as [number, number, number]) : ([185, 28, 28] as [number, number, number])));
      else doc.setTextColor(30);
      doc.text(cells[columnIndex], place(column, x), y + 3.9, { align: column.align || 'left' });
      x += column.width;
    });
    y += height;
  });
  if (!ranked.length) {
    doc.setTextColor(90);
    doc.setFontSize(9);
    doc.text('No books sold in this period.', margin + 1.5, y + 6);
    y += 10;
  }
  y += 4;

  // Takeaways
  const restock = format === 'soft' ? [] : restockSoon(report.books);
  const unsold = unsoldBooks(report.books, format);
  const paragraph = (lines: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40);
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line, usable) as string[];
      ensure(wrapped.length * 4.2 + 1);
      doc.text(wrapped, margin, y + 3);
      y += wrapped.length * 4.2 + 1;
    }
    y += 3;
  };
  heading('What the sales say');
  const notes: string[] = [];
  if (patterns.busiestWeekday !== null) {
    notes.push(`Busiest day: ${WEEKDAYS[patterns.busiestWeekday]}. Busiest hour: ${hourRange(patterns.busiestHour ?? 0)} (Malawi time).`);
  }
  if (format === 'all' && totals.units) {
    notes.push(`Hard copies were ${Math.round((totals.hardUnits / totals.units) * 100)}% of copies sold and ${totals.revenue ? Math.round((totals.hardRevenue / totals.revenue) * 100) : 0}% of the money.`);
  }
  if (format !== 'hard' && totals.readersStarted) {
    notes.push(`E-book reading: ${totals.readersStarted} started reading, ${totals.readersFinished} finished.`);
  }
  const hardChannels = ranked.reduce((sum, book) => ({ online: sum.online + book.channels.online, scan: sum.scan + book.channels.scan, counter: sum.counter + book.channels.counter }), { online: 0, scan: 0, counter: 0 });
  if (format !== 'soft' && hardChannels.scan + hardChannels.counter) {
    notes.push(`Where hard copies sold: ${hardChannels.counter} at the counter, ${hardChannels.scan} by customers scanning a label${format === 'hard' ? `, ${hardChannels.online} online` : ''}.`);
  }
  if (!notes.length) notes.push('Not enough sales in this period to show a pattern.');
  paragraph(notes);

  

  const pages = doc.getNumberOfPages();
  const printed = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(`Hope Bookshop best sellers  |  Printed ${printed}`, margin, pageHeight - 5);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }
  doc.save(`${input.fileName}.pdf`);
}
