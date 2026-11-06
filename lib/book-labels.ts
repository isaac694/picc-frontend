'use client';

/**
 * Hard copy labels for the Hope Bookshop. Each label carries a QR code that opens the book's pay page
 * when scanned with a phone camera, and a Code 128 barcode (with the code printed under it) for
 * counter scanners and for typing in by hand.
 */

// Code 128 bar/space widths for values 0-106 (106 is the stop pattern).
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const START_B = 104;
const STOP = 106;

/** Bar widths (alternating bar, space) for `text` in Code 128 set B, with checksum and quiet zones. */
export function code128Widths(text: string): number[] {
  const values = [...text].map((char) => {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126) throw new Error(`Cannot put "${char}" in a barcode.`);
    return code - 32;
  });
  const checksum = values.reduce((sum, value, index) => sum + value * (index + 1), START_B) % 103;
  return [START_B, ...values, checksum, STOP].flatMap((value) => [...CODE128_PATTERNS[value]].map(Number));
}

/** Barcode as SVG rects inside a box `width` x `height` (user units). */
export function code128Svg(text: string, x: number, y: number, width: number, height: number) {
  const widths = code128Widths(text);
  const quiet = 10;
  const modules = widths.reduce((sum, value) => sum + value, 0) + quiet * 2;
  const unit = width / modules;
  let cursor = x + quiet * unit;
  const bars: string[] = [];
  widths.forEach((value, index) => {
    if (index % 2 === 0) bars.push(`<rect x="${cursor.toFixed(3)}" y="${y}" width="${(value * unit).toFixed(3)}" height="${height}" fill="#000"/>`);
    cursor += value * unit;
  });
  return bars.join('');
}

export type LabelBook = { title: string; author?: string | null; price: number; barcode: string };

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

/**
 * The site address for links that leave this computer (QR labels, shared receipts). A label printed
 * from localhost would otherwise send every customer's phone to an address that only exists here.
 */
export function publicSiteOrigin() {
  const { hostname, origin } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return origin;
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.piccworldwide.org').replace(/\/+$/, '');
}

export function scanUrlFor(barcode: string) {
  return `${publicSiteOrigin()}/store/scan/${encodeURIComponent(barcode)}`;
}

