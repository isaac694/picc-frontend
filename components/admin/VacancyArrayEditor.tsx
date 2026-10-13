'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';

type VacancyArrayEditorProps = {
  label: string;
  description?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
};

export default function VacancyArrayEditor({
  label,
  description,
  value,
  onChange,
  placeholder,
  error,
}: VacancyArrayEditorProps) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const next = draft.trim();
    if (!next) return;
    const exists = value.some((item) => item.toLowerCase() === next.toLowerCase());
    if (!exists) onChange([...value, next]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder ? examplePlaceholder(placeholder) : undefined}
          aria-invalid={Boolean(error)}
        />
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {value.length ? (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
            >
              <p className="text-sm">{item}</p>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${item}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No items added yet.
        </p>
      )}
      <FieldError message={error} />
    </div>
  );
}
