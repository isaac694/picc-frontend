'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  collectFields,
  DEFAULT_FILE_ACCEPT,
  fieldWidget,
  isDisplayField,
  isFileField,
  optionLabel,
  optionValue,
  type PortalConfig,
  type PortalField,
} from '@/lib/hr-portal';
import FieldError, { examplePlaceholder } from '@/components/form/FieldError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,19}$/;

function defaultFieldPlaceholder(field: PortalField) {
  const widget = fieldWidget(field);
  if (field.placeholder) return examplePlaceholder(field.placeholder);
  if (widget === 'email') return examplePlaceholder('applicant@example.com');
  if (widget === 'tel' || widget === 'phone') return examplePlaceholder('+265 999 000 000');
  if (widget === 'number') return examplePlaceholder('5');
  if (widget === 'textarea') return examplePlaceholder('Tell us why you are a good fit for this role.');
  if (widget === 'date') return undefined;
  return examplePlaceholder('Your answer');
}

export type AnswerMap = Record<string, string | string[]>;
export type FileMap = Record<string, File | undefined>;

type ApplicantPortalFieldsProps = {
  portalConfig?: PortalConfig | null;
  answers: AnswerMap;
  files: FileMap;
  errors?: Record<string, string>;
  onAnswerChange: (key: string, value: string | string[]) => void;
  onFileChange: (key: string, file?: File) => void;
};

function FieldControl({
  field,
  value,
  file,
  invalid,
  onAnswerChange,
  onFileChange,
}: {
  field: PortalField;
  value: string | string[];
  file?: File;
  invalid?: boolean;
  onAnswerChange: (key: string, value: string | string[]) => void;
  onFileChange: (key: string, file?: File) => void;
}) {
  const key = field.key || '';
  const widget = fieldWidget(field);
  const options = field.options || [];
  const accept = (field.accept || DEFAULT_FILE_ACCEPT).join(',');

  if (!key) return null;

  if (widget === 'file' || widget === 'upload' || widget === 'attachment') {
    return (
      <Input
        type="file"
        accept={accept}
        aria-invalid={invalid}
        onChange={(event) => onFileChange(key, event.target.files?.[0])}
      />
    );
  }

  if (widget === 'textarea') {
    return (
      <Textarea
        rows={field.rows || 5}
        placeholder={defaultFieldPlaceholder(field)}
        value={typeof value === 'string' ? value : ''}
        aria-invalid={invalid}
        onChange={(event) => onAnswerChange(key, event.target.value)}
      />
    );
  }

  if (widget === 'select') {
    return (
      <select
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-invalid:border-destructive"
        value={typeof value === 'string' ? value : ''}
        aria-invalid={invalid}
        onChange={(event) => onAnswerChange(key, event.target.value)}
      >
        <option value="">Select...</option>
        {options.map((option) => {
          const itemValue = optionValue(option);
          return <option key={itemValue} value={itemValue}>{optionLabel(option)}</option>;
        })}
      </select>
    );
  }

  if (widget === 'radio') {
    return (
      <div className="space-y-2">
        {options.map((option) => {
          const itemValue = optionValue(option);
          return (
            <label key={itemValue} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={key}
                value={itemValue}
                checked={value === itemValue}
                onChange={() => onAnswerChange(key, itemValue)}
              />
              {optionLabel(option)}
            </label>
          );
        })}
      </div>
    );
  }

  if (widget === 'checkbox' || widget === 'checkbox-group') {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div className="space-y-2">
        {options.map((option) => {
          const itemValue = optionValue(option);
          const checked = selected.includes(itemValue);
          return (
            <label key={itemValue} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked ? selected.filter((item) => item !== itemValue) : [...selected, itemValue];
                  onAnswerChange(key, next);
                }}
              />
              {optionLabel(option)}
            </label>
          );
        })}
      </div>
    );
  }

  const inputType = ['email', 'tel', 'number', 'date', 'phone'].includes(widget)
    ? widget === 'phone' ? 'tel' : widget
    : 'text';

  return (
    <Input
      type={inputType}
      placeholder={defaultFieldPlaceholder(field)}
      value={typeof value === 'string' ? value : ''}
      aria-invalid={invalid}
      onChange={(event) => onAnswerChange(key, event.target.value)}
    />
  );
}

