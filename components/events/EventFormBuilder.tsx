'use client';

import { Button } from '@/components/ui/button';
import {
  EVENT_FORM_FIELD_TYPES,
  type EventFormDraft,
  type EventFormFieldType,
  createFormFieldId,
} from '@/lib/event-forms';

const inputClass = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground';

export default function EventFormBuilder({
  heading,
  draft,
  onChange,
}: {
  heading: string;
  draft: EventFormDraft;
  onChange: (draft: EventFormDraft) => void;
}) {
  const updateField = (clientId: string, patch: Partial<EventFormDraft['fields'][number]>) => {
    onChange({
      ...draft,
      fields: draft.fields.map((field) => (field.clientId === clientId ? { ...field, ...patch } : field)),
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{heading}</p>
        <p className="mt-1 text-xs text-foreground/60">
          Add the questions visitors should answer. Leave this empty to use the standard form.
        </p>
      </div>
      <input
        type="text"
        placeholder="Form title (optional)"
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
        className={inputClass}
      />
      {draft.fields.map((field, index) => {
        const needsOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox-group';
        return (
          <div key={field.clientId} className="space-y-3 rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                {field.label || `Field ${index + 1}`}
                {field.required ? ' *' : ''}
              </p>
              {field.locked ? (
                <span className="text-xs text-foreground/50">Required on every registration</span>
              ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...draft, fields: draft.fields.filter((item) => item.clientId !== field.clientId) })}
              >
                Remove
              </Button>
              )}
            </div>
            <input
              type="text"
              placeholder="Question label"
              value={field.label}
              readOnly={field.locked}
              onChange={(event) => updateField(field.clientId, { label: event.target.value })}
              className={inputClass}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={field.type}
                disabled={field.locked}
                onChange={(event) => updateField(field.clientId, { type: event.target.value as EventFormFieldType })}
                className={inputClass}
                aria-label={`Field ${index + 1} type`}
              >
                {EVENT_FORM_FIELD_TYPES.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={field.required}
                  disabled={field.locked}
                  onChange={(event) => updateField(field.clientId, { required: event.target.checked })}
                  className="h-4 w-4"
                />
                Required
              </label>
            </div>
            {needsOptions ? (
              <input
                type="text"
                placeholder="Options, separated by commas"
                value={field.optionsText}
                onChange={(event) => updateField(field.clientId, { optionsText: event.target.value })}
                className={inputClass}
              />
            ) : field.type === 'checkbox' || field.type === 'boolean' ? null : (
              <input
                type="text"
                placeholder="Placeholder (optional)"
                value={field.placeholder}
                onChange={(event) => updateField(field.clientId, { placeholder: event.target.value })}
                className={inputClass}
              />
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...draft,
            fields: [
              ...draft.fields,
              {
                clientId: createFormFieldId(),
                label: '',
                type: 'text',
                required: false,
                placeholder: '',
                optionsText: '',
              },
            ],
          })
        }
      >
        Add field
      </Button>
    </div>
  );
}
