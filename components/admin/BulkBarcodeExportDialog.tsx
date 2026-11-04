'use client';

import { useMemo, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminErrorToast } from '@/components/admin/admin-toast';
import LabelStylePicker from '@/components/admin/LabelStylePicker';
import { printLabelSheet, type LabelBook, type LabelStyle } from '@/lib/book-labels';
import { cn } from '@/lib/utils';

export type ExportableBook = LabelBook & { id: string; stock: number };

type CopiesMode = 'one' | 'stock' | 'fixed';

/** Prints labels for many books at once, as A4 sheets (the print window can also save them as a PDF). */
export default function BulkBarcodeExportDialog({
  open,
  onOpenChange,
  books,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: ExportableBook[];
}) {
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [mode, setMode] = useState<CopiesMode>('one');
  const [fixed, setFixed] = useState(5);
  const [style, setStyle] = useState<LabelStyle>('both');
  const [printing, setPrinting] = useState(false);

  // Every book starts ticked; `selected` only exists once the admin changes a tick.
  const chosen = useMemo(() => selected ?? new Set(books.map((book) => book.id)), [selected, books]);
  const copiesFor = (book: ExportableBook) => (mode === 'one' ? 1 : mode === 'stock' ? Math.max(0, book.stock) : fixed);
  const entries = books.filter((book) => chosen.has(book.id)).map((book) => ({ book, copies: copiesFor(book) })).filter((entry) => entry.copies > 0);
  const labelCount = entries.reduce((sum, entry) => sum + entry.copies, 0);
  // 3 across and 6 down fit on A4 at 60 x 40 mm.
  const sheets = Math.ceil(labelCount / 18);

  const toggle = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const print = async () => {
    if (entries.length === 0) {
      adminErrorToast('Choose at least one book with labels to print.');
      return;
    }
    setPrinting(true);
    try {
      await printLabelSheet(entries.map((entry) => ({ book: entry.book, copies: entry.copies })), style);
    } catch {
      adminErrorToast('Unable to prepare the labels.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export book barcodes</DialogTitle>
          <DialogDescription>
            Print labels for all your books at once. To get a PDF instead, choose &ldquo;Save as PDF&rdquo; in the print window.
          </DialogDescription>
        </DialogHeader>

        <LabelStylePicker value={style} onChange={setStyle} />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Labels per book</p>
          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Labels per book">
            {([
              ['one', 'One each'],
              ['stock', 'One per copy in stock'],
              ['fixed', 'Same number each'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn('rounded-full border px-3 py-1 text-xs font-medium', mode === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:bg-muted')}
              >
                {label}
              </button>
            ))}
            {mode === 'fixed' ? (
              <input
                type="number"
                min={1}
                max={300}
                value={fixed}
                onChange={(event) => setFixed(Math.max(1, Math.min(300, Number(event.target.value) || 1)))}
                aria-label="Labels for each book"
                className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm"
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{chosen.size} of {books.length} books chosen</span>
          <div className="flex gap-3">
            <button type="button" className="font-semibold text-primary" onClick={() => setSelected(new Set(books.map((book) => book.id)))}>Select all</button>
            <button type="button" className="font-semibold text-primary" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>

        <ul className="max-h-[45vh] divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60">
          {books.map((book) => (
            <li key={book.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                <input type="checkbox" checked={chosen.has(book.id)} onChange={() => toggle(book.id)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{book.title}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">{book.barcode} · {book.stock} in stock</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{chosen.has(book.id) ? `${copiesFor(book)} label${copiesFor(book) === 1 ? '' : 's'}` : ''}</span>
              </label>
            </li>
          ))}
          {books.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No books have barcodes yet. Save a book to give it one.</li> : null}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            {labelCount} label{labelCount === 1 ? '' : 's'} · about {sheets} A4 sheet{sheets === 1 ? '' : 's'} (18 per sheet)
          </p>
          <Button type="button" onClick={() => void print()} disabled={printing || labelCount === 0}>
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
