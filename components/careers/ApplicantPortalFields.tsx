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

export type AnswerMap = Record<string, string | string[]>;
export type FileMap = Record<string, File | undefined>;

type ApplicantPortalFieldsProps = {
  portalConfig?: PortalConfig | null;
  answers: AnswerMap;
  files: FileMap;
  onAnswerChange: (key: string, value: string | string[]) => void;
  onFileChange: (key: string, file?: File) => void;
};

function FieldControl({
  field,
  value,
  file,
  onAnswerChange,
  onFileChange,
}: {
  field: PortalField;
  value: string | string[];
  file?: File;
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
        onChange={(event) => onFileChange(key, event.target.files?.[0])}
      />
    );
  }

  if (widget === 'textarea') {
    return (
      <Textarea
        rows={field.rows || 5}
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onAnswerChange(key, event.target.value)}
      />
    );
  }

  if (widget === 'select') {
    return (
      <select
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        value={typeof value === 'string' ? value : ''}
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
      placeholder={field.placeholder}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onAnswerChange(key, event.target.value)}
    />
  );
}

export default function ApplicantPortalFields({
  portalConfig,
  answers,
  files,
  onAnswerChange,
  onFileChange,
}: ApplicantPortalFieldsProps) {
  const sections = portalConfig?.sections || [];
  const fallback = collectFields(portalConfig);

  if (!sections.length && !fallback.inputs.length && !fallback.files.length) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Cover letter</Label>
          <Textarea rows={5} value={typeof answers.coverLetter === 'string' ? answers.coverLetter : ''} onChange={(event) => onAnswerChange('coverLetter', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Availability</Label>
          <Input value={typeof answers.availability === 'string' ? answers.availability : ''} onChange={(event) => onAnswerChange('availability', event.target.value)} />
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
                    onAnswerChange={onAnswerChange}
                    onFileChange={onFileChange}
                  />
                  {field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
                  {files[key] ? <p className="text-xs text-muted-foreground">{files[key]?.name}</p> : null}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

export function validatePortalAnswers(portalConfig: PortalConfig | null | undefined, answers: AnswerMap, files: FileMap) {
  const { inputs, files: fileFields } = collectFields(portalConfig);
  const errors: string[] = [];

  for (const field of inputs) {
    if (!field.required || !field.key) continue;
    const value = answers[field.key];
    const empty = Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
    if (empty) errors.push(`${field.label || field.key} is required.`);
  }

  for (const field of fileFields) {
    if (!field.required || !field.key) continue;
    const file = files[field.key];
    if (!file) {
      errors.push(`${field.label || field.key} is required.`);
      continue;
    }
    const maxBytes = (field.maxSizeMb || 5) * 1024 * 1024;
    if (file.size > maxBytes) errors.push(`${field.label || field.key} must be ${field.maxSizeMb || 5}MB or smaller.`);
    const accept = (field.accept || DEFAULT_FILE_ACCEPT).map((item) => item.toLowerCase());
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    const allowed = accept.some((rule) => name.endsWith(rule.replace('*', '')) || type.includes(rule.replace('.', '')));
    if (accept.length && !allowed) errors.push(`${field.label || field.key} must be one of: ${accept.join(', ')}.`);
  }

  return errors;
}
