export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] as const;
export const VACANCY_STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'] as const;
export const DOCUMENT_ACCEPT_OPTIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] as const;

export type VacancyRequiredDocument = {
  id: string;
  label: string;
  required: boolean;
  accept: string[];
  maxSizeMb: number;
};

export type VacancyRequiredDocumentPayload = {
  label: string;
  required: boolean;
  accept: string[];
  maxSizeMb: number;
};

const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const emptyRequiredDocument = (): VacancyRequiredDocument => ({
  id: newId('doc'),
  label: '',
  required: true,
  accept: ['.pdf'],
  maxSizeMb: 5,
});

export const defaultRequiredDocuments = (): VacancyRequiredDocument[] => [
  {
    id: newId('doc'),
    label: 'CV',
    required: true,
    accept: ['.pdf', '.doc', '.docx'],
    maxSizeMb: 5,
  },
  {
    id: newId('doc'),
    label: 'Certificates',
    required: false,
    accept: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 8,
  },
];

export function parseRequiredDocuments(value: unknown): VacancyRequiredDocument[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const label = item.trim();
        if (!label) return null;
        return {
          id: newId('doc'),
          label,
          required: true,
          accept: ['.pdf', '.doc', '.docx'],
          maxSizeMb: 5,
        } satisfies VacancyRequiredDocument;
      }

      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const label = String(record.label || record.name || '').trim();
      if (!label) return null;
      const accept = Array.isArray(record.accept)
        ? record.accept.map((entry) => String(entry || '').trim()).filter(Boolean)
        : ['.pdf', '.doc', '.docx'];

      return {
        id: String(record.id || newId('doc')),
        label,
        required: record.required !== false,
        accept: accept.length ? accept : ['.pdf'],
        maxSizeMb: Number(record.maxSizeMb || record.maxSize || 5) || 5,
      } satisfies VacancyRequiredDocument;
    })
    .filter((item): item is VacancyRequiredDocument => Boolean(item));
}

export function serializeRequiredDocuments(documents: VacancyRequiredDocument[]): VacancyRequiredDocumentPayload[] {
  return documents
    .map((document) => ({
      label: document.label.trim(),
      required: Boolean(document.required),
      accept: document.accept.length ? document.accept : ['.pdf'],
      maxSizeMb: Number(document.maxSizeMb) || 5,
    }))
    .filter((document) => document.label);
}

export function validateRequiredDocumentFields(documents: VacancyRequiredDocument[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();

  if (!documents.length) {
    errors.requiredDocuments = 'Add at least one required document.';
    return errors;
  }

  documents.forEach((document, index) => {
    const prefix = `doc.${document.id || index}`;
    const label = document.label.trim();
    if (!label) errors[`${prefix}.label`] = 'Document label is required.';
    const key = label.toLowerCase();
    if (label && seen.has(key)) errors[`${prefix}.label`] = `"${label}" is already added.`;
    if (label) seen.add(key);
    if (!document.accept.length) errors[`${prefix}.accept`] = 'Choose at least one accepted file type.';
    if (!document.maxSizeMb || document.maxSizeMb < 1) errors[`${prefix}.maxSizeMb`] = 'Max size must be at least 1 MB.';
  });

  return errors;
}

export function validateRequiredDocuments(documents: VacancyRequiredDocument[]): string[] {
  return Object.values(validateRequiredDocumentFields(documents));
}

const textFromHtml = (value: string) =>
  value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export type VacancyFormInput = {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  status: string;
  closesAt: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredDocuments: VacancyRequiredDocument[];
};

export function validateVacancyForm(form: VacancyFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = 'Job title is required.';
  else if (form.title.trim().length < 3) errors.title = 'Enter at least 3 characters.';
  if (!form.department.trim()) errors.department = 'Department is required.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (!form.employmentType.trim()) errors.employmentType = 'Employment type is required.';
  if (!form.status.trim()) errors.status = 'Status is required.';
  if (!form.closesAt) errors.closesAt = 'Closing date is required.';

  if (!form.summary.trim()) errors.summary = 'Short summary is required.';
  else if (form.summary.trim().length < 10) errors.summary = 'Enter at least 10 characters.';

  const description = textFromHtml(form.description);
  if (!description) errors.description = 'Full description is required.';
  else if (description.length < 10) errors.description = 'Enter at least 10 characters.';

  if (!form.responsibilities.length) errors.responsibilities = 'Add at least one responsibility.';
  if (!form.requirements.length) errors.requirements = 'Add at least one requirement.';

  return { ...errors, ...validateRequiredDocumentFields(form.requiredDocuments) };
}
