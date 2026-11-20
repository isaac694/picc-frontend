import { downloadRegistrationsExcel, downloadRegistrationsPdf, type ExportColumn } from '@/lib/event-registration-export';

/** Period choices shared by the admin dashboards (forms, school registrations, membership, sales). */
export type PeriodPreset = 'all' | 'today' | 'pick-day' | 'week' | 'pick-week' | 'month' | 'year' | 'pick-month' | 'pick-year' | 'custom';

export type Period = {
  preset: PeriodPreset;
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  /** YYYY-MM-DD: the day for 'pick-day', or any day in the week for 'pick-week'. */
  day?: string;
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

/** Finer choices for reports looked at day by day, such as the best sellers on the store dashboard. */
export const DETAILED_PERIOD_PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'pick-day', label: 'Choose day' },
  { value: 'week', label: 'This week' },
  { value: 'pick-week', label: 'Choose week' },
  { value: 'month', label: 'This month' },
  { value: 'pick-month', label: 'Choose month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all', label: 'All time' },
];

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDay = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date();
};

/** Monday to Sunday of the week holding `day`. */
export function weekOf(day?: string) {
  const monday = parseDay(day);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: isoDay(monday), to: isoDay(sunday) };
}

const longDay = (value: string) => parseDay(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Query string parameters the backend's period filter understands. */
export function periodParams(period: Period): Record<string, string> {
  const now = new Date();
  switch (period.preset) {
    case 'today':
      return { from: isoDay(now), to: isoDay(now) };
    case 'pick-day': {
      const day = isoDay(parseDay(period.day));
      return { from: day, to: day };
    }
    case 'week': {
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: isoDay(monday), to: isoDay(now) };
    }
    case 'pick-week':
      return weekOf(period.day);
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
    case 'today':
      return `Today, ${longDay(isoDay(now))}`;
    case 'pick-day':
      return longDay(isoDay(parseDay(period.day)));
    case 'week': {
      const { from } = weekOf(isoDay(now));
      return `This week, ${longDay(from)} to ${longDay(isoDay(now))}`;
    }
    case 'pick-week': {
      const { from, to } = weekOf(period.day);
      return `Week of ${longDay(from)} to ${longDay(to)}`;
    }
    case 'month':
      return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    case 'year':
      return String(now.getFullYear());
    case 'pick-month':
      return `${MONTH_NAMES[(period.month || now.getMonth() + 1) - 1]} ${period.year || now.getFullYear()}`;
    case 'pick-year':
      return String(period.year || now.getFullYear());
    case 'custom':
      if (period.from && period.to) return `${longDay(period.from)} to ${longDay(period.to)}`;
      if (period.from) return `From ${longDay(period.from)}`;
      if (period.to) return `Up to ${longDay(period.to)}`;
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
