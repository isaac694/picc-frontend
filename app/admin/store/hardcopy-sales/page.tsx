'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, Mail, Printer, RefreshCw, ScanLine, Search, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import PeriodFilter from '@/components/admin/PeriodFilter';
import { KpiCard } from '@/components/admin/DashboardBits';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { downloadReport, periodLabel, periodParams, periodSlug, withParams, type Period } from '@/lib/admin-reports';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadReceiptPdf, money, printReceipt, receiptDate, REFERENCE_HINTS, type StoreOrder } from '@/lib/store-receipt';
import { cn } from '@/lib/utils';

type LookedUpBook = { title: string; author: string | null; price: number; hardCopyStock: number; available: boolean; barcode: string };
type BasketLine = LookedUpBook & { quantity: number };
type Summary = { orders: number; copies: number; paidTotal: number; pendingTotal: number; byMethod: Array<{ method: string; total: number }> };

// Payments taken at the counter. Online PayChangu payments confirm themselves, so they are not offered here.
const PAYMENT_METHODS = ['Cash', 'POS', 'Bank Transfer', 'Airtel Money agent', 'TNM Mpamba'];
const needsReference = (method: string) => method !== 'Cash';
const AUTO_PRINT_KEY = 'hardcopy_sales_auto_print';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};
const CHANNEL_LABELS: Record<string, string> = { scan: 'Customer scan', counter: 'Counter' };

/** A QR label scans as the pay page link; the code is its last part. */
function codeFromScan(value: string) {
  const text = value.trim();
  const match = /\/store\/scan\/([^/?#]+)/.exec(text);
  return match ? decodeURIComponent(match[1]) : text;
}

type DetectedCode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> };

function CameraScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState('Starting camera…');

  useEffect(() => {
    const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
    if (!Detector) {
      setMessage('This browser cannot scan barcodes. Use Chrome on Android, or type the code.');
      return;
    }
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const detector = new Detector({ formats: ['qr_code', 'code_128'] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (media) => {
        stream = media;
        if (!videoRef.current) return;
        videoRef.current.srcObject = media;
        await videoRef.current.play();
        setMessage('Point the camera at the label.');
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              onCode(codeFromScan(codes[0].rawValue));
              return;
            }
          } catch {
            // Keep trying on the next frame.
          }
          frame = requestAnimationFrame(() => void tick());
        };
        void tick();
      })
      .catch(() => setMessage('Camera permission was refused. Type the code instead.'));
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onCode]);

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-black p-2">
      <video ref={videoRef} className="aspect-video w-full rounded bg-black object-cover" muted playsInline />
      <div className="flex items-center justify-between gap-2 text-xs text-white/80">
        <span>{message}</span>
        <Button size="sm" variant="secondary" onClick={onClose}>Close camera</Button>
      </div>
    </div>
  );
}

