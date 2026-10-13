export const HR_APPLICATION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'REJECTED',
  'HIRED',
  'WITHDRAWN',
] as const;

export type HrApplicationStatus = (typeof HR_APPLICATION_STATUSES)[number];

export function validateShortlistReview(
  status: HrApplicationStatus,
  interviewDate: string,
  interviewTime: string,
): string | null {
  if (status !== 'SHORTLISTED') return null;
  if (!interviewDate.trim()) return 'Interview date is required when shortlisting.';
  if (!interviewTime.trim()) return 'Interview time is required when shortlisting.';
  return null;
}

export function buildBulkStatusPayload(input: {
  applicationIds: string[];
  status: HrApplicationStatus;
  reviewNotes?: string;
  interviewDate?: string;
  interviewTime?: string;
}) {
  const body: Record<string, unknown> = {
    applicationIds: input.applicationIds,
    status: input.status,
    reviewNotes: input.reviewNotes?.trim() || undefined,
  };
  if (input.status === 'SHORTLISTED') {
    body.interviewDate = input.interviewDate?.trim();
    body.interviewTime = formatInterviewTimeForApi(input.interviewTime);
  }
  return body;
}

export function buildSingleStatusPayload(input: {
  status: HrApplicationStatus;
  reviewNotes?: string;
  interviewDate?: string;
  interviewTime?: string;
}) {
  const body: Record<string, unknown> = {
    status: input.status,
    reviewNotes: input.reviewNotes?.trim() || undefined,
  };
  if (input.status === 'SHORTLISTED') {
    body.interviewDate = input.interviewDate?.trim();
    body.interviewTime = formatInterviewTimeForApi(input.interviewTime);
  }
  return body;
}

export const toTimeInputValue = (value?: string | null) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '';
  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

export function formatInterviewTimeForApi(value?: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/\s(AM|PM)$/i.test(raw)) return raw;
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) return raw;
  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${meridiem}`;
}

export const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
