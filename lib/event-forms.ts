export const EVENT_MINISTRIES = [
  { key: 'icd', name: 'ICD' },
  { key: 'men-of-valour', name: 'Men of Valour' },
  { key: 'youth-church', name: 'Youth Church Ministry' },
  { key: 'women-of-hope', name: 'Women of Hope' },
  { key: 'wailing-woman', name: 'Wailing Woman' },
  { key: 'rivers-of-hope', name: 'Rivers of Hope' },
  { key: 'heritage', name: 'Heritage Ministry' },
  { key: 'prison-ministry', name: 'Prison Ministry' },
] as const;

export const EVENT_FORM_FIELD_TYPES = [
  { type: 'text', label: 'Short text' },
  { type: 'textarea', label: 'Long text' },
  { type: 'number', label: 'Number' },
  { type: 'email', label: 'Email' },
  { type: 'tel', label: 'Phone' },
  { type: 'date', label: 'Date' },
  { type: 'select', label: 'Dropdown' },
  { type: 'radio', label: 'Single choice' },
  { type: 'checkbox-group', label: 'Multiple choice' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'boolean', label: 'Yes / no' },
] as const;

export type EventFormFieldType = (typeof EVENT_FORM_FIELD_TYPES)[number]['type'];

export type EventFormField = {
  key: string;
  type: EventFormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
};

export type EventFormSchema = {
  title?: string;
  description?: string;
  fields: EventFormField[];
};

export type EventFormDraftField = {
  clientId: string;
  label: string;
  type: EventFormFieldType;
  required: boolean;
  placeholder: string;
  optionsText: string;
  locked?: boolean;
};

export type EventFormDraft = {
  title: string;
  description: string;
  fields: EventFormDraftField[];
};

export type EventAnswerValue = string | boolean | string[];
export type EventAnswers = Record<string, EventAnswerValue>;

const FIELD_TYPES = new Set<string>(EVENT_FORM_FIELD_TYPES.map((field) => field.type));
const CHOICE_TYPES = new Set<EventFormFieldType>(['select', 'radio', 'checkbox-group']);

export const EMPTY_EVENT_FORM_DRAFT: EventFormDraft = {
  title: '',
  description: '',
  fields: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function createFormFieldId() {
  return `field-${Math.random().toString(36).slice(2, 10)}`;
}

export function ministryNameForKey(key?: string | null) {
  return EVENT_MINISTRIES.find((ministry) => ministry.key === key)?.name || '';
}

function parseOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        const label = String(option).trim();
        return label ? { value: label, label } : null;
      }
      if (!isRecord(option)) return null;
      const label = String(option.label || option.value || '').trim();
      const optionValue = String(option.value || option.label || '').trim();
      if (!label || !optionValue) return null;
      return { value: optionValue, label };
    })
    .filter((option): option is { value: string; label: string } => Boolean(option));
}

export function parseEventForm(value: unknown): EventFormSchema | null {
  if (!isRecord(value) || !Array.isArray(value.fields)) return null;
  const fields = value.fields
    .map((field, index): EventFormField | null => {
      if (!isRecord(field)) return null;
      const type = String(field.type || 'text').trim().toLowerCase();
      if (!FIELD_TYPES.has(type)) return null;
      const label = String(field.label || '').trim();
      if (!label) return null;
      const key = String(field.key || `field_${index + 1}`).trim();
      const parsed: EventFormField = {
        key,
        type: type as EventFormFieldType,
        label,
        required: Boolean(field.required),
      };
      if (typeof field.placeholder === 'string' && field.placeholder.trim()) {
        parsed.placeholder = field.placeholder.trim();
      }
      if (typeof field.helpText === 'string' && field.helpText.trim()) {
        parsed.helpText = field.helpText.trim();
      }
      if (CHOICE_TYPES.has(parsed.type)) {
        parsed.options = parseOptions(field.options);
      }
      return parsed;
    })
    .filter((field): field is EventFormField => Boolean(field));

  if (fields.length === 0) return null;
  return {
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : undefined,
    description:
      typeof value.description === 'string' && value.description.trim() ? value.description.trim() : undefined,
    fields,
  };
}

export function formToDraft(form: EventFormSchema | null): EventFormDraft {
  if (!form) return { ...EMPTY_EVENT_FORM_DRAFT, fields: [] };
  return {
    title: form.title || '',
    description: form.description || '',
    fields: form.fields.map((field) => ({
      clientId: createFormFieldId(),
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || '',
      optionsText: (field.options || []).map((option) => option.label).join(', '),
    })),
  };
}

function isDraftNameField(field: Pick<EventFormDraftField, 'label'>) {
  const label = field.label.trim().toLowerCase();
  return label === 'full name' || label === 'name' || label === 'first name';
}

function isDraftPhoneField(field: Pick<EventFormDraftField, 'label' | 'type'>) {
  const label = field.label.trim().toLowerCase();
  return field.type === 'tel' || label === 'phone' || label === 'phone number' || label === 'mobile' || label === 'mobile number';
}

export function ensureRegistrationDraft(draft: EventFormDraft): EventFormDraft {
  const fields = draft.fields.map((field) => (
    isDraftNameField(field) || isDraftPhoneField(field)
      ? { ...field, required: true, locked: true }
      : field
  ));
  const locked: EventFormDraftField[] = [];
  if (!fields.some(isDraftNameField)) {
    locked.push({
      clientId: 'locked-full-name',
      label: 'Full name',
      type: 'text',
      required: true,
      placeholder: 'Full name',
      optionsText: '',
      locked: true,
    });
  }
  if (!fields.some(isDraftPhoneField)) {
    locked.push({
      clientId: 'locked-phone-number',
      label: 'Phone number',
      type: 'tel',
      required: true,
      placeholder: 'Phone number',
      optionsText: '',
      locked: true,
    });
  }
  return { ...draft, fields: [...locked, ...fields] };
}

