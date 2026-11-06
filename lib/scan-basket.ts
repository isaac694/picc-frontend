'use client';

/**
 * The books a customer has scanned so far. It is kept on the phone, not just in the page, because
 * scanning the next label with the phone's own camera opens a fresh copy of the scan page.
 */

export type SavedScanLine = { code: string; quantity: number };

type SavedBasket = { lines: SavedScanLine[]; savedAt: number; checkoutReference?: string };

const STORAGE_KEY = 'hope_bookshop_scan_basket';
// Long enough for one visit to the bookshop; an old basket must not surprise the customer next time.
const LIFETIME_MS = 2 * 60 * 60 * 1000;

function load(): SavedBasket | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as SavedBasket | null;
    if (!saved || !Array.isArray(saved.lines) || Date.now() - saved.savedAt > LIFETIME_MS) return null;
    return saved;
  } catch {
    return null;
  }
}

function store(basket: SavedBasket | null) {
  try {
    if (basket) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not remembered, but the page still works for this visit.
  }
}

export function readScanBasket(): SavedScanLine[] {
  return load()?.lines ?? [];
}

export function saveScanBasket(lines: SavedScanLine[]) {
  store(lines.length ? { lines, savedAt: Date.now(), checkoutReference: load()?.checkoutReference } : null);
}

/** Remembers which order the basket went to checkout as, so its receipt can empty the basket once paid. */
export function markScanBasketCheckout(reference: string) {
  const saved = load();
  if (saved) store({ ...saved, checkoutReference: reference });
}

export function clearScanBasket() {
  store(null);
}

export function clearScanBasketAfterPayment(reference: string) {
  if (load()?.checkoutReference === reference) store(null);
}