/** A QR label scans as the pay page link; the code is its last part. */
export function codeFromScan(value: string) {
  const text = value.trim();
  const match = /\/store\/scan\/([^/?#]+)/.exec(text);
  return match ? decodeURIComponent(match[1]) : text;
}

export type LabelStyle = 'both' | 'barcode' | 'qr';

export const LABEL_STYLES: Array<{ value: LabelStyle; label: string; hint: string }> = [
  { value: 'both', label: 'QR code and barcode', hint: 'Phones scan the QR code; counter scanners read the barcode.' },
  { value: 'barcode', label: 'Barcode only', hint: 'A large barcode for counter scanners, with the code printed under it.' },
  { value: 'qr', label: 'QR code only', hint: 'A large QR code customers scan with a phone camera to pay.' },
];

const FONT = 'font-family="Arial, sans-serif"';

async function qrSvgAt(barcode: string, x: number, y: number, size: number) {
  const QRCode = (await import('qrcode')).default;
  const qr = await QRCode.toString(scanUrlFor(barcode), { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  return qr.replace(/^[\s\S]*?<svg[^>]*viewBox="([^"]+)"[^>]*>/, `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="$1">`);
}

/** One label as an SVG document, 60 x 40 mm, carrying the QR code, the barcode, or both. */
export async function bookLabelSvg(book: LabelBook, style: LabelStyle = 'both') {
  const price = `MWK ${Number(book.price || 0).toLocaleString()}`;
  const code = escapeXml(book.barcode);
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="60mm" height="40mm" viewBox="0 0 60 40">
  <rect width="60" height="40" rx="1.5" fill="#fff" stroke="#1e3a5f" stroke-width="0.3"/>
  <text x="2" y="4.6" ${FONT} font-size="2.6" font-weight="700" fill="#1e3a5f">HOPE BOOKSHOP · PICC</text>`;

  if (style === 'barcode') {
    return `${head}
  <text x="2" y="10" ${FONT} font-size="3.2" font-weight="700" fill="#111">${escapeXml(clip(book.title, 32))}</text>
  ${book.author ? `<text x="2" y="13.6" ${FONT} font-size="2.3" fill="#444">${escapeXml(clip(book.author, 26))}</text>` : ''}
  <text x="58" y="13.6" text-anchor="end" ${FONT} font-size="3.4" font-weight="700" fill="#111">${price}</text>
  ${code128Svg(book.barcode, 1, 16, 58, 17)}
  <text x="30" y="38" text-anchor="middle" font-family="Courier New, monospace" font-size="3" letter-spacing="0.6" fill="#111">${code}</text>
</svg>`;
  }

  if (style === 'qr') {
    return `${head}
  ${await qrSvgAt(book.barcode, 2, 7, 31)}
  <text x="36" y="11" ${FONT} font-size="2.8" font-weight="700" fill="#111">${escapeXml(clip(book.title, 14))}</text>
  ${book.author ? `<text x="36" y="14.4" ${FONT} font-size="2.1" fill="#444">${escapeXml(clip(book.author, 18))}</text>` : ''}
  <text x="36" y="21" ${FONT} font-size="3.6" font-weight="700" fill="#111">${price}</text>
  <text x="36" y="26" ${FONT} font-size="2" fill="#444">Scan with your phone</text>
  <text x="36" y="28.6" ${FONT} font-size="2" fill="#444">to pay with mobile</text>
  <text x="36" y="31.2" ${FONT} font-size="2" fill="#444">money.</text>
  <text x="36" y="37.5" font-family="Courier New, monospace" font-size="2.4" fill="#111">${code}</text>
</svg>`;
  }

  return `${head}
  ${await qrSvgAt(book.barcode, 2, 7, 22)}
  <text x="26" y="10" ${FONT} font-size="2.9" font-weight="700" fill="#111">${escapeXml(clip(book.title, 24))}</text>
  ${book.author ? `<text x="26" y="13.6" ${FONT} font-size="2.2" fill="#444">${escapeXml(clip(book.author, 30))}</text>` : ''}
  <text x="26" y="19.5" ${FONT} font-size="4.2" font-weight="700" fill="#111">${price}</text>
  <text x="26" y="24" ${FONT} font-size="2" fill="#444">Scan the QR code with your phone</text>
  <text x="26" y="26.6" ${FONT} font-size="2" fill="#444">to pay with mobile money.</text>
  ${code128Svg(book.barcode, 2, 30.5, 56, 6)}
  <text x="30" y="39" text-anchor="middle" font-family="Courier New, monospace" font-size="2.4" letter-spacing="0.4" fill="#111">${code}</text>
</svg>`;
}

/** PNG of one label at print resolution (about 300 dpi). */
export async function downloadLabelPng(book: LabelBook, style: LabelStyle = 'both') {
  const svg = await bookLabelSvg(book, style);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to draw the label.'));
    image.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 709;
  canvas.height = 472;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to draw the label.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `label-${book.barcode}${style === 'both' ? '' : `-${style}`}.png`;
  link.click();
}

/** Opens the print dialog with an A4 sheet of labels (3 across); `copies` labels per book. */
export async function printLabelSheet(entries: Array<{ book: LabelBook; copies: number }>, style: LabelStyle = 'both') {
  const labels: string[] = [];
  for (const entry of entries) {
    // One image per book, repeated: far lighter than copying the SVG markup for every label.
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await bookLabelSvg(entry.book, style))}`;
    for (let index = 0; index < Math.max(1, Math.min(entry.copies, 300)); index += 1) labels.push(`<div class="label"><img src="${src}" alt=""></div>`);
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Book labels</title>
<style>
  @page { size: A4; margin: 8mm; }
  body { margin: 0; font-family: Arial, sans-serif; }
  .sheet { display: grid; grid-template-columns: repeat(3, 60mm); gap: 3mm; justify-content: center; }
  .label { width: 60mm; height: 40mm; break-inside: avoid; }
  .label img { width: 60mm; height: 40mm; display: block; }
</style></head><body><div class="sheet">${labels.join('')}</div></body></html>`;
  printHtml(html, 'Book labels');
}

/** Prints an HTML document through a hidden frame. */
export function printHtml(html: string, title: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('title', title);
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  // Wait for every label image to draw (up to 15 seconds) so large batches do not print blank.
  const images = Array.from(doc.images);
  const loaded = Promise.all(images.map((image) => (image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  }))));
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 15000));
  void Promise.race([loaded, timeout]).then(() => {
    window.setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1500);
    }, 300);
  });
}