/** Shape a saved form the way POST /api/events expects it. */
export function eventFormForApi(form: EventFormSchema | null) {
  if (!form || form.fields.length === 0) return null;
  return {
    ...(form.title ? { title: form.title } : {}),
    ...(form.description ? { description: form.description } : {}),
    fields: form.fields.map((field) => ({
      label: field.label,
      type: field.type,
      required: field.required,
      ...(field.placeholder ? { placeholder: field.placeholder } : {}),
      ...(field.options?.length
        ? { options: field.options.map((option) => option.label || option.value) }
        : {}),
    })),
  };
}

export function draftToPayload(draft: EventFormDraft): { form: EventFormSchema | null } | { error: string } {
  if (draft.fields.length === 0) return { form: null };
  const fields: EventFormField[] = [];

  for (const field of draft.fields) {
    const label = field.label.trim();
    if (!label) return { error: 'Each form field needs a label.' };
    const options = field.optionsText
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
      .map((option) => ({ value: option, label: option }));
    if (CHOICE_TYPES.has(field.type) && options.length === 0) {
      return { error: `"${label}" needs at least one option.` };
    }
    fields.push({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field',
      type: field.type,
      label,
      required: field.required,
      ...(field.placeholder.trim() ? { placeholder: field.placeholder.trim() } : {}),
      ...(CHOICE_TYPES.has(field.type) ? { options } : {}),
    });
  }

  return {
    form: {
      ...(draft.title.trim() ? { title: draft.title.trim() } : {}),
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      fields,
    },
  };
}

export function emptyAnswers(form: EventFormSchema | null): EventAnswers {
  const answers: EventAnswers = {};
  for (const field of form?.fields || []) {
    if (field.type === 'checkbox' || field.type === 'boolean') answers[field.key] = false;
    else if (field.type === 'checkbox-group') answers[field.key] = [];
    else answers[field.key] = '';
  }
  return answers;
}

export function validateEventAnswers(form: EventFormSchema | null, answers: EventAnswers) {
  for (const field of form?.fields || []) {
    const value = answers[field.key];
    if (field.type === 'checkbox' || field.type === 'boolean') {
      if (field.required && value !== true) return `${field.label} is required.`;
      continue;
    }
    if (field.type === 'checkbox-group') {
      if (field.required && (!Array.isArray(value) || value.length === 0)) return `${field.label} is required.`;
      continue;
    }
    if (field.required && !String(value ?? '').trim()) return `${field.label} is required.`;
    if (field.type === 'email' && String(value ?? '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
      return `${field.label} must be a valid email.`;
    }
  }
  return null;
}

function isNameField(field: EventFormField) {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  return (
    ['full_name', 'fullname', 'name', 'first_name', 'firstname', 'last_name', 'lastname'].includes(key) ||
    ['full name', 'name', 'first name', 'last name'].includes(label)
  );
}

export function contactFromEventAnswers(form: EventFormSchema | null, answers: EventAnswers) {
  let name = '';
  let email = '';
  let phone = '';
  const nameParts: string[] = [];

  for (const field of form?.fields || []) {
    const value = answers[field.key];
    if (typeof value !== 'string' || !value.trim()) continue;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    if (field.type === 'email' || key === 'email' || label === 'email' || label === 'email address') email = value.trim();
    if (field.type === 'tel' || ['phone', 'tel', 'mobile', 'phone_number'].includes(key) || label === 'phone' || label === 'phone number') {
      phone = value.trim();
    }
    if (['full_name', 'fullname', 'name'].includes(key) || label === 'full name' || label === 'name') name = value.trim();
    if (['first_name', 'firstname'].includes(key) || label === 'first name') nameParts[0] = value.trim();
    if (['last_name', 'lastname'].includes(key) || label === 'last name') nameParts[1] = value.trim();
  }

  if (!name && (nameParts[0] || nameParts[1])) name = nameParts.filter(Boolean).join(' ');
  return { name, email, phone };
}

export type EventTicket = {
  key: string;
  name: string;
  price: number;
};

export type EventTicketDraft = {
  clientId: string;
  name: string;
  price: string;
};

export function parseEventTickets(value: unknown): EventTicket[] {
  if (!Array.isArray(value)) return [];
  const tickets: EventTicket[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) continue;
    const name = String(item.name || '').trim();
    const price = Number(item.price);
    const key = String(item.key || name).trim();
    if (!name || !key || !Number.isFinite(price) || price <= 0 || seen.has(key)) continue;
    seen.add(key);
    tickets.push({ key, name, price });
  }
  return tickets;
}

export function ticketsToDraft(tickets: EventTicket[]): EventTicketDraft[] {
  return tickets.map((ticket, index) => ({
    clientId: `ticket-${index}-${ticket.key}`,
    name: ticket.name,
    price: String(ticket.price),
  }));
}

export function formCollectsContact(form: EventFormSchema | null) {
  const fields = form?.fields || [];
  return {
    name: fields.some(isNameField),
    email: fields.some((field) => field.type === 'email'),
    phone: fields.some((field) => field.type === 'tel'),
  };
}