export default function HardcopySalesPage() {
  const { token, email, password, loginError, setEmail, setPassword, handleLogin } = useAdminAuth();

  // New sale
  const [code, setCode] = useState('');
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [method, setMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paidNow, setPaidNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastOrder, setLastOrder] = useState<StoreOrder | null>(null);

  // Orders
  const [period, setPeriod] = useState<Period>({ preset: 'month' });
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // Confirming an order that is waiting for payment
  const [confirming, setConfirming] = useState<StoreOrder | null>(null);
  const [confirmMethod, setConfirmMethod] = useState('Cash');
  const [confirmReference, setConfirmReference] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  // Emailing a paid receipt
  const [emailing, setEmailing] = useState<StoreOrder | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // The till remembers whether to print every receipt straight away.
  useEffect(() => {
    try {
      if (localStorage.getItem(AUTO_PRINT_KEY) === 'off') setAutoPrint(false);
    } catch {
      // Private windows may block storage; keep printing on.
    }
  }, []);

  const changeAutoPrint = (value: boolean) => {
    setAutoPrint(value);
    try {
      localStorage.setItem(AUTO_PRINT_KEY, value ? 'on' : 'off');
    } catch {
      // Not remembered, but still applies to this visit.
    }
  };

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  // Each scan adds the book to the basket; scanning the same book again adds another copy.
  const lookUp = useCallback(async (value: string) => {
    const cleaned = codeFromScan(value);
    setCode(cleaned);
    setLookupError('');
    if (!cleaned) return;
    const response = await apiFetch(`/api/store/scan/${encodeURIComponent(cleaned)}`);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setLookupError(data?.error || 'No book matches that code.');
      return;
    }
    const found: LookedUpBook = data.book;
    setBasket((current) => {
      const existing = current.find((line) => line.barcode === found.barcode);
      if (existing) {
        return current.map((line) => (line.barcode === found.barcode ? { ...line, ...found, quantity: line.quantity + 1 } : line));
      }
      return [...current, { ...found, quantity: 1 }];
    });
    setCode('');
  }, []);

  const setLineQuantity = (barcode: string, quantity: number) =>
    setBasket((current) => current.map((line) => (line.barcode === barcode ? { ...line, quantity: Math.min(50, Math.max(1, quantity)) } : line)));
  const removeLine = (barcode: string) => setBasket((current) => current.filter((line) => line.barcode !== barcode));
  const basketCopies = basket.reduce((sum, line) => sum + line.quantity, 0);
  const basketTotal = basket.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const overStock = basket.filter((line) => line.quantity > line.hardCopyStock);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch(withParams('/api/admin/store/hardcopy-orders', { ...periodParams(period), channel, status, q: query }), { headers: headers() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to load hard copy sales.');
        return;
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setSummary(data?.summary || null);
    } finally {
      setLoading(false);
    }
  }, [token, period, channel, status, query, headers]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const recordSale = async (event: React.FormEvent) => {
    event.preventDefault();
    if (basket.length === 0) {
      setLookupError('Scan or type a book code to add it to the sale.');
      return;
    }
    if (overStock.length) {
      adminErrorToast(`Only ${overStock[0].hardCopyStock} in stock for ${overStock[0].title}.`);
      return;
    }
    if (!buyerName.trim()) {
      adminErrorToast('Enter the buyer name.');
      return;
    }
    if (buyerEmail.trim() && !EMAIL_PATTERN.test(buyerEmail.trim())) {
      adminErrorToast('Enter a valid email address, or leave it empty.');
      return;
    }
    if (paidNow && needsReference(method) && !paymentReference.trim()) {
      adminErrorToast(`Enter the ${REFERENCE_HINTS[method] || 'payment reference'}.`);
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/store/counter-sales', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          items: basket.map((line) => ({ barcode: line.barcode, quantity: line.quantity })),
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          email: buyerEmail.trim(),
          paymentMethod: method,
          paymentReference: needsReference(method) ? paymentReference.trim() : '',
          paid: paidNow,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to record this sale.');
        return;
      }
      setLastOrder(data.order);
      adminSuccessToast(`Sale recorded: ${data.order.receiptNumber}${data.receiptEmailTo ? `. Receipt emailed to ${data.receiptEmailTo}` : ''}`);
      if (autoPrint) printReceipt(data.order);
      setBuyerName('');
      setBuyerPhone('');
      setBuyerEmail('');
      setPaymentReference('');
      setCode('');
      setBasket([]);
      await loadOrders();
    } finally {
      setSaving(false);
    }
  };

  const act = async (order: StoreOrder, action: 'confirm' | 'cancel', payment?: { paymentMethod: string; paymentReference: string; email: string }) => {
    const response = await apiFetch(`/api/admin/store/hardcopy-orders/${encodeURIComponent(order.reference)}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ action, ...payment }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      adminErrorToast(data?.error || 'Unable to update this order.');
      return false;
    }
    if (action === 'confirm') {
      adminSuccessToast(`Payment confirmed.${data?.receiptEmailTo ? ` Receipt emailed to ${data.receiptEmailTo}.` : ''}`);
      if (data?.order) {
        setLastOrder(data.order);
        if (autoPrint) printReceipt(data.order);
      }
    } else {
      adminSuccessToast('Order cancelled and copies returned to stock.');
    }
    await loadOrders();
    return true;
  };

  const openEmail = (order: StoreOrder) => {
    setEmailing(order);
    setEmailTo(order.customerEmail || '');
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailing) return;
    if (!EMAIL_PATTERN.test(emailTo.trim())) {
      adminErrorToast('Enter a valid email address.');
      return;
    }
    setSendingEmail(true);
    try {
      const response = await apiFetch(`/api/admin/store/hardcopy-orders/${encodeURIComponent(emailing.reference)}/email-receipt`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email: emailTo.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        adminErrorToast(data?.error || 'Unable to email this receipt.');
        return;
      }
      adminSuccessToast(data?.message || 'Receipt emailed.');
      if (lastOrder?.reference === emailing.reference) setLastOrder({ ...lastOrder, customerEmail: emailTo.trim().toLowerCase() });
      setEmailing(null);
      await loadOrders();
    } finally {
      setSendingEmail(false);
    }
  };

  const openConfirm = (order: StoreOrder) => {
    setConfirming(order);
    setConfirmMethod(order.paymentMethod && PAYMENT_METHODS.includes(order.paymentMethod) ? order.paymentMethod : 'Cash');
    setConfirmReference(order.paymentReference || '');
    setConfirmEmail(order.customerEmail || '');
  };

  const submitConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirming) return;
    if (needsReference(confirmMethod) && !confirmReference.trim()) {
      adminErrorToast(`Enter the ${REFERENCE_HINTS[confirmMethod] || 'payment reference'}.`);
      return;
    }
    if (confirmEmail.trim() && !EMAIL_PATTERN.test(confirmEmail.trim())) {
      adminErrorToast('Enter a valid email address, or leave it empty.');
      return;
    }
    const done = await act(confirming, 'confirm', {
      paymentMethod: confirmMethod,
      paymentReference: needsReference(confirmMethod) ? confirmReference.trim() : '',
      email: confirmEmail.trim(),
    });
    if (done) setConfirming(null);
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    if (orders.length === 0) {
      adminErrorToast('There are no sales in this period.');
      return;
    }
    await downloadReport({
      format,
      title: `Hope Bookshop hard copy sales, ${periodLabel(period)}`,
      fileName: `hard-copy-sales-${periodSlug(period)}`,
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'receipt', label: 'Receipt' },
        { key: 'buyer', label: 'Buyer' },
        { key: 'books', label: 'Books' },
        { key: 'qty', label: 'Qty' },
        { key: 'total', label: 'Total' },
        { key: 'method', label: 'Payment' },
        { key: 'reference', label: 'Reference' },
        { key: 'status', label: 'Status' },
      ],
      rows: orders.map((order) => ({
        date: receiptDate(order.createdAt),
        receipt: order.receiptNumber || '',
        buyer: [order.buyerName, order.buyerPhone].filter(Boolean).join(' · '),
        books: order.items.map((item) => `${item.title} ×${item.quantity}`).join(', '),
        qty: String(order.quantity),
        total: money(order.total, order.currency),
        method: order.paymentMethod || '',
        reference: order.paymentReference || '',
        status: order.status,
      })),
      summary: [
        ['PAID', money(summary?.paidTotal || 0)],
        ['AWAITING PAYMENT', money(summary?.pendingTotal || 0)],
        ...(summary?.byMethod || []).filter((entry) => entry.total > 0).map((entry) => [entry.method, money(entry.total)] as [string, string]),
      ],
    });
  };

  if (!token) {
    return <AdminLoginCard email={email} password={password} loginError={loginError} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Hope Bookshop</p>
          <h1 className="text-2xl font-semibold">Hard copy sales</h1>
          <p className="text-sm text-muted-foreground">Scan a book label to sell at the counter, confirm customers who chose to pay at the counter, and print receipts.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void exportReport('pdf')}><FileText className="h-4 w-4" /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => void exportReport('excel')}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={recordSale} className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><ScanLine className="h-4 w-4 text-primary" /> New counter sale</h2>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                // Counter scanners type the code and press Enter.
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void lookUp(code);
                }
              }}
              placeholder="Scan or type a barcode to add a book, e.g. HB12345678"
              autoFocus
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 font-mono text-sm"
              aria-label="Book barcode"
            />
            <Button type="button" variant="outline" onClick={() => void lookUp(code)}><Search className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" onClick={() => setScanning((value) => !value)} aria-label="Scan with camera"><Camera className="h-4 w-4" /></Button>
          </div>
          {scanning ? (
            <CameraScanner
              onClose={() => setScanning(false)}
              onCode={(value) => {
                setScanning(false);
                void lookUp(value);
              }}
            />
          ) : null}
          {lookupError ? <p className="text-sm text-destructive">{lookupError}</p> : null}
          {basket.length ? (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <ul className="divide-y divide-border/60">
                {basket.map((line) => (
                  <li key={line.barcode} className="flex items-center justify-between gap-3 bg-muted/30 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{line.title}</p>
                      <p className={cn('text-xs', line.quantity > line.hardCopyStock ? 'text-destructive' : 'text-muted-foreground')}>
                        {money(line.price)} · {line.hardCopyStock} in stock
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={line.quantity}
                        onChange={(event) => setLineQuantity(line.barcode, Number(event.target.value) || 1)}
                        className="h-8 w-16 rounded-md border border-border bg-background px-2 text-sm"
                        aria-label={`Copies of ${line.title}`}
                      />
                      <span className="w-24 text-right text-sm font-semibold">{money(line.price * line.quantity)}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={`Remove ${line.title}`} onClick={() => removeLine(line.barcode)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{basket.length} {basket.length === 1 ? 'title' : 'titles'} · {basketCopies} {basketCopies === 1 ? 'copy' : 'copies'}</span>
                <span className="font-semibold">{money(basketTotal)}</span>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
              Scan each book to add it to this sale. Scan the same book again to add another copy.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Buyer name" className="h-10 rounded-md border border-border bg-background px-3 text-sm" aria-label="Buyer name" />
            <input value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="Phone (optional)" type="tel" className="h-10 rounded-md border border-border bg-background px-3 text-sm" aria-label="Buyer phone" />
            <input value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} placeholder="Email for the receipt (optional)" type="email" className="h-10 rounded-md border border-border bg-background px-3 text-sm sm:col-span-2" aria-label="Buyer email" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHODS.map((entry) => (
              <button key={entry} type="button" role="radio" aria-checked={method === entry} onClick={() => setMethod(entry)} className={cn('rounded-full border px-3 py-1 text-xs font-medium', method === entry ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}>
                {entry}
              </button>
            ))}
          </div>
          {needsReference(method) ? (
            <label className="block text-xs text-muted-foreground">
              {REFERENCE_HINTS[method]}{paidNow ? ' (required)' : ' (add it now or when you confirm payment)'}
              <input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder={method === 'POS' ? 'e.g. 004512' : 'e.g. CI250611.1530.H12345'}
                maxLength={120}
                required={paidNow}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground"
                aria-label={REFERENCE_HINTS[method]}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={paidNow} onChange={(event) => setPaidNow(event.target.checked)} /> Payment received now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoPrint} onChange={(event) => changeAutoPrint(event.target.checked)} /> Print receipt straight away
              </label>
            </div>
            <div className="flex gap-2">
              {basket.length ? <Button type="button" variant="outline" onClick={() => setBasket([])} disabled={saving}>Clear</Button> : null}
              <Button type="submit" disabled={saving || basket.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Record sale{basket.length ? ` · ${money(basketTotal)}` : ''}
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Last receipt</h2>
          {lastOrder ? (
            <>
              <p className="font-mono text-lg font-bold">{lastOrder.receiptNumber}</p>
              <p className="text-sm text-muted-foreground">{lastOrder.buyerName} · {money(lastOrder.total)} · {lastOrder.paymentMethod}</p>
              {lastOrder.paymentReference ? <p className="font-mono text-xs text-muted-foreground">Ref: {lastOrder.paymentReference}</p> : null}
              {lastOrder.customerEmail ? <p className="text-xs text-muted-foreground">Email: {lastOrder.customerEmail}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => printReceipt(lastOrder)}><Printer className="h-4 w-4" /> Print</Button>
                <Button size="sm" variant="outline" onClick={() => void downloadReceiptPdf(lastOrder)}><Download className="h-4 w-4" /> PDF</Button>
                {lastOrder.status === 'paid' ? (
                  <Button size="sm" variant="outline" onClick={() => openEmail(lastOrder)}><Mail className="h-4 w-4" /> Email</Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Receipts for sales you record appear here, ready to print.</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CheckCircle2} label="Paid" value={money(summary?.paidTotal || 0)} detail={periodLabel(period)} />
        <KpiCard icon={Loader2} label="Awaiting payment" value={money(summary?.pendingTotal || 0)} />
        <KpiCard icon={ScanLine} label="Orders" value={summary?.orders ?? '—'} />
        <KpiCard icon={FileText} label="Copies sold" value={summary?.copies ?? '—'} />
      </div>
      {summary?.byMethod.some((entry) => entry.total > 0) ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {summary.byMethod.filter((entry) => entry.total > 0).map((entry) => (
            <span key={entry.method} className="rounded-full bg-muted px-3 py-1"><strong>{entry.method}:</strong> {money(entry.total)}</span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3">
        <PeriodFilter value={period} onChange={setPeriod} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Receipt, buyer, book or reference, then Enter" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm" />
          </form>
          <select value={channel} onChange={(event) => setChannel(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm" aria-label="Channel">
            <option value="">Scans and counter</option>
            <option value="scan">Customer scans</option>
            <option value="counter">Counter sales</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm" aria-label="Status">
            <option value="">Any status</option>
            <option value="paid">Paid</option>
            <option value="pending">Awaiting payment</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button size="sm" variant="outline" className="h-9" onClick={() => void loadOrders()} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Receipt</th>
              <th className="px-3 py-2 font-medium">Buyer</th>
              <th className="px-3 py-2 font-medium">Books</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No hard copy sales in this period.</td></tr>
            ) : orders.map((order) => (
              <tr key={order.reference} className="border-t border-border/60 align-top">
                <td className="px-3 py-2">
                  <p className="font-mono text-xs font-semibold">{order.receiptNumber}</p>
                  <p className="text-[11px] text-muted-foreground">{receiptDate(order.createdAt)} · {CHANNEL_LABELS[order.channel] || order.channel}</p>
                </td>
                <td className="px-3 py-2">{order.buyerName}<p className="text-[11px] text-muted-foreground">{order.buyerPhone}</p></td>
                <td className="px-3 py-2">{order.items.map((item) => `${item.title} ×${item.quantity}`).join(', ')}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{money(order.total, order.currency)}</td>
                <td className="px-3 py-2">
                  {order.paymentMethod}
                  {order.paymentReference ? <p className="break-all font-mono text-[11px] text-muted-foreground">{order.paymentReference}</p> : null}
                </td>
                <td className="px-3 py-2"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[order.status])}>{order.status === 'pending' ? 'awaiting' : order.status}</span></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {order.status === 'pending' ? (
                      <Button size="sm" variant="outline" className="h-8 border-emerald-300 bg-emerald-50 text-xs text-emerald-900 hover:bg-emerald-100" onClick={() => openConfirm(order)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirm paid
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" aria-label="Print receipt" onClick={() => printReceipt(order)}><Printer className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Download receipt" onClick={() => void downloadReceiptPdf(order)}><Download className="h-4 w-4" /></Button>
                    {order.status === 'paid' ? (
                      <Button size="icon" variant="ghost" aria-label="Email receipt" title={order.customerEmail ? `Email receipt to ${order.customerEmail}` : 'Email receipt'} onClick={() => openEmail(order)}><Mail className="h-4 w-4" /></Button>
                    ) : null}
                    {order.status !== 'cancelled' ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        aria-label="Cancel order"
                        onClick={() => confirmDeleteToast({
                          title: `Cancel ${order.receiptNumber}?`,
                          description: 'The copies go back into stock and the receipt shows cancelled.',
                          onConfirm: async () => { await act(order, 'cancel'); },
                        })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(confirming)} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitConfirm} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Confirm payment</DialogTitle>
              <DialogDescription>
                {confirming ? `${confirming.receiptNumber} · ${confirming.buyerName || 'Customer'} · ${money(confirming.total, confirming.currency)}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Paid by">
              {PAYMENT_METHODS.map((entry) => (
                <button key={entry} type="button" role="radio" aria-checked={confirmMethod === entry} onClick={() => setConfirmMethod(entry)} className={cn('rounded-full border px-3 py-1 text-xs font-medium', confirmMethod === entry ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}>
                  {entry}
                </button>
              ))}
            </div>
            {needsReference(confirmMethod) ? (
              <label className="block text-xs text-muted-foreground">
                {REFERENCE_HINTS[confirmMethod]} (required)
                <input
                  value={confirmReference}
                  onChange={(event) => setConfirmReference(event.target.value)}
                  maxLength={120}
                  required
                  autoFocus
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground"
                  aria-label={REFERENCE_HINTS[confirmMethod]}
                />
              </label>
            ) : null}
            <label className="block text-xs text-muted-foreground">
              Email the receipt to (optional)
              <input
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                type="email"
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                aria-label="Receipt email"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirming(null)}>Close</Button>
              <Button type="submit"><CheckCircle2 className="h-4 w-4" /> Confirm paid</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(emailing)} onOpenChange={(open) => !open && setEmailing(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitEmail} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Email receipt</DialogTitle>
              <DialogDescription>
                {emailing ? `${emailing.receiptNumber} · ${emailing.buyerName || 'Customer'} · ${money(emailing.total, emailing.currency)}` : ''}
              </DialogDescription>
            </DialogHeader>
            <label className="block text-xs text-muted-foreground">
              Customer email
              <input
                value={emailTo}
                onChange={(event) => setEmailTo(event.target.value)}
                type="email"
                required
                autoFocus
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                aria-label="Customer email"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailing(null)}>Close</Button>
              <Button type="submit" disabled={sendingEmail}>
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
