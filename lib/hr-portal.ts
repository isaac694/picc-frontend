export type PortalOption = string | { value?: string; label?: string };

export type PortalField = {
  key?: string;
  type?: string;
  widget?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  content?: string;
  items?: string[];
  options?: PortalOption[];
  accept?: string[];
  maxSizeMb?: number;
  rows?: number;
  displayOnly?: boolean;
  props?: Record<string, unknown>;
};

export type PortalSection = {
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  fields?: PortalField[];
};

export type PortalDisplay = {
  title?: string;
  subtitle?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  summary?: string;
};

export type PortalConfig = {
  version?: number;
  display?: PortalDisplay;
  sections?: PortalSection[];
};

export type PortalFieldCatalogItem = {
  type: string;
  label: string;
  category: 'display' | 'input' | 'file';
  description?: string;
};

export const DEFAULT_PORTAL_FIELD_TYPES: PortalFieldCatalogItem[] = [
  { type: 'heading', label: 'Heading', category: 'display', description: 'Section heading' },
  { type: 'content', label: 'Rich content', category: 'display', description: 'Formatted text block' },
  { type: 'list', label: 'List', category: 'display', description: 'Bullet list of items' },
  { type: 'divider', label: 'Divider', category: 'display' },
  { type: 'text', label: 'Short text', category: 'input' },
  { type: 'textarea', label: 'Long text', category: 'input' },
  { type: 'email', label: 'Email', category: 'input' },
  { type: 'tel', label: 'Phone', category: 'input' },
  { type: 'number', label: 'Number', category: 'input' },
  { type: 'date', label: 'Date', category: 'input' },
  { type: 'select', label: 'Dropdown', category: 'input' },
  { type: 'radio', label: 'Radio group', category: 'input' },
  { type: 'checkbox', label: 'Checkboxes', category: 'input' },
  { type: 'file', label: 'File upload', category: 'file' },
];

export const DEFAULT_FILE_ACCEPT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];

export function slugifyKey(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || `field_${Date.now()}`;
}

export function optionLabel(option: PortalOption) {
  if (typeof option === 'string') return option;
  return option.label || option.value || '';
}

export function optionValue(option: PortalOption) {
  if (typeof option === 'string') return option;
  return option.value || option.label || '';
}

const DISPLAY_WIDGETS = [
  'content',
  'list',
  'heading',
  'divider',
  'html',
  'info',
  'rich-text',
  'richtext',
  'wysiwyg',
  'markdown',
  'paragraph',
  'bullet-list',
  'bullets',
  'bulletlist',
];

export function fieldWidget(field: PortalField) {
  return String(field.widget || field.type || 'text').toLowerCase();
}

export function fieldType(field: PortalField) {
  return String(field.type || field.widget || 'text').toLowerCase();
}

export function isFileField(field: PortalField) {
  const widget = fieldWidget(field);
  const type = fieldType(field);
  return ['file', 'upload', 'attachment'].includes(widget) || ['file', 'upload', 'attachment'].includes(type);
}

export function isDisplayField(field: PortalField) {
  if (field.displayOnly) return true;
  const widget = fieldWidget(field);
  const type = fieldType(field);
  return DISPLAY_WIDGETS.includes(widget) || DISPLAY_WIDGETS.includes(type);
}

export function isInputField(field: PortalField) {
  return !isFileField(field) && !isDisplayField(field);
}

export function catalogCategory(type: string): PortalFieldCatalogItem['category'] {
  const found = DEFAULT_PORTAL_FIELD_TYPES.find((item) => item.type === type);
  if (found) return found.category;
  if (type === 'file' || type === 'upload' || type === 'attachment') return 'file';
  if (DISPLAY_WIDGETS.includes(type)) return 'display';
  return 'input';
}

export function parseCatalog(value: unknown): PortalFieldCatalogItem[] {
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const raw = Array.isArray(value)
    ? value
    : Array.isArray(record.fieldTypes)
      ? record.fieldTypes
      : Array.isArray(record.types)
        ? record.types
        : Array.isArray(record.catalog)
          ? record.catalog
          : [];

  const parsed = raw.map((item) => {
    if (typeof item === 'string') {
      return {
        type: item,
        label: item,
        category: catalogCategory(item),
      } satisfies PortalFieldCatalogItem;
    }
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const type = String(row.type || row.name || row.key || '').trim();
    if (!type) return null;
    return {
      type,
      label: String(row.label || row.name || type),
      category: catalogCategory(String(row.category || row.group || type)),
      description: typeof row.description === 'string' ? row.description : undefined,
    } satisfies PortalFieldCatalogItem;
  }).filter((item): item is PortalFieldCatalogItem => Boolean(item));

  return parsed.length ? parsed : DEFAULT_PORTAL_FIELD_TYPES;
}

