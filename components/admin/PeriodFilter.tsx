'use client';

import { CalendarRange } from 'lucide-react';
import { isoDay, MONTH_NAMES, PERIOD_PRESETS, weekOf, type Period, type PeriodPreset } from '@/lib/admin-reports';
import { cn } from '@/lib/utils';

const fieldClass = 'h-8 rounded-md border border-border bg-background px-2 text-xs';

/** Pill row of periods (all time, this week/month/year) plus pickers for a chosen month, year or dates. */
export default function PeriodFilter({
  value,
  onChange,
  className,
  presets = PERIOD_PRESETS,
}: {
  value: Period;
  onChange: (next: Period) => void;
  className?: string;
  /** Which choices to offer; defaults to the standard set. */
  presets?: Array<{ value: PeriodPreset; label: string }>;
}) {
  const now = new Date();
  const today = isoDay(now);
  const years = Array.from({ length: 8 }, (_, index) => now.getFullYear() - index);
  const choose = (preset: PeriodPreset) => {
    if (preset === 'pick-month') onChange({ preset, year: value.year || now.getFullYear(), month: value.month || now.getMonth() + 1 });
    else if (preset === 'pick-year') onChange({ preset, year: value.year || now.getFullYear() });
    else if (preset === 'pick-day' || preset === 'pick-week') onChange({ ...value, preset, day: value.day || today });
    else onChange({ ...value, preset });
  };
  const week = value.preset === 'pick-week' ? weekOf(value.day) : null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Period">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            role="tab"
            aria-selected={value.preset === preset.value}
            onClick={() => choose(preset.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              value.preset === preset.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground/70 hover:bg-muted',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {value.preset === 'pick-month' || value.preset === 'pick-year' ? (
        <div className="flex gap-1">
          {value.preset === 'pick-month' ? (
            <select aria-label="Month" className={fieldClass} value={value.month} onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}>
              {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
          ) : null}
          <select aria-label="Year" className={fieldClass} value={value.year} onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      ) : null}
      {value.preset === 'pick-day' || value.preset === 'pick-week' ? (
        <div className="flex items-center gap-1 text-xs">
          <input
            aria-label={value.preset === 'pick-day' ? 'Day' : 'Any day in the week'}
            type="date"
            max={today}
            className={fieldClass}
            value={value.day || today}
            onChange={(event) => event.target.value && onChange({ ...value, day: event.target.value })}
          />
          {week ? <span className="text-muted-foreground">Mon {week.from.slice(8)}/{week.from.slice(5, 7)} to Sun {week.to.slice(8)}/{week.to.slice(5, 7)}</span> : null}
        </div>
      ) : null}
      {value.preset === 'custom' ? (
        <div className="flex items-center gap-1 text-xs">
          <input aria-label="From" type="date" max={value.to || undefined} className={fieldClass} value={value.from || ''} onChange={(event) => onChange({ ...value, from: event.target.value })} />
          <span className="text-muted-foreground">to</span>
          <input aria-label="To" type="date" min={value.from || undefined} className={fieldClass} value={value.to || ''} onChange={(event) => onChange({ ...value, to: event.target.value })} />
        </div>
      ) : null}
    </div>
  );
}
