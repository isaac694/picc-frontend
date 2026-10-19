'use client';

import type { EventAnswers, EventFormSchema } from '@/lib/event-forms';

const inputClass = 'rounded-md border border-border px-3 py-2 text-sm';

export default function EventFormFields({
  form,
  values,
  onChange,
}: {
  form: EventFormSchema;
  values: EventAnswers;
  onChange: (key: string, value: EventAnswers[string]) => void;
}) {
  return (
    <div className="grid gap-3 text-sm">
      {form.title ? <p className="font-medium text-foreground">{form.title}</p> : null}
      {form.description ? <p className="text-foreground/70">{form.description}</p> : null}
      {form.fields.map((field) => {
        const value = values[field.key];
        const label = (
          <span className="text-foreground/80">
            {field.label}
            {field.required ? ' *' : ''}
          </span>
        );

        if (field.type === 'textarea') {
          return (
            <label key={field.key} className="grid gap-1">
              {label}
              <textarea
                className={inputClass}
                rows={3}
                placeholder={field.placeholder}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <label key={field.key} className="grid gap-1">
              {label}
              <select
                className={inputClass}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">Select</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.type === 'radio') {
          return (
            <fieldset key={field.key} className="grid gap-2">
              <legend className="text-foreground/80">
                {field.label}
                {field.required ? ' *' : ''}
              </legend>
              {(field.options || []).map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={field.key}
                    checked={value === option.value}
                    onChange={() => onChange(field.key, option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          );
        }

        if (field.type === 'checkbox-group') {
          const selected = Array.isArray(value) ? value : [];
          return (
            <fieldset key={field.key} className="grid gap-2">
              <legend className="text-foreground/80">
                {field.label}
                {field.required ? ' *' : ''}
              </legend>
              {(field.options || []).map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value);
                      onChange(field.key, next);
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          );
        }

        if (field.type === 'checkbox' || field.type === 'boolean') {
          return (
            <label key={field.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(event) => onChange(field.key, event.target.checked)}
              />
              <span className="text-foreground/80">
                {field.label}
                {field.required ? ' *' : ''}
              </span>
            </label>
          );
        }

        const inputType =
          field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date'
            ? field.type
            : 'text';

        return (
          <label key={field.key} className="grid gap-1">
            {label}
            <input
              className={inputClass}
              type={inputType}
              placeholder={field.placeholder}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
            {field.helpText ? <span className="text-xs text-foreground/50">{field.helpText}</span> : null}
          </label>
        );
      })}
    </div>
  );
}
