'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { IntakeWindow } from '@/lib/schools/enrollment';

export function useSchoolIntakes(schoolKey: string) {
  const [intakes, setIntakes] = useState<IntakeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/schools/${encodeURIComponent(schoolKey)}/intakes`);
        if (!response.ok) {
          if (cancelled) return;
          setIntakes([]);
          setError(`HTTP ${response.status}`);
          return;
        }

        const data = await response.json().catch(() => ({}));
        const list = Array.isArray(data?.intakes) ? (data.intakes as IntakeWindow[]) : [];
        if (cancelled) return;
        setIntakes(list);
      } catch {
        if (cancelled) return;
        setIntakes([]);
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

  return { intakes, isLoading, error };
}

