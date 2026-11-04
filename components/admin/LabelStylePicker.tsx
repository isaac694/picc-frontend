'use client';

import { Barcode, QrCode, ScanLine } from 'lucide-react';
import { LABEL_STYLES, type LabelStyle } from '@/lib/book-labels';
import { cn } from '@/lib/utils';

const ICONS: Record<LabelStyle, typeof Barcode> = { both: ScanLine, barcode: Barcode, qr: QrCode };

/** Choose whether labels carry the QR code, the barcode, or both. */
export default function LabelStylePicker({ value, onChange }: { value: LabelStyle; onChange: (style: LabelStyle) => void }) {
  const current = LABEL_STYLES.find((entry) => entry.value === value);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Print on the label</p>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Print on the label">
        {LABEL_STYLES.map((entry) => {
          const Icon = ICONS[entry.value];
          return (
            <button
              key={entry.value}
              type="button"
              role="radio"
              aria-checked={value === entry.value}
              onClick={() => onChange(entry.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors',
                value === entry.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/70 hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {entry.label}
            </button>
          );
        })}
      </div>
      {current ? <p className="text-[11px] text-muted-foreground">{current.hint}</p> : null}
    </div>
  );
}
