'use client';

import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';

export type ChurchNewsItem = NewsSectionItem;

const CAMPUS_NEWS: ChurchNewsItem[] = [
  {
    badge: 'Community',
    date: 'March 2026',
    title: 'Easter Celebrations & Community Outreach',
    description:
      'A look at how our church came together this Easter season to serve families across the community.',
    image: '/hero/hero-4.JPG',
  },
  {
    badge: 'Youth',
    date: 'March 2026',
    title: 'Youth Revival Week Highlights',
    description:
      'Our youth ministry hosted an incredible week of worship, fellowship, and spiritual growth.',
    image: '/hero/hero-10.JPG',
  },
  {
    badge: 'Updates',
    date: 'February 2026',
    title: 'New Building Expansion Update',
    description:
      'Construction progress on our new fellowship hall â€” see the latest milestones and timeline.',
    image: '/hero/hero-8.JPG',
  },
  {
    badge: 'Worship',
    date: 'February 2026',
    title: 'Night of Praise Recap',
    description:
      'A beautiful night of worship, prayer, and testimonies that lifted hearts across the campus.',
    image: '/hero/hero-7.png',
  },
  {
    badge: 'Outreach',
    date: 'January 2026',
    title: 'Campus Volunteer Drive',
    description:
      'Members gathered to serve, share resources, and pray with families in the neighborhood.',
    image: '/hero/hero-5.png',
  },
  {
    badge: 'Ministry',
    date: 'January 2026',
    title: 'Women of Hope Gathering',
    description:
      'A powerful gathering featuring teaching, fellowship, and encouragement for every season.',
    image: '/hero/hero-3.JPG',
  },
];

export default function ChurchNewsSection({ items = CAMPUS_NEWS }: { items?: ChurchNewsItem[] }) {
  return (
    <NewsSection
      kicker="What&apos;s happening"
      title="Church News"
      description="Quick updates and highlights from what&apos;s happening on campus."
      items={items}
      backgroundClassName="bg-[#eef4fb]"
    />
  );
}
