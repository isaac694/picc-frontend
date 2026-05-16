'use client';

import { useMemo, useState } from 'react';
import { isIntakeOpen, upcomingIntakes } from '@/lib/schools/enrollment';
import { useSchoolIntakes } from '@/hooks/use-school-intakes';

type Props = {
  schoolKey: string;
  inputClass: string;
  selectLabel: string;
  selectName?: string;
  submitLabel: string;
  closedLabel?: string;
};

export default function SchoolIntakeGate({
  schoolKey,
  inputClass,
  selectLabel,
  selectName = 'intakeId',
  submitLabel,
  closedLabel = 'Applications Closed',
}: Props) {
  const { intakes, isLoading, error } = useSchoolIntakes(schoolKey);
  const [selectedId, setSelectedId] = useState('');

  const openIntakes = useMemo(() => intakes.filter((intake) => isIntakeOpen(intake)), [intakes]);
  const nextIntakes = useMemo(() => upcomingIntakes(intakes), [intakes]);

  const hasAnyIntakes = intakes.length > 0;
  const hasOpenIntakes = openIntakes.length > 0;
  const disabled = isLoading || Boolean(error) || !hasAnyIntakes || !hasOpenIntakes;

  return (
    <>
      <div className="mb-6">
        <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-slate-100 pb-2 mb-4">
          Intake / Term
        </p>

        {disabled ? (
          <div className="rounded-xl border border-slate-200 bg-stone-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-red-600">
              {isLoading
                ? 'Checking application windows...'
                : error
                  ? 'Unable to load enrollment dates.'
                  : 'Applications are currently closed.'}
            </p>
            {!isLoading && !error && nextIntakes.length > 0 && (
              <div className="mt-2">
                <p className="text-slate-600 text-xs uppercase tracking-[0.12em] font-semibold">Upcoming openings</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {nextIntakes.slice(0, 4).map((item) => (
                    <li key={item.id} className="text-[#0d1f3c]">
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!isLoading && !error && nextIntakes.length === 0 && (
              <p className="mt-2 text-red-600">Please check back later for the next intake.</p>
            )}
          </div>
        ) : (
          <>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">{selectLabel} *</label>
            <select
              name={selectName}
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Select</option>
              {openIntakes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="hidden"
              name={`${selectName}Label`}
              value={openIntakes.find((item) => item.id === selectedId)?.label || ''}
            />
          </>
        )}
      </div>

      <button
        disabled={disabled}
        className="w-full mt-8 bg-[#0d1f3c] hover:bg-[#1a3360] disabled:opacity-60 disabled:hover:bg-[#0d1f3c] text-white text-xs font-bold tracking-[0.2em] uppercase py-4 transition-colors duration-200 border-b-2 border-[#c9a84c]"
      >
        {isLoading ? 'Loading…' : disabled ? closedLabel : submitLabel}
      </button>
    </>
  );
}
