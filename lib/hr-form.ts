// Fields on the HR "Create vacancy" form, managed in Settings > Form management > HR form.
// Every field can be renamed, retyped, reordered, hidden or deleted; the form starts with the default
// fields below and "Reset" restores them. A field fills a vacancy property (title, status, ...) when its
// key is that property's and its type suits it; other answers are saved in vacancy.customFields.
// Required documents are not part of this form: they keep their own editor on the vacancy.

import { EMPLOYMENT_TYPES, VACANCY_STATUSES } from '@/lib/hr-vacancy';

export type HrFieldType = 'text' | 'textarea' | 'richtext' | 'number' | 'date' | 'select' | 'checkbox' | 'list' | 'email' | 'url';
export type HrFieldWidth = 'half' | 'full';

/** Vacancy properties a form field can fill. */
export type VacancyColumn =
  | 'title' | 'department' | 'location' | 'employmentType' | 'status' | 'closesAt' | 'summary' | 'description' | 'responsibilities' | 'requirements';

export type HrFormField = {
  id: string;
  key: string;
  label: string;
  type: HrFieldType;
  placeholder: string;
  helpText: string;
  options: string[];
  width: HrFieldWidth;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
};

export const HR_FIELD_TYPE_LABELS: Record<HrFieldType, string> = {
  text: 'Short text',
  textarea: 'Paragraph',
  richtext: 'Formatted text (headings, bold, lists)',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  checkbox: 'Yes / no',
  list: 'List of items',
  email: 'Email',
  url: 'Link',
};

export const HR_VACANCY_FIELDS_ENDPOINT = '/api/admin/forms/hr/vacancy-fields';

// Mirrors COLUMN_TYPES in the backend's routes/hrFormRoutes.js.
const COLUMN_TYPES: Record<VacancyColumn, HrFieldType[]> = {
  title: ['text', 'textarea', 'select'],
  department: ['text', 'textarea', 'select'],
  location: ['text', 'textarea', 'select'],
  employmentType: ['text', 'select'],
  status: ['select'],
  closesAt: ['date'],
  summary: ['text', 'textarea', 'richtext'],
  description: ['text', 'textarea', 'richtext'],
  responsibilities: ['list'],
  requirements: ['list'],
};

/** The vacancy property a field fills, or null when its answer is an extra detail in customFields. */
export function columnFor(field: Pick<HrFormField, 'key' | 'type'>): VacancyColumn | null {
  const types = COLUMN_TYPES[field.key as VacancyColumn];
  return types?.includes(field.type) ? (field.key as VacancyColumn) : null;
}

const defaultField = (field: Partial<HrFormField> & Pick<HrFormField, 'key' | 'label' | 'type'>, sortOrder: number): HrFormField => ({
  id: `default-${field.key}`,
  placeholder: '',
  helpText: '',
  options: [],
  width: 'full',
  isRequired: true,
  isActive: true,
  ...field,
  sortOrder,
});

/** Used when the field list cannot be loaded, so HR can still create vacancies. Mirrors the backend defaults. */
export const DEFAULT_VACANCY_FIELDS: HrFormField[] = [
  defaultField({ key: 'title', label: 'Job title', type: 'text', placeholder: 'e.g. Communications Officer' }, 0),
  defaultField({ key: 'department', label: 'Department', type: 'text', width: 'half', placeholder: 'e.g. Human Resources' }, 1),
  defaultField({ key: 'location', label: 'Location', type: 'text', width: 'half', placeholder: 'e.g. Lilongwe' }, 2),
  defaultField({ key: 'employmentType', label: 'Employment type', type: 'select', width: 'half', options: [...EMPLOYMENT_TYPES] }, 3),
  defaultField({ key: 'status', label: 'Status', type: 'select', width: 'half', options: [...VACANCY_STATUSES] }, 4),
  defaultField({ key: 'closesAt', label: 'Closing date', type: 'date' }, 5),
  defaultField({ key: 'summary', label: 'Short summary', type: 'textarea', placeholder: 'e.g. We are hiring a Communications Officer to support media relations.' }, 6),
  defaultField({ key: 'description', label: 'Full description', type: 'richtext', placeholder: 'e.g. Describe the role, who it reports to, and what success looks like.' }, 7),
  defaultField({ key: 'responsibilities', label: 'Responsibilities', type: 'list', width: 'half', placeholder: 'Prepare reports for leadership', helpText: 'Add each responsibility on its own.' }, 8),
  defaultField({ key: 'requirements', label: 'Requirements', type: 'list', width: 'half', placeholder: 'Degree or diploma in Communications', helpText: 'Add each qualification or requirement on its own.' }, 9),
];

export function parseHrFormFields(value: unknown): HrFormField[] {
  const source = Array.isArray((value as { fields?: unknown[] })?.fields) ? (value as { fields: unknown[] }).fields : [];
  return source
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item): HrFormField => ({
      id: String(item.id || ''),
      key: String(item.key || ''),
      label: String(item.label || ''),
      type: (String(item.type || 'text') as HrFieldType),
      placeholder: String(item.placeholder || ''),
      helpText: String(item.helpText || ''),
      options: Array.isArray(item.options) ? item.options.map(String) : [],
      width: item.width === 'half' ? 'half' : 'full',
      isRequired: Boolean(item.isRequired),
      isActive: item.isActive !== false,
      sortOrder: Number(item.sortOrder) || 0,
    }))
    .filter((field) => field.id && field.key && field.label);
}

export type CustomFieldValue = string | number | boolean | string[];

const textFromHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Whether a value counts as filled in for its field type. */
export function hasValue(type: HrFieldType, value: unknown): boolean {
  if (type === 'checkbox') return value === true;
  if (type === 'list') return Array.isArray(value) && value.some((item) => String(item).trim());
  if (type === 'richtext') return Boolean(textFromHtml(String(value ?? '')));
  return Boolean(String(value ?? '').trim());
}

/**
 * Checks one field's value. Keeps the extra checks the HR form had before it became dynamic
 * (title of 3+ characters, summary and description of 10+), on top of required and type checks.
 */
export function validateFieldValue(field: HrFormField, value: unknown): string | null {
  if (!hasValue(field.type, value)) {
    if (!field.isRequired) return null;
    return field.type === 'list' ? `Add at least one entry for ${field.label}.` : `${field.label} is required.`;
  }
  const text = field.type === 'richtext' ? textFromHtml(String(value ?? '')) : String(value ?? '').trim();
  const column = columnFor(field);
  if (column === 'title' && text.length < 3) return 'Enter at least 3 characters.';
  if ((column === 'summary' || column === 'description') && text.length < 10) return 'Enter at least 10 characters.';
  if (field.type === 'number' && !Number.isFinite(Number(text))) return `${field.label} must be a number.`;
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `${field.label} must be a valid email.`;
  if (field.type === 'url' && !/^https?:\/\/\S+$/i.test(text)) return `${field.label} must be a link starting with http:// or https://.`;
  if (field.type === 'date' && Number.isNaN(new Date(text).getTime())) return `${field.label} must be a valid date.`;
  return null;
}
