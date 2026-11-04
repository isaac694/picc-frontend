import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';

/** Period choices shared by the admin dashboards (forms, school registrations, membership, sales). */
export type PeriodPreset = 'all' | 'week' | 'month' | 'year' | 'pick-month' | 'pick-year' | 'custom';

export type Period = {
  preset: PeriodPreset;
  year?: number;
  month?: number;
  from?: string;
  to?: string;
};

export const PERIOD_PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'pick-month', label: 'Choose month' },
  { value: 'pick-year', label: 'Choose year' },
  { value: 'custom', label: 'Custom dates' },
];

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Query string parameters the backend's period filter understands. */
export function periodParams(period: Period): Record<string, string> {
  const now = new Date();
  switch (period.preset) {
    case 'week': {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: isoDay(monday), to: isoDay(now) };
    }
    case 'month':
      return { year: String(now.getFullYear()), month: String(now.getMonth() + 1) };
    case 'year':
      return { year: String(now.getFullYear()) };
    case 'pick-month':
      return { year: String(period.year || now.getFullYear()), month: String(period.month || now.getMonth() + 1) };
    case 'pick-year':
      return { year: String(period.year || now.getFullYear()) };
    case 'custom': {
      const params: Record<string, string> = {};
      if (period.from) params.from = period.from;
      if (period.to) params.to = period.to;
      return params;
    }
    default:
      return {};
  }
}

export function withParams(path: string, params: Record<string, string | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

export function periodLabel(period: Period) {
  const now = new Date();
  switch (period.preset) {
    case 'week':
      return 'This week';
    case 'month':
      return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    case 'year':
      return String(now.getFullYear());
    case 'pick-month':
      return `${MONTH_NAMES[(period.month || now.getMonth() + 1) - 1]} ${period.year || now.getFullYear()}`;
    case 'pick-year':
      return String(period.year || now.getFullYear());
    case 'custom':
      if (period.from && period.to) return `${period.from} to ${period.to}`;
      if (period.from) return `From ${period.from}`;
      if (period.to) return `Up to ${period.to}`;
      return 'All time';
    default:
      return 'All time';
  }
}

export function periodSlug(period: Period) {
  return periodLabel(period).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function formatReportDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** PDF or Excel download of a table, with summary lines placed under the title. */
export async function downloadReport(input: {
  format: 'pdf' | 'excel';
  title: string;
  fileName: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string>>;
  summary?: Array<[string, string | number]>;
}) {
  const summaryRows = (input.summary || []).map(([label, value]) => {
    const row: Record<string, string> = Object.fromEntries(input.columns.map((column) => [column.key, '']));
    row[input.columns[0].key] = label;
    row[input.columns[Math.min(1, input.columns.length - 1)].key] = String(value);
    return row;
  });
  const blank = Object.fromEntries(input.columns.map((column) => [column.key, '']));
  const rows = summaryRows.length ? [...input.rows, blank, ...summaryRows] : input.rows;
  if (input.format === 'excel') {
    downloadRegistrationsExcel({ fileName: `${input.fileName}.xls`, sheetName: input.title.slice(0, 30), columns: input.columns, rows });
    return;
  }
  await downloadRegistrationsPdf({ title: input.title, fileName: `${input.fileName}.pdf`, columns: input.columns, rows });
}
