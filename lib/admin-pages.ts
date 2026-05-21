export const ADMIN_PAGE = {
  DEVOTIONS: 'DEVOTIONS',
  CONFESSIONS: 'CONFESSIONS',
  SEE_YOU_IN_CHURCH: 'SEE_YOU_IN_CHURCH',
  SERVICES: 'SERVICES',
  EVENTS: 'EVENTS',
  QUOTE_OF_MONTH: 'QUOTE_OF_MONTH',
  PAGE_IMAGES: 'PAGE_IMAGES',
  LIVECHAT: 'LIVECHAT',
  ABOUT_PAGE: 'ABOUT_PAGE',
  CONTACT_PAGE: 'CONTACT_PAGE',
  MEDIA_PAGE: 'MEDIA_PAGE',
  FORMS_PAGE: 'FORMS_PAGE',
  SERMONS_PAGE: 'SERMONS_PAGE',
  GIVE_PAGE: 'GIVE_PAGE',
  LOCATIONS_PAGE: 'LOCATIONS_PAGE',
  FAQS: 'FAQS',
  SCHOOLS_ENROLLMENT: 'SCHOOLS_ENROLLMENT',
  MINISTRIES: 'MINISTRIES',
} as const;

export type AdminPageKey = (typeof ADMIN_PAGE)[keyof typeof ADMIN_PAGE];
export type AdminRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
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
  { key: ADMIN_PAGE.LIVECHAT, label: 'Live Chat Archive' },
  { key: ADMIN_PAGE.ABOUT_PAGE, label: 'About Page' },
  { key: ADMIN_PAGE.CONTACT_PAGE, label: 'Contact Page' },
  { key: ADMIN_PAGE.MEDIA_PAGE, label: 'Media Page' },
  { key: ADMIN_PAGE.FORMS_PAGE, label: 'Forms Page' },
  { key: ADMIN_PAGE.SERMONS_PAGE, label: 'Sermons Page' },
  { key: ADMIN_PAGE.GIVE_PAGE, label: 'Give Page' },
  { key: ADMIN_PAGE.LOCATIONS_PAGE, label: 'Church Locations' },
  { key: ADMIN_PAGE.FAQS, label: 'FAQ (Footer)' },
  { key: ADMIN_PAGE.SCHOOLS_ENROLLMENT, label: 'Schools Enrollment' },
  { key: ADMIN_PAGE.MINISTRIES, label: 'Ministries' },
];

export function canAccessAdminPage(user: AdminUser | null, page: AdminPageKey): boolean {
  // Before login we don't have a profile; keep the sidebar usable.
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role !== 'ADMIN') return false;
  if (user.adminAccessAll) return true;
  const list = Array.isArray(user.adminPageAccess) ? user.adminPageAccess : [];
  return list.includes(page);
}
