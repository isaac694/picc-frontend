import { downloadBlob } from '@/lib/event-registration-export';
import { loadLogoForPdf } from '@/lib/store-receipt';

/** PDF and Excel sales reports for one branded item: a summary, the sales, and units by month. */

export type BrandedSaleRow = {
  id: string;
  source: 'in person' | 'online';
  date: string;
  buyer: string;
  contact: string | null;
  quantity: number;
  amount: number;
  paymentStatus: 'paid' | 'not paid';
  collectionStatus: string | null;
  method: string | null;
  reference: string | null;
  note: string | null;
};

export type BrandedSalesSummary = {
  sales: number;
  units: number;
  inPersonUnits: number;
  onlineUnits: number;
  revenue: number;
  paid: number;
  owed: number;
  buyers: number;
};

export type BrandedReportInput = {
  item: { name: string; category: string; price: number; stock: number; imageUrl: string | null };
  periodLabel: string;
  filterLabel: string;
  fileName: string;
  rows: BrandedSaleRow[];
};

export const reportMoney = (value: number) => `MWK ${Math.round(value).toLocaleString()}`;

export const reportDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function summarizeSales(rows: BrandedSaleRow[]): BrandedSalesSummary {
  const summary = { sales: rows.length, units: 0, inPersonUnits: 0, onlineUnits: 0, revenue: 0, paid: 0, owed: 0, buyers: 0 };
  const buyers = new Set<string>();
  for (const row of rows) {
    summary.units += row.quantity;
    summary[row.source === 'online' ? 'onlineUnits' : 'inPersonUnits'] += row.quantity;
    summary.revenue += row.amount;
    summary[row.paymentStatus === 'paid' ? 'paid' : 'owed'] += row.amount;
    buyers.add(row.buyer.trim().toLowerCase());
  }
  return { ...summary, buyers: buyers.size };
}

