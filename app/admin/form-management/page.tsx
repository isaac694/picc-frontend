'use client';

import { useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import HrVacancyFormFields from '@/components/admin/form-management/HrVacancyFormFields';
import { cn } from '@/lib/utils';

// One tab per form that can be set up here. More forms can be added as new tabs.
const TABS = [
  { key: 'hr', label: 'HR form', icon: BriefcaseBusiness },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** Settings > Form management: choose the fields on admin forms. */
export default function FormManagementPage() {
  const [tab, setTab] = useState<TabKey>('hr');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Form management</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create and edit the fields that appear on admin forms.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/70" role="tablist" aria-label="Forms">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium',
                active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'hr' ? <HrVacancyFormFields /> : null}
    </div>
  );
}
