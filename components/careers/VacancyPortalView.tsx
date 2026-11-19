'use client';

import {
  collectFields,
  fieldWidget,
  htmlToText,
  type PortalConfig,
  type PortalField,
} from '@/lib/hr-portal';

/** Staff write this HTML in the vacancy editor; scripts and inline handlers are still removed before showing it. */
export function cleanHtml(html: string) {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

function DisplayField({ field }: { field: PortalField }) {
  const widget = fieldWidget(field);
  const type = String(field.type || '').toLowerCase();
  const isList = ['list', 'bullet-list', 'bullets', 'bulletlist'].includes(widget) || type === 'list';

  if (widget === 'divider' || type === 'divider') return <hr className="my-6 border-slate-200" />;
  if (widget === 'heading' || type === 'heading') return <h3 className="text-xl font-bold text-primary">{field.label || field.content}</h3>;
  if (isList) {
    const items = field.items || [];
    if (!items.length) return null;
    return (
      <div>
        {field.label ? <h3 className="text-xl font-bold text-primary">{field.label}</h3> : null}
        <ul className="mt-4 space-y-3 text-slate-600">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const html = field.content || '';
  if (!html && !field.label) return null;
  return (
    <div>
      {field.label ? <h3 className="text-xl font-bold text-primary">{field.label}</h3> : null}
      {html ? (
        <div
          className="vacancy-rich mt-4 text-slate-600"
          dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
        />
      ) : null}
    </div>
  );
}

/** Display content (headings, text, lists) HR added to the vacancy in the portal builder. */
export function portalDisplayFields(portalConfig?: PortalConfig | null) {
  return collectFields(portalConfig).display.filter((field) => {
    const widget = fieldWidget(field);
    const type = String(field.type || '').toLowerCase();
    if (widget === 'divider' || type === 'divider') return true;
    if (widget === 'heading' || type === 'heading') return Boolean(field.label || field.content);
    return Boolean((field.items || []).length || htmlToText(field.content) || field.label);
  });
}

/** Whether the portal builder holds real content (not only headings or dividers). */
export function hasPortalDisplayContent(portalConfig?: PortalConfig | null) {
  return collectFields(portalConfig).display.some((field) => (field.items || []).length > 0 || Boolean(htmlToText(field.content)));
}

export function VacancyPortalDisplay({ portalConfig }: { portalConfig?: PortalConfig | null }) {
  const fields = portalDisplayFields(portalConfig);
  if (!fields.length) return null;
  return (
    <div className="space-y-8">
      {fields.map((field, index) => (
        <DisplayField key={`${field.key || field.type}-${index}`} field={field} />
      ))}
    </div>
  );
}

export default function VacancyPortalView({
  portalConfig,
  description,
  requirements = [],
  responsibilities = [],
}: {
  portalConfig?: PortalConfig | null;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
}) {
  const hasPortalContent = hasPortalDisplayContent(portalConfig);
  const descriptionText = htmlToText(description);
  const alreadyInDescription = (items: string[]) =>
    Boolean(descriptionText) && items.every((item) => descriptionText.includes(htmlToText(item)));

  return (
    <div className="space-y-10">
      {hasPortalContent ? <VacancyPortalDisplay portalConfig={portalConfig} /> : null}

      {description && !hasPortalContent ? (
        <div>
          <h2 className="text-2xl font-bold text-primary">Job details</h2>
          <div className="vacancy-rich mt-4 text-slate-600" dangerouslySetInnerHTML={{ __html: cleanHtml(description) }} />
        </div>
      ) : null}

      {!hasPortalContent && requirements.length && !alreadyInDescription(requirements) ? (
        <div>
          <h2 className="text-2xl font-bold text-primary">Minimum Requirements</h2>
          <ul className="mt-5 space-y-3 text-slate-600">
            {requirements.map((requirement) => (
              <li key={requirement} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasPortalContent && responsibilities.length && !alreadyInDescription(responsibilities) ? (
        <div>
          <h2 className="text-2xl font-bold text-primary">Key Responsibilities</h2>
          <ul className="mt-5 space-y-3 text-slate-600">
            {responsibilities.map((responsibility) => (
              <li key={responsibility} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
