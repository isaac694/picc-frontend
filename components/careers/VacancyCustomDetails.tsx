import { Info } from 'lucide-react';
import type { VacancyCustomDetail } from '@/app/careers/vacancies';

// Answers to the custom fields HR add in Form management > HR form, as shown on the careers pages.
// Short answers sit beside Department, Location and the rest; longer ones get their own section.

const LONG_TYPES = new Set(['textarea', 'richtext', 'list']);

export const isLongDetail = (detail: VacancyCustomDetail) => LONG_TYPES.has(detail.type) || Array.isArray(detail.value);
export const shortDetails = (details: VacancyCustomDetail[]) => details.filter((detail) => !isLongDetail(detail));
export const longDetails = (details: VacancyCustomDetail[]) => details.filter(isLongDetail);

/** Staff write this HTML in the vacancy editor; scripts and inline handlers are still removed before showing it. */
function cleanHtml(html: string) {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

/** A short answer as plain text: dates formatted, yes/no spelled out. */
export function detailText(detail: VacancyCustomDetail): string {
  const { type, value } = detail;
  if (type === 'checkbox') return value === true ? 'Yes' : 'No';
  if (type === 'date') {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }
  if (type === 'number' && typeof value === 'number') return new Intl.NumberFormat('en').format(value);
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function DetailValue({ detail }: { detail: VacancyCustomDetail }) {
  const text = detailText(detail);
  if (detail.type === 'url' && /^https?:\/\//i.test(text)) {
    return <a href={text} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-2">{text}</a>;
  }
  if (detail.type === 'email') {
    return <a href={`mailto:${text}`} className="break-all text-primary underline underline-offset-2">{text}</a>;
  }
  return <>{text}</>;
}

/** Cards in the same style as Department / Location on the vacancy pages. */
export function VacancyCustomDetailCards({ details }: { details: VacancyCustomDetail[] }) {
  return (
    <>
      {shortDetails(details).map((detail) => (
        <div key={detail.key} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{detail.label}</p>
            <p className="text-sm text-slate-600"><DetailValue detail={detail} /></p>
          </div>
        </div>
      ))}
    </>
  );
}

/** Paragraphs, formatted text and lists, each under its own heading. */
export function VacancyCustomDetailSections({ details }: { details: VacancyCustomDetail[] }) {
  const sections = longDetails(details);
  if (!sections.length) return null;
  return (
    <div className="space-y-8">
      {sections.map((detail) => (
        <section key={detail.key}>
          <h2 className="text-2xl font-bold text-primary">{detail.label}</h2>
          {Array.isArray(detail.value) ? (
            <ul className="mt-4 space-y-3 text-slate-600">
              {detail.value.map((item, index) => (
                <li key={`${detail.key}-${index}`} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : detail.type === 'richtext' ? (
            <div className="prose prose-slate mt-4 max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: cleanHtml(String(detail.value)) }} />
          ) : (
            <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">{String(detail.value)}</p>
          )}
        </section>
      ))}
    </div>
  );
}