export function newField(type: string, label?: string): PortalField {
  const category = catalogCategory(type);
  const resolvedLabel = label || DEFAULT_PORTAL_FIELD_TYPES.find((item) => item.type === type)?.label || type;
  const field: PortalField = {
    type,
    widget: type,
    label: resolvedLabel,
    required: category !== 'display',
  };

  if (category !== 'display') field.key = slugifyKey(resolvedLabel);
  if (type === 'textarea') field.rows = 5;
  if (type === 'content') field.content = '';
  if (type === 'list') field.items = [];
  if (type === 'select' || type === 'radio' || type === 'checkbox') field.options = ['Option 1'];
  if (type === 'file') {
    field.accept = DEFAULT_FILE_ACCEPT;
    field.maxSizeMb = 5;
  }
  return field;
}

export function newSection(type: 'content' | 'form' | 'attachments', title?: string): PortalSection {
  const titles = {
    content: 'About this vacancy',
    form: 'Application form',
    attachments: 'Required documents',
  };
  return {
    id: `${type}_${Date.now()}`,
    title: title || titles[type],
    type,
    description: type === 'form' ? 'Complete the fields below to apply.' : '',
    fields: type === 'form'
      ? [newField('textarea', 'Cover letter')]
      : type === 'attachments'
        ? [newField('file', 'CV')]
        : [newField('content', 'Description')],
  };
}

export function buildDefaultPortalConfig(input: {
  title?: string;
  department?: string;
  location?: string;
  employmentType?: string;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  requiredDocuments?: string[];
}): PortalConfig {
  const documentFields = (input.requiredDocuments || []).map((label) => ({
    ...newField('file', label),
    key: slugifyKey(label),
    required: true,
  }));

  return {
    version: 1,
    display: {
      title: input.title || '',
      subtitle: input.summary || '',
      department: input.department || '',
      location: input.location || '',
      employmentType: input.employmentType || '',
      summary: input.summary || '',
    },
    sections: [
      {
        id: 'overview',
        title: 'About this vacancy',
        type: 'content',
        fields: [
          { type: 'content', widget: 'content', label: 'Description', content: input.description || '' },
          { type: 'list', widget: 'list', label: 'Responsibilities', items: input.responsibilities || [] },
          { type: 'list', widget: 'list', label: 'Qualifications and requirements', items: input.requirements || [] },
        ],
      },
      {
        id: 'application',
        title: 'Application form',
        type: 'form',
        description: 'Complete the fields below to apply.',
        fields: [
          { key: 'coverLetter', type: 'textarea', widget: 'textarea', label: 'Cover letter', required: true, rows: 6 },
          { key: 'availability', type: 'text', widget: 'text', label: 'Availability', required: true },
        ],
      },
      {
        id: 'attachments',
        title: 'Required documents',
        type: 'attachments',
        fields: documentFields.length
          ? documentFields
          : [{ key: 'cv', type: 'file', widget: 'file', label: 'CV', required: true, accept: DEFAULT_FILE_ACCEPT, maxSizeMb: 5 }],
      },
    ],
  };
}

export function normalizePortalConfig(value: unknown): PortalConfig | null {
  if (!value || typeof value !== 'object') return null;
  const config = value as PortalConfig;
  if (!Array.isArray(config.sections) && !config.display) return null;
  return {
    version: Number(config.version || 1),
    display: config.display || {},
    sections: Array.isArray(config.sections) ? config.sections : [],
  };
}

export function collectFields(config?: PortalConfig | null) {
  const fields = (config?.sections || []).flatMap((section) => section.fields || []);
  return {
    display: fields.filter(isDisplayField),
    inputs: fields.filter(isInputField),
    files: fields.filter(isFileField),
  };
}

export function htmlToText(value?: string) {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