/** Units and sales value per month, earliest first, with quiet months included. */
export function salesByMonth(rows: BrandedSaleRow[]) {
  if (!rows.length) return [];
  const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const totals = new Map<string, { units: number; revenue: number }>();
  let earliest = Infinity;
  let latest = -Infinity;
  for (const row of rows) {
    const date = new Date(row.date);
    earliest = Math.min(earliest, date.getTime());
    latest = Math.max(latest, date.getTime());
    const total = totals.get(keyOf(date)) || { units: 0, revenue: 0 };
    total.units += row.quantity;
    total.revenue += row.amount;
    totals.set(keyOf(date), total);
  }
  const months = [];
  const cursor = new Date(earliest);
  cursor.setDate(1);
  const last = new Date(latest);
  while (cursor <= last) {
    const month = keyOf(cursor);
    months.push({ month, units: totals.get(month)?.units || 0, revenue: totals.get(month)?.revenue || 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** The item's photo for the PDF. It may be hosted elsewhere and refuse to load, so the report works without it. */
function loadItemPhoto(src: string | null): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }
        const side = Math.min(image.width, image.height);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 200, 200);
        context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 200, 200);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

const NAVY: [number, number, number] = [30, 58, 95];
const GOLD: [number, number, number] = [201, 162, 39];

export async function downloadBrandedItemPdf(input: BrandedReportInput & { imageSrc: string | null }) {
  const { default: jsPDF } = await import('jspdf');
  const [logo, photo] = await Promise.all([loadLogoForPdf(), loadItemPhoto(input.imageSrc)]);
  const summary = summarizeSales(input.rows);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usable = pageWidth - margin * 2;

  // Cover band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, pageWidth, 1.2, 'F');
  if (logo) doc.addImage(logo, 'PNG', margin, 6, 20, 20.2);
  const textX = margin + (logo ? 24 : 0);
  doc.setTextColor(255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('PICC HOPE STORE  |  BRANDED MATERIAL SALES REPORT', textX, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(doc.splitTextToSize(input.item.name, photo ? 190 : 215)[0], textX, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${input.item.category}  |  ${reportMoney(input.item.price)} each  |  ${input.periodLabel}  |  ${input.filterLabel}`, textX, 25);
  if (photo) doc.addImage(photo, 'JPEG', pageWidth - margin - 24, 4, 24, 24);

  // Headline figures
  const boxes: Array<[string, string, string]> = [
    ['Units sold', summary.units.toLocaleString(), `${summary.inPersonUnits} in person, ${summary.onlineUnits} online`],
    ['Sales value', reportMoney(summary.revenue), `${summary.sales} ${summary.sales === 1 ? 'sale' : 'sales'}`],
    ['Paid', reportMoney(summary.paid), summary.revenue ? `${Math.round((summary.paid / summary.revenue) * 100)}% of sales value` : 'No sales'],
    ['Still owed', reportMoney(summary.owed), summary.owed ? 'To follow up' : 'Nothing outstanding'],
    ['In stock now', input.item.stock.toLocaleString(), `${summary.buyers} ${summary.buyers === 1 ? 'buyer' : 'buyers'} in this report`],
  ];
  const gap = 3;
  const boxWidth = (usable - gap * (boxes.length - 1)) / boxes.length;
  boxes.forEach(([label, value, detail], index) => {
    const x = margin + index * (boxWidth + gap);
    doc.setFillColor(244, 246, 249);
    doc.roundedRect(x, 37, boxWidth, 19, 1.5, 1.5, 'F');
    doc.setFillColor(...NAVY);
    doc.rect(x, 38.5, 0.8, 16, 'F');
    doc.setTextColor(90);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 3, 42);
    doc.setTextColor(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 3, 48);
    doc.setTextColor(90);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(detail, x + 3, 53);
  });

  // Sales table
  const columns: Array<{ label: string; width: number; align?: 'right'; value: (row: BrandedSaleRow) => string }> = [
    { label: 'Date', width: 23, value: (row) => reportDate(row.date) },
    { label: 'Buyer', width: 58, value: (row) => row.buyer },
    { label: 'Contact', width: 50, value: (row) => row.contact || '-' },
    { label: 'Sold', width: 20, value: (row) => (row.source === 'online' ? 'Online' : 'In person') },
    { label: 'Qty', width: 11, align: 'right', value: (row) => String(row.quantity) },
    { label: 'Amount', width: 30, align: 'right', value: (row) => reportMoney(row.amount) },
    { label: 'Payment', width: 20, value: (row) => (row.paymentStatus === 'paid' ? 'Paid' : 'Not paid') },
    { label: 'Method', width: 37, value: (row) => row.method || '-' },
    { label: 'Collected', width: 28, value: (row) => (row.source === 'online' ? '-' : row.collectionStatus === 'collected' ? 'Yes' : 'No') },
  ];
  const lineHeight = 3.8;
  const place = (column: (typeof columns)[number], x: number) => (column.align === 'right' ? x + column.width - 1.5 : x + 1.5);
  let y = 61;

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
  paintHeader();

  doc.setFontSize(8);
  input.rows.forEach((row, index) => {
    doc.setFont('helvetica', 'normal');
    const cells = columns.map((column) => doc.splitTextToSize(column.value(row), column.width - 3) as string[]);
    const height = Math.max(...cells.map((lines) => lines.length)) * lineHeight + 2.6;
    if (y + height > pageHeight - 12) {
      doc.addPage();
      y = margin;
      paintHeader();
      doc.setFont('helvetica', 'normal');
    }
    if (index % 2) {
      doc.setFillColor(247, 248, 250);
      doc.rect(margin, y, usable, height, 'F');
    }
    let x = margin;
    columns.forEach((column, columnIndex) => {
      if (column.label === 'Payment' && row.paymentStatus !== 'paid') doc.setTextColor(185, 28, 28);
      else doc.setTextColor(30);
      doc.text(cells[columnIndex], place(column, x), y + 3.9, { align: column.align || 'left' });
      x += column.width;
    });
    y += height;
  });

  if (input.rows.length) {
    if (y + 8 > pageHeight - 12) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(...NAVY);
    doc.line(margin, y, margin + usable, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text('Total', margin + 1.5, y + 5);
    const qtyEnd = margin + columns.slice(0, 5).reduce((sum, column) => sum + column.width, 0) - 1.5;
    const amountEnd = qtyEnd + columns[5].width;
    doc.text(summary.units.toLocaleString(), qtyEnd, y + 5, { align: 'right' });
    doc.text(reportMoney(summary.revenue), amountEnd, y + 5, { align: 'right' });
  } else {
    doc.setTextColor(90);
    doc.text('No sales in this report.', margin + 1.5, y + 6);
  }

  const pages = doc.getNumberOfPages();
  const printed = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(`Pentecost International Christian Centre  |  Printed ${printed}`, margin, pageHeight - 5);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }
  doc.save(`${input.fileName}.pdf`);
}

const xml = (value: string) =>
  value
    // Characters XML cannot carry at all would make Excel refuse the whole file.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

type XmlCell = string | number | { date: string } | { heading: string } | { title: string } | { money: number };

function xmlCell(cell: XmlCell) {
  if (typeof cell === 'number') return `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`;
  if (typeof cell === 'string') return `<Cell><Data ss:Type="String">${xml(cell)}</Data></Cell>`;
  if ('money' in cell) return `<Cell ss:StyleID="money"><Data ss:Type="Number">${cell.money}</Data></Cell>`;
  if ('date' in cell) return `<Cell ss:StyleID="date"><Data ss:Type="DateTime">${new Date(cell.date).toISOString().slice(0, 19)}</Data></Cell>`;
  if ('title' in cell) return `<Cell ss:StyleID="title"><Data ss:Type="String">${xml(cell.title)}</Data></Cell>`;
  return `<Cell ss:StyleID="heading"><Data ss:Type="String">${xml(cell.heading)}</Data></Cell>`;
}

function xmlSheet(name: string, widths: number[], rows: XmlCell[][]) {
  const columns = widths.map((width) => `<Column ss:Width="${width}"/>`).join('');
  const body = rows.map((row) => `<Row>${row.map(xmlCell).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns}${body}</Table></Worksheet>`;
}

/** A workbook of three sheets. Amounts and dates are real numbers and dates, so Excel can total and sort them. */
export function downloadBrandedItemExcel(input: BrandedReportInput) {
  const summary = summarizeSales(input.rows);
  const summarySheet = xmlSheet('Summary', [150, 200], [
    [{ title: `${input.item.name}: sales report` }],
    ['Period', input.periodLabel],
    ['Showing', input.filterLabel],
    ['Type', input.item.category],
    ['Price each', { money: input.item.price }],
    [],
    [{ heading: 'Figure' }, { heading: 'Value' }],
    ['Sales', summary.sales],
    ['Units sold', summary.units],
    ['Units sold in person', summary.inPersonUnits],
    ['Units sold online', summary.onlineUnits],
    ['Different buyers', summary.buyers],
    ['Sales value', { money: summary.revenue }],
    ['Paid', { money: summary.paid }],
    ['Still owed', { money: summary.owed }],
    ['In stock now', input.item.stock],
  ]);
  const salesSheet = xmlSheet('Sales', [75, 140, 140, 65, 40, 80, 65, 100, 85, 110, 170], [
    ['Date', 'Buyer', 'Contact', 'Sold', 'Qty', 'Amount (MWK)', 'Payment', 'Method', 'Collection', 'Reference', 'Note'].map((heading) => ({ heading })),
    ...input.rows.map((row): XmlCell[] => [
      { date: row.date },
      row.buyer,
      row.contact || '',
      row.source === 'online' ? 'Online' : 'In person',
      row.quantity,
      { money: row.amount },
      row.paymentStatus === 'paid' ? 'Paid' : 'Not paid',
      row.method || '',
      row.source === 'online' ? '' : row.collectionStatus || '',
      row.reference || '',
      row.note || '',
    ]),
    [{ heading: 'Total' }, '', '', '', summary.units, { money: summary.revenue }],
  ]);
  const monthSheet = xmlSheet('By month', [80, 60, 90], [
    ['Month', 'Units', 'Sales value (MWK)'].map((heading) => ({ heading })),
    ...salesByMonth(input.rows).map((row): XmlCell[] => [row.month, row.units, { money: row.revenue }]),
  ]);
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="title"><Font ss:Bold="1" ss:Size="14" ss:Color="#1E3A5F"/></Style>
    <Style ss:ID="heading"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E3A5F" ss:Pattern="Solid"/></Style>
    <Style ss:ID="money"><NumberFormat ss:Format="#,##0"/></Style>
    <Style ss:ID="date"><NumberFormat ss:Format="dd mmm yyyy"/></Style>
  </Styles>
  ${summarySheet}${salesSheet}${monthSheet}
</Workbook>`;
  downloadBlob(new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${input.fileName}.xls`);
}
