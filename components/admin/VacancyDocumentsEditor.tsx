'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DOCUMENT_ACCEPT_OPTIONS,
  emptyRequiredDocument,
  type VacancyRequiredDocument,
} from '@/lib/hr-vacancy';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';

type VacancyDocumentsEditorProps = {
  value: VacancyRequiredDocument[];
  onChange: (next: VacancyRequiredDocument[]) => void;
  errors?: Record<string, string>;
};

export default function VacancyDocumentsEditor({ value, onChange, errors = {} }: VacancyDocumentsEditorProps) {
  const updateDocument = (id: string, patch: Partial<VacancyRequiredDocument>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const toggleAccept = (document: VacancyRequiredDocument, option: string) => {
    const exists = document.accept.includes(option);
    updateDocument(document.id, {
      accept: exists ? document.accept.filter((item) => item !== option) : [...document.accept, option],
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Required documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the files applicants should upload. Use the plus button for multiple documents.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyRequiredDocument()])}
        >
          <Plus className="h-4 w-4" />
          Add document
        </Button>
      </div>

      {value.length ? (
        <div className="space-y-3">
          {value.map((document, index) => (
            <div key={document.id} className="space-y-4 rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Document {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(value.filter((item) => item.id !== document.id))}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label>Label *</Label>
                  <Input
                    value={document.label}
                    aria-invalid={Boolean(errors[`doc.${document.id}.label`])}
                    onChange={(event) => updateDocument(document.id, { label: event.target.value })}
                    placeholder={examplePlaceholder('CV')}
                  />
                  <FieldError message={errors[`doc.${document.id}.label`]} />
                </div>
                <div className="space-y-2">
                  <Label>Max size (MB) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={document.maxSizeMb}
                    aria-invalid={Boolean(errors[`doc.${document.id}.maxSizeMb`])}
                    onChange={(event) => updateDocument(document.id, { maxSizeMb: Number(event.target.value) || 1 })}
                  />
                  <FieldError message={errors[`doc.${document.id}.maxSizeMb`]} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={document.required}
                  onCheckedChange={(checked) => updateDocument(document.id, { required: Boolean(checked) })}
                />
                Required for applicants
              </label>

              <div className="space-y-2">
                <Label>Accepted file types *</Label>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_ACCEPT_OPTIONS.map((option) => {
                    const selected = document.accept.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleAccept(document, option)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors[`doc.${document.id}.accept`]} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange([emptyRequiredDocument()])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add a required document
        </button>
      )}
      <FieldError message={errors.requiredDocuments} />
    </section>
  );
}
