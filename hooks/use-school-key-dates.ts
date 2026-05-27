'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { SchoolKeyDate } from '@/lib/schools/key-dates';

export function useSchoolKeyDates(schoolKey: string) {
  const [keyDates, setKeyDates] = useState<SchoolKeyDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/schools/${encodeURIComponent(schoolKey)}/key-dates`);
        if (!response.ok) {
          if (cancelled) return;
          setKeyDates([]);
          setError(`HTTP ${response.status}`);
          return;
        }

        const data = await response.json().catch(() => ({}));
        const list = Array.isArray(data?.keyDates) ? (data.keyDates as SchoolKeyDate[]) : [];
        if (cancelled) return;
        setKeyDates(list.filter((item) => item && item.schoolKey === schoolKey));
      } catch {
        if (cancelled) return;
        setKeyDates([]);
        setError('Failed to fetch');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [schoolKey]);

  return { keyDates, isLoading, error };
}

