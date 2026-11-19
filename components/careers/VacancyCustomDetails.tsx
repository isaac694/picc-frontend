import { Briefcase, CalendarDays, Clock, Info, MapPin, type LucideIcon } from 'lucide-react';
import type { Vacancy, VacancyCustomDetail } from '@/app/careers/vacancies';
import { cleanHtml, hasPortalDisplayContent, VacancyPortalDisplay } from '@/components/careers/VacancyPortalView';

// The fields HR fill in on the vacancy form (Form management > HR form), as shown on the careers pages.
// Short answers sit beside each other as cards; longer ones get their own section under the field's label.

const LONG_TYPES = new Set(['textarea', 'richtext', 'list']);
const HTML_PATTERN = /<\/?[a-z][^>]*>/i;

export const isLongDetail = (detail: VacancyCustomDetail) => LONG_TYPES.has(detail.type) || Array.isArray(detail.value);
export const shortDetails = (details: VacancyCustomDetail[]) => details.filter((detail) => !isLongDetail(detail));
export const longDetails = (details: VacancyCustomDetail[]) => details.filter(isLongDetail);

const CARD_ICONS: Record<string, LucideIcon> = {
  department: Briefcase,
  location: MapPin,
  employmentType: Clock,
  closesAt: CalendarDays,
};

// Vacancy properties whose text the portal builder's display content replaces when HR filled it in.
const PORTAL_REPLACED_COLUMNS = new Set(['description', 'requirements', 'responsibilities']);

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** A short answer as plain text: dates formatted, yes/no spelled out. */
export function detailText(detail: VacancyCustomDetail): string {
  const { type, value } = detail;
  if (type === 'checkbox') return value === true ? 'Yes' : 'No';
  if (type === 'date') {
    const date = new Date(String(value));
    // UTC: closing dates are saved as the end of the chosen day in UTC.
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  if (type === 'number' && typeof value === 'number') return new Intl.NumberFormat('en').format(value);
  if (Array.isArray(value)) return value.join(', ');
  const text = String(value);
  return HTML_PATTERN.test(text) ? stripHtml(text) : text;
}

/**
 * Everything to show about a vacancy, in order. The summary is the lead text above these details, and
 * the title is the heading, so neither is repeated. With an older backend that does not send the HR
 * form's labels, the built-in fields use fixed headings.
 */
export function vacancyDetailList(vacancy: Vacancy): VacancyCustomDetail[] {
  const hidePortalReplaced = hasPortalDisplayContent(vacancy.portalConfig);
  const details = vacancy.formDetails
    ? vacancy.formDetails.filter((detail) => detail.column !== 'summary')
    : fallbackDetails(vacancy);
  return details.filter((detail) => !(hidePortalReplaced && detail.column && PORTAL_REPLACED_COLUMNS.has(detail.column) && isLongDetail(detail)));
}

function fallbackDetails(vacancy: Vacancy): VacancyCustomDetail[] {
  const details: VacancyCustomDetail[] = [
    { key: 'department', column: 'department', label: 'Department', type: 'text', value: vacancy.department },
    { key: 'location', column: 'location', label: 'Location', type: 'text', value: vacancy.location },
    { key: 'employmentType', column: 'employmentType', label: 'Employment Type', type: 'text', value: vacancy.type },
    { key: 'closesAt', column: 'closesAt', label: 'Closing Date', type: 'text', value: vacancy.closingDate },
  ];
  if (vacancy.description) {
    details.push({ key: 'description', column: 'description', label: 'Job details', type: 'richtext', value: vacancy.description });
  }
  if (vacancy.responsibilities.length) {
    details.push({ key: 'responsibilities', column: 'responsibilities', label: 'Key Responsibilities', type: 'list', value: vacancy.responsibilities });
  }
  if (vacancy.requirements.length) {
    details.push({ key: 'requirements', column: 'requirements', label: 'Minimum Requirements', type: 'list', value: vacancy.requirements });
  }
  return [...details, ...vacancy.customDetails];
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

/** Cards for short answers (Department, Location, ...), each with its label. */
export function VacancyCustomDetailCards({ details }: { details: VacancyCustomDetail[] }) {
  return (
    <>
      {shortDetails(details).map((detail) => {
        const Icon = (detail.column && CARD_ICONS[detail.column]) || Info;
        return (
          <div key={detail.key} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">{detail.label}</p>
              <p className="text-sm text-slate-600"><DetailValue detail={detail} /></p>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** One paragraph, formatted text or list under its own heading. */
function DetailSection({ detail }: { detail: VacancyCustomDetail }) {
  const text = Array.isArray(detail.value) ? '' : String(detail.value);
  return (
    <div>
      <h2 className="text-2xl font-bold text-primary">{detail.label}</h2>
      {Array.isArray(detail.value) ? (
        <ul className="mt-4 space-y-3 text-slate-600">
          {detail.value.filter((item) => String(item).trim()).map((item, index) => (
            <li key={`${detail.key}-${index}`} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : detail.type === 'richtext' || HTML_PATTERN.test(text) ? (
        <div className="vacancy-rich mt-4 text-slate-600" dangerouslySetInnerHTML={{ __html: cleanHtml(text) }} />
      ) : (
        <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">{text}</p>
      )}
    </div>
  );
}

/** Paragraphs, formatted text and lists, each under its own heading. */
export function VacancyCustomDetailSections({ details }: { details: VacancyCustomDetail[] }) {
  const sections = longDetails(details);
  if (!sections.length) return null;
  return (
    <div className="space-y-8">
      {sections.map((detail) => <DetailSection key={detail.key} detail={detail} />)}
    </div>
  );
}

type DetailBlock = { kind: 'cards'; details: VacancyCustomDetail[] } | { kind: 'section'; detail: VacancyCustomDetail };

/** Splits details into blocks in their order: neighbouring short answers share one card grid. */
function detailBlocks(details: VacancyCustomDetail[]): DetailBlock[] {
  const blocks: DetailBlock[] = [];
  for (const detail of details) {
    if (isLongDetail(detail)) {
      blocks.push({ kind: 'section', detail });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'cards') last.details.push(detail);
    else blocks.push({ kind: 'cards', details: [detail] });
  }
  return blocks;
}

/**
 * Every detail of a vacancy in the order of Form management > HR form: move a field up there and it
 * moves up here. Short answers are cards, longer ones sections; portal builder content comes last.
 */
export function VacancyFullDetails({ vacancy }: { vacancy: Vacancy }) {
  const blocks = detailBlocks(vacancyDetailList(vacancy));
  return (
    <div className="space-y-10">
      {blocks.map((block) =>
        block.kind === 'cards' ? (
          <div key={`cards-${block.details[0].key}`} className="grid gap-4 sm:grid-cols-2">
            <VacancyCustomDetailCards details={block.details} />
          </div>
        ) : (
          <DetailSection key={block.detail.key} detail={block.detail} />
        ),
      )}
      {hasPortalDisplayContent(vacancy.portalConfig) ? <VacancyPortalDisplay portalConfig={vacancy.portalConfig} /> : null}
    </div>
  );
}
