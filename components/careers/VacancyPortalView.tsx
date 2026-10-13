'use client';

import {
  collectFields,
  fieldWidget,
  htmlToText,
  isDisplayField,
  isFileField,
  isInputField,
  type PortalConfig,
  type PortalField,
} from '@/lib/hr-portal';

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
          {items.map((item) => (
            <li key={item} className="flex gap-3">
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
          className="mt-4 prose prose-slate max-w-none text-slate-600"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
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
  const sections = portalConfig?.sections || [];
  const collected = collectFields(portalConfig);
  const hasPortalContent = collected.display.some((field) => {
    if ((field.items || []).length) return true;
    return Boolean(htmlToText(field.content));
  });
  const descriptionText = htmlToText(description);
  const alreadyInDescription = (items: string[]) =>
    Boolean(descriptionText) && items.every((item) => descriptionText.includes(htmlToText(item)));

  return (
    <div className="space-y-10">
      {description && !hasPortalContent ? (
        <div>
          <h2 className="text-2xl font-bold text-primary">Job details</h2>
          <div className="mt-4 prose prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: description }} />
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
