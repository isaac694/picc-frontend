'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import LabelStylePicker from '@/components/admin/LabelStylePicker';
import { bookLabelSvg, downloadLabelPng, printLabelSheet, scanUrlFor, type LabelBook, type LabelStyle } from '@/lib/book-labels';

/** Preview, download and print the label that goes on a hard copy. */
export default function BookBarcodeDialog({ book, stock, onOpenChange }: { book: LabelBook | null; stock?: number; onOpenChange: (open: boolean) => void }) {
  const [svg, setSvg] = useState('');
  const [copies, setCopies] = useState(1);
  const [style, setStyle] = useState<LabelStyle>('both');

  // The parent passes a fresh object each render, so redraw only when the label content changes.
  const labelKey = book ? JSON.stringify(book) : '';
  useEffect(() => {
    if (book) setCopies(Math.max(1, Math.min(stock || 1, 60)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelKey, stock]);

  useEffect(() => {
    if (!book) return;
    let alive = true;
    bookLabelSvg(book, style)
      .then((markup) => alive && setSvg(markup))
      .catch(() => alive && setSvg(''));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelKey, style]);

  return (
    <Dialog open={Boolean(book)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Barcode label</DialogTitle>
          <DialogDescription>
            Print and stick this on each hard copy. Customers scan the QR code with their phone camera to pay; the barcode works with counter scanners.
          </DialogDescription>
        </DialogHeader>
        {book ? (
          <div className="space-y-4">
            <LabelStylePicker value={style} onChange={setStyle} />
            <div className="flex justify-center rounded-lg bg-muted/40 p-4">
              {svg ? (
                // The label is generated locally from the book's own details.
                <div className="w-full max-w-[360px] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              ) : (
                <p className="py-10 text-sm text-muted-foreground">Drawing label…</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-xs">
              <span className="truncate font-mono">{scanUrlFor(book.barcode)}</span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Copy pay link"
                  onClick={() => void navigator.clipboard.writeText(scanUrlFor(book.barcode)).then(() => adminSuccessToast('Link copied.'))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button asChild type="button" size="icon" variant="ghost" aria-label="Open pay page">
                  <a href={scanUrlFor(book.barcode)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs">
                <span className="text-muted-foreground">Labels to print</span>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={copies}
                  onChange={(event) => setCopies(Math.max(1, Math.min(300, Number(event.target.value) || 1)))}
                  className="h-9 w-24 rounded-md border border-border bg-background px-2 text-sm"
                />
              </label>
              <Button type="button" onClick={() => void printLabelSheet([{ book, copies }], style).catch(() => adminErrorToast('Unable to print labels.'))}>
                <Printer className="h-4 w-4" /> Print sheet
              </Button>
              <Button type="button" variant="outline" onClick={() => void downloadLabelPng(book, style).catch(() => adminErrorToast('Unable to download the label.'))}>
                <Download className="h-4 w-4" /> Download PNG
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Sheets print 3 labels across on A4 (60 × 40 mm each). Stock on hand: {stock ?? 0}.</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
