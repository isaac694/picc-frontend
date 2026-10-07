export const ADMIN_PAGE = {
  DEVOTIONS: 'DEVOTIONS',
  CONFESSIONS: 'CONFESSIONS',
  SEE_YOU_IN_CHURCH: 'SEE_YOU_IN_CHURCH',
  SERVICES: 'SERVICES',
  EVENTS: 'EVENTS',
  QUOTE_OF_MONTH: 'QUOTE_OF_MONTH',
  PAGE_IMAGES: 'PAGE_IMAGES',
  VIDEO_DECLARATIONS: 'VIDEO_DECLARATIONS',
  LIVECHAT: 'LIVECHAT',
  ABOUT_PAGE: 'ABOUT_PAGE',
  CONTACT_PAGE: 'CONTACT_PAGE',
  MEDIA_PAGE: 'MEDIA_PAGE',
  STORE_PAGE: 'STORE_PAGE',
  FORMS_PAGE: 'FORMS_PAGE',
  SERMONS_PAGE: 'SERMONS_PAGE',
  GIVE_PAGE: 'GIVE_PAGE',
  LOCATIONS_PAGE: 'LOCATIONS_PAGE',
  FAQS: 'FAQS',
  SCHOOLS_ENROLLMENT: 'SCHOOLS_ENROLLMENT',
  HR_PAGE: 'HR_PAGE',
  MINISTRIES: 'MINISTRIES',
} as const;

export type AdminPageKey = (typeof ADMIN_PAGE)[keyof typeof ADMIN_PAGE];
export type AdminRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  roleId?: string | null;
  assignedRole?: {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    isSystem?: boolean;
  } | null;
  isSystem?: boolean;
  permissions?: unknown[];
  accessRights?: unknown[];
  rights?: unknown[];
  adminAccessAll?: boolean;
  adminPageAccess?: string[];
};

export const ADMIN_PAGE_OPTIONS: Array<{ key: AdminPageKey; label: string }> = [
  { key: ADMIN_PAGE.DEVOTIONS, label: 'Devotions' },
  { key: ADMIN_PAGE.CONFESSIONS, label: 'Confessions' },
  { key: ADMIN_PAGE.SEE_YOU_IN_CHURCH, label: 'See You in Church' },
  { key: ADMIN_PAGE.SERVICES, label: 'Services' },
  { key: ADMIN_PAGE.EVENTS, label: 'Events' },
  { key: ADMIN_PAGE.QUOTE_OF_MONTH, label: 'Qoutes' },
  { key: ADMIN_PAGE.PAGE_IMAGES, label: 'Homepage Images' },
  { key: ADMIN_PAGE.VIDEO_DECLARATIONS, label: 'Video Declarations' },
  { key: ADMIN_PAGE.LIVECHAT, label: 'Live Chat Archive' },
  { key: ADMIN_PAGE.ABOUT_PAGE, label: 'About Page' },
  { key: ADMIN_PAGE.CONTACT_PAGE, label: 'Contact Page' },
  { key: ADMIN_PAGE.MEDIA_PAGE, label: 'Media Page' },
  { key: ADMIN_PAGE.STORE_PAGE, label: 'Store Page' },
  { key: ADMIN_PAGE.FORMS_PAGE, label: 'Forms Page' },
  { key: ADMIN_PAGE.SERMONS_PAGE, label: 'Sermons Page' },
  { key: ADMIN_PAGE.GIVE_PAGE, label: 'Give Page' },
  { key: ADMIN_PAGE.LOCATIONS_PAGE, label: 'Church Locations' },
  { key: ADMIN_PAGE.FAQS, label: 'FAQ (Footer)' },
  { key: ADMIN_PAGE.SCHOOLS_ENROLLMENT, label: 'Schools Enrollment' },
  { key: ADMIN_PAGE.HR_PAGE, label: 'HR Vacancies' },
];

export const MINISTRY_ADMIN_OPTIONS = [
  { key: 'icd', label: 'ICD' },
  { key: 'men-of-valour', label: 'Men of Valour' },
  { key: 'prison-ministry', label: 'Prison Ministry' },
  { key: 'youth-church', label: 'Youth Church' },
  { key: 'women-of-hope', label: 'Women of Hope' },
  { key: 'wailing-woman', label: 'Wailing Woman' },
  { key: 'rivers-of-hope', label: 'Rivers of Hope' },
  { key: 'heritage', label: 'Heritage' },
] as const;

export type MinistryAdminKey = (typeof MINISTRY_ADMIN_OPTIONS)[number]['key'];

export const ministryAdminAccessKey = (ministryKey: string) => `MINISTRY:${ministryKey}`;

export const ADMIN_ACCESS_RIGHT = {
  ROLE_LIST: 'role.list',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT: 'role.edit',
  ROLE_DELETE: 'role.delete',
  ROLE_ACCESS_RIGHTS_MANAGE: 'role.access_rights.manage',
  USER_LIST: 'user.list',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
} as const;

