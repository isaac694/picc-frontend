export type MembershipFieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox';

export type MembershipField = {
  id: string;
  key: string;
  label: string;
  type: MembershipFieldType;
  options: string[];
  isRequired: boolean;
  showInTable: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type Member = {
  id: string;
  data: Record<string, string | number | boolean>;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  transferred: 'Transferred',
  deceased: 'Deceased',
};

export const FIELD_TYPE_LABELS: Record<MembershipFieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  number: 'Number',
  email: 'Email',
  phone: 'Phone number',
  date: 'Date',
  select: 'Dropdown (choose one)',
  checkbox: 'Yes / No',
};

export function memberName(member: Member, fields: MembershipField[]) {
  const nameField = fields.find((field) => field.key === 'full_name') || fields.find((field) => field.type === 'text');
  const value = nameField ? member.data[nameField.key] : '';
  return String(value || 'Unnamed member');
}

export function formatMemberValue(field: MembershipField, value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  if (field.type === 'checkbox') return value === true ? 'Yes' : 'No';
  if (field.type === 'date') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return String(value);
}

/** Reads a CSV export (or any spreadsheet saved as CSV) into rows keyed by column heading. */
export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((values) => Object.fromEntries(header.map((name, index) => [name.trim(), (values[index] || '').trim()])));
}
