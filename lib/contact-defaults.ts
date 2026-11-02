import type { CollectionField } from '@/components/admin/ContentCollectionManager';
import type { ContentSeed } from '@/lib/content-items';

/** Icons the contact cards can use (see app/contact/page.tsx). */
export const CONTACT_CARD_ICONS = ['phone', 'email', 'location', 'whatsapp', 'clock', 'facebook', 'youtube'];

export const CONTACT_CARD_SEEDS: ContentSeed[] = [
  {
    title: 'Call us',
    subtitle: '+265 992 433 333',
    body: 'Speak to the church office.',
    linkUrl: 'tel:+265992433333',
    data: { icon: 'phone' },
  },
  {
    title: 'Email us',
    subtitle: 'info@piccworldwide.org',
    body: 'We reply as soon as we can.',
    linkUrl: 'mailto:info@piccworldwide.org',
    data: { icon: 'email' },
  },
  {
    title: 'Visit us',
    subtitle: 'The Camp of God Cathedral',
    body: 'Along Kaunda Road, near Best Oil Filling Station, Area 49, Lilongwe.',
    linkUrl: 'https://maps.google.com/?q=PICC+Headquarters+Lilongwe',
    data: { icon: 'location' },
  },
];

export const CONTACT_CARD_FIELDS: CollectionField[] = [
  { name: 'title', label: 'Card heading', placeholder: 'Call us' },
  { name: 'subtitle', label: 'Main detail', placeholder: '+265 992 433 333', required: true },
  { name: 'body', label: 'Short note', type: 'textarea' },
  { name: 'linkUrl', label: 'Link', placeholder: 'tel:+265…, mailto:…, or https://…', help: 'Where the card goes when tapped.' },
  { name: 'data.icon', label: 'Icon', type: 'select', options: CONTACT_CARD_ICONS },
];

export const CONTACT_OFFICE_FIELDS: CollectionField[] = [
  { name: 'title', label: 'Office or department', placeholder: 'Church Administration' },
  { name: 'subtitle', label: 'Contact person', placeholder: 'Name and title' },
  { name: 'data.phone', label: 'Phone' },
  { name: 'data.email', label: 'Email' },
  { name: 'body', label: 'Office hours or note', type: 'textarea' },
];
