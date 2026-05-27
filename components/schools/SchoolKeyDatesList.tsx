'use client';

import { useMemo } from 'react';
import { useSchoolKeyDates } from '@/hooks/use-school-key-dates';

type Props = {
  schoolKey: string;
  fallback?: Array<[label: string, dateText: string]>;
};

export default function SchoolKeyDatesList({ schoolKey, fallback }: Props) {
  const { keyDates, isLoading } = useSchoolKeyDates(schoolKey);

  const displayDates = useMemo(() => {
    const active = keyDates
      .filter((item) => item.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item) => [item.label, item.dateText] as const);

    if (active.length > 0) return active;
    if (Array.isArray(fallback) && fallback.length > 0) return fallback;
    return [];
  }, [keyDates, fallback]);

  if (isLoading && displayDates.length === 0) {
    return (
      <div className="border-t border-slate-100">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between items-center py-4 px-2 border-b border-slate-100 gap-4">
            <span className="h-4 w-32 rounded bg-slate-100" />
            <span className="h-5 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100">
      {displayDates.map(([label, date]) => (
        <div key={label} className="flex justify-between items-center py-4 px-2 border-b border-slate-100 gap-4">
          <span className="text-[#0d1f3c] font-medium text-sm">{label}</span>
          <span className="text-[0.7rem] font-semibold tracking-wide text-[#0d1f3c] bg-[#f5e9c8] border border-[#c9a84c] px-3 py-1 whitespace-nowrap">
            {date}
          </span>
        </div>
      ))}
      {displayDates.length === 0 && (
        <div className="py-4 px-2 text-sm text-slate-500">No key dates posted yet.</div>
      )}
    </div>
  );
}