export default function ApplicantPortalFields({
  portalConfig,
  answers,
  files,
  errors = {},
  onAnswerChange,
  onFileChange,
}: ApplicantPortalFieldsProps) {
  const sections = portalConfig?.sections || [];
  const fallback = collectFields(portalConfig);

  if (!sections.length && !fallback.inputs.length && !fallback.files.length) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Cover letter *</Label>
          <Textarea
            rows={5}
            placeholder={examplePlaceholder('I am interested in this role because of my background in communications.')}
            value={typeof answers.coverLetter === 'string' ? answers.coverLetter : ''}
            aria-invalid={Boolean(errors.coverLetter)}
            onChange={(event) => onAnswerChange('coverLetter', event.target.value)}
          />
          <FieldError message={errors.coverLetter} />
        </div>
        <div className="space-y-2">
          <Label>Availability *</Label>
          <Input
            placeholder={examplePlaceholder('Two weeks’ notice')}
            value={typeof answers.availability === 'string' ? answers.availability : ''}
            aria-invalid={Boolean(errors.availability)}
            onChange={(event) => onAnswerChange('availability', event.target.value)}
          />
          <FieldError message={errors.availability} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-1">
      {sections.map((section, index) => {
        const fields = (section.fields || []).filter((field) => field.key && (isFileField(field) || !isDisplayField(field)));
        if (!fields.length) return null;
        return (
          <section key={section.id || index} className="space-y-4">
            {section.title ? <h3 className="font-semibold">{section.title}</h3> : null}
            {section.description ? <p className="text-sm text-muted-foreground">{section.description}</p> : null}
            {fields.map((field) => {
              const key = field.key || '';
              return (
                <div key={key} className="space-y-2">
                  <Label>
                    {field.label || key}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </Label>
                  <FieldControl
                    field={field}
                    value={answers[key] ?? ''}
                    file={files[key]}
                    invalid={Boolean(errors[key])}
                    onAnswerChange={onAnswerChange}
                    onFileChange={onFileChange}
                  />
                  {field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
                  {files[key] ? <p className="text-xs text-muted-foreground">{files[key]?.name}</p> : null}
                  <FieldError message={errors[key]} />
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

export function validatePortalAnswerFields(portalConfig: PortalConfig | null | undefined, answers: AnswerMap, files: FileMap) {
  const { inputs, files: fileFields } = collectFields(portalConfig);
  const errors: Record<string, string> = {};

  if (!inputs.length && !fileFields.length) {
    if (!String(answers.coverLetter || '').trim()) errors.coverLetter = 'Cover letter is required.';
    else if (String(answers.coverLetter).trim().length < 10) errors.coverLetter = 'Enter at least 10 characters.';
    if (!String(answers.availability || '').trim()) errors.availability = 'Availability is required.';
  }

  for (const field of inputs) {
    if (!field.key) continue;
    const widget = fieldWidget(field);
    const value = answers[field.key];
    const empty = Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
    if (field.required && empty) {
      errors[field.key] = `${field.label || field.key} is required.`;
      continue;
    }
    if (empty || Array.isArray(value)) continue;
    const text = String(value).trim();
    if (widget === 'email' && !EMAIL_PATTERN.test(text)) {
      errors[field.key] = 'Enter a valid email address.';
    } else if ((widget === 'tel' || widget === 'phone') && !PHONE_PATTERN.test(text)) {
      errors[field.key] = 'Enter a valid phone number.';
    } else if (widget === 'textarea' && field.required && text.length < 10) {
      errors[field.key] = 'Enter at least 10 characters.';
    } else if (['text', 'number'].includes(widget) && field.required && text.length < 2) {
      errors[field.key] = `${field.label || field.key} is too short.`;
    }
  }

  for (const field of fileFields) {
    if (!field.key) continue;
    const file = files[field.key];
    if (field.required && !file) {
      errors[field.key] = `${field.label || field.key} is required.`;
      continue;
    }
    if (!file) continue;
    const maxBytes = (field.maxSizeMb || 5) * 1024 * 1024;
    if (file.size > maxBytes) errors[field.key] = `${field.label || field.key} must be ${field.maxSizeMb || 5}MB or smaller.`;
    const accept = (field.accept || DEFAULT_FILE_ACCEPT).map((item) => item.toLowerCase());
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    const allowed = accept.some((rule) => name.endsWith(rule.replace('*', '')) || type.includes(rule.replace('.', '')));
    if (accept.length && !allowed) errors[field.key] = `${field.label || field.key} must be one of: ${accept.join(', ')}.`;
  }

  return errors;
}

export function validatePortalAnswers(portalConfig: PortalConfig | null | undefined, answers: AnswerMap, files: FileMap) {
  return Object.values(validatePortalAnswerFields(portalConfig, answers, files));
}
