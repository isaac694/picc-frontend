export type IntakeWindow = {
  id: string;
  label: string;
  closesOn?: string;
  opensOn?: string;
  isActive?: boolean;
};

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Date-only (YYYY-MM-DD) => interpret as local date.
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isIntakeOpen(intake: IntakeWindow, now = new Date()): boolean {
  if (intake.isActive === false) return false;
  const opens = parseDate(intake.opensOn);
  const closes = parseDate(intake.closesOn);

  if (opens && now < opens) return false;
  if (closes && now > endOfLocalDay(closes)) return false;
  return true;
}

export function upcomingIntakes(intakes: IntakeWindow[], now = new Date()): IntakeWindow[] {
  return intakes
    .filter((intake) => {
      const opens = parseDate(intake.opensOn);
      if (!opens) return false;
      return opens > now;
    })
    .sort((a, b) => {
      const ao = parseDate(a.opensOn)?.getTime() ?? 0;
      const bo = parseDate(b.opensOn)?.getTime() ?? 0;
      return ao - bo;
    });
}
