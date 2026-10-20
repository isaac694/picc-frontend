export type PaginatedQuery = {
  skip?: number;
  take?: number;
  status?: string;
  paymentMethod?: string;
  paychanguAccount?: string;
  format?: string;
  email?: string;
  search?: string;
};

export function buildAdminQuery(params: PaginatedQuery): string {
  const search = new URLSearchParams();
  if (params.skip != null) search.set('skip', String(params.skip));
  if (params.take != null) search.set('take', String(params.take));
  if (params.status) search.set('status', params.status);
  if (params.paymentMethod) search.set('paymentMethod', params.paymentMethod);
  if (params.paychanguAccount) search.set('paychanguAccount', params.paychanguAccount);
  if (params.format) search.set('format', params.format);
  if (params.email) search.set('email', params.email);
  if (params.search) search.set('search', params.search);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function formatMoney(amount: unknown, currency?: string): string {
  const value = Number(amount || 0);
  const code = currency || 'MWK';
  try {
    return new Intl.NumberFormat('en-MW', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${code} ${value.toLocaleString()}`;
  }
}

export function paymentStatusBadgeClass(status?: string | null) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'pending') return 'border-orange-200 bg-orange-100 text-orange-800';
  if (value === 'completed' || value === 'complete' || value === 'paid' || value === 'available') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  }
  if (value) return 'border-red-200 bg-red-100 text-red-800';
  return '';
}

export function formatAdminDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}