export type AdminAccessRight = (typeof ADMIN_ACCESS_RIGHT)[keyof typeof ADMIN_ACCESS_RIGHT] | AdminPageKey | `MINISTRY:${string}`;

export type AdminAccessRightOption = {
  entity: string;
  label: string;
  description: string;
  rights: Array<{
    name: AdminAccessRight;
    label: string;
    description: string;
  }>;
};

export const ADMIN_ACCESS_RIGHT_OPTIONS: AdminAccessRightOption[] = [
  {
    entity: 'role',
    label: 'Roles',
    description: 'Create roles and assign access rights.',
    rights: [
      {
        name: ADMIN_ACCESS_RIGHT.ROLE_LIST,
        label: 'View roles',
        description: 'Can open role management and view roles.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.ROLE_CREATE,
        label: 'Create roles',
        description: 'Can create new roles.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.ROLE_EDIT,
        label: 'Edit roles',
        description: 'Can update role names and descriptions.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.ROLE_DELETE,
        label: 'Delete roles',
        description: 'Can delete non-system roles.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.ROLE_ACCESS_RIGHTS_MANAGE,
        label: 'Manage role access',
        description: 'Can grant and revoke access rights on roles.',
      },
    ],
  },
  {
    entity: 'user',
    label: 'Users',
    description: 'Manage admin users.',
    rights: [
      {
        name: ADMIN_ACCESS_RIGHT.USER_LIST,
        label: 'View users',
        description: 'Can open user management and list users.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.USER_CREATE,
        label: 'Create users',
        description: 'Can create admin users.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.USER_EDIT,
        label: 'Edit users',
        description: 'Can update admin users.',
      },
      {
        name: ADMIN_ACCESS_RIGHT.USER_DELETE,
        label: 'Delete users',
        description: 'Can delete admin users.',
      },
    ],
  },
  {
    entity: 'admin-pages',
    label: 'Admin Pages',
    description: 'Access website content management pages.',
    rights: ADMIN_PAGE_OPTIONS.map((option) => ({
      name: option.key,
      label: option.label,
      description: `Can access ${option.label}.`,
    })),
  },
  {
    entity: 'ministries',
    label: 'Ministries',
    description: 'Access individual ministry admin pages.',
    rights: [
      {
        name: ADMIN_PAGE.MINISTRIES,
        label: 'All ministries',
        description: 'Can access every ministry admin page.',
      },
      ...MINISTRY_ADMIN_OPTIONS.map((option) => ({
        name: ministryAdminAccessKey(option.key) as AdminAccessRight,
        label: option.label,
        description: `Can access ${option.label} ministry admin.`,
      })),
    ],
  },
];

const PAGE_ACCESS_RIGHTS = new Set<string>([
  ...ADMIN_PAGE_OPTIONS.map((option) => option.key),
  ADMIN_PAGE.MINISTRIES,
  ...MINISTRY_ADMIN_OPTIONS.map((option) => ministryAdminAccessKey(option.key)),
]);

const extractRightName = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const name = record.name ?? record.key ?? record.code;
  return typeof name === 'string' ? name : null;
};

export function getAdminUserAccessRights(user: AdminUser | null): string[] {
  if (!user) return [];

  const record = user as Record<string, unknown>;
  const sources = [record.permissions, record.accessRights, record.rights, record.adminPageAccess];

  return sources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map(extractRightName)
    .filter((right): right is string => Boolean(right));
}

export function canAccessRight(user: AdminUser | null, right: string): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.isSystem || user.assignedRole?.isSystem) return true;

  const rights = getAdminUserAccessRights(user);
  if (rights.includes('*') || rights.includes(right)) return true;

  // Backwards compatibility for existing admins that use page-level access.
  if (user.role === 'ADMIN' && user.adminAccessAll && PAGE_ACCESS_RIGHTS.has(right)) {
    return true;
  }

  return false;
}

export function ministryKeyFromAdminPath(pathname: string | null): string | null {
  const match = (pathname || '').match(/^\/admin\/ministries\/([^/]+)/);
  return match ? match[1] : null;
}

export function canAccessMinistry(user: AdminUser | null, ministryKey: string): boolean {
  if (!user) return false;
  if (canAccessRight(user, ADMIN_PAGE.MINISTRIES)) return true;
  if (canAccessRight(user, ministryAdminAccessKey(ministryKey))) return true;
  if (user.role !== 'ADMIN') return false;
  if (user.adminAccessAll) return true;

  const list = Array.isArray(user.adminPageAccess) ? user.adminPageAccess : [];
  return list.includes(ministryAdminAccessKey(ministryKey));
}

export function canAccessAdminPage(user: AdminUser | null, page: AdminPageKey): boolean {
  // Before login we don't have a profile; keep the sidebar usable.
  if (!user) return false;
  if (canAccessRight(user, page)) return true;
  if (user.role !== 'ADMIN') return false;
  if (user.adminAccessAll) return true;
  const list = Array.isArray(user.adminPageAccess) ? user.adminPageAccess : [];
  return list.includes(page);
}
