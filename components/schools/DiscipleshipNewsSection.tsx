'use client';

import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';

const DISCIPLESHIP_NEWS: NewsSectionItem[] = [
  {
    badge: 'Discipleship',
    date: 'March 2026',
    title: 'New Discipleship Intake Opens',
    description: 'Enrollment is now open for the next Discipleship track. Join a class near you.',
    image: '/hero/hero-8.JPG',
  },
  {
    badge: 'Teaching',
    date: 'March 2026',
    title: 'Foundations Week Recap',
    description: 'Highlights from our most recent foundations sessions and student testimonies.',
    image: '/hero/hero-10.JPG',
  },
  {
    badge: 'Prayer',
    date: 'February 2026',
    title: 'Prayer & Fasting Focus',
    description: 'Weekly prayer rhythms and fasting guidance for students and volunteers.',
    image: '/hero/hero-4.JPG',
  },
  {
    badge: 'Leadership',
    date: 'February 2026',
    title: 'Leadership Level Announced',
    description: 'A deeper module for servant-leadership and spiritual maturity launches soon.',
    image: '/hero/hero-7.png',
  },
  {
    badge: 'Community',
    date: 'January 2026',
    title: 'Mentorship Signups',
    description: 'Mentors are needed to walk with new believers—sign up to serve in the school.',
    image: '/hero/hero-3.JPG',
  },
  {
    badge: 'Update',
    date: 'January 2026',
    title: 'Course Materials Available',
    description: 'Updated course outlines and recommended reading lists are now available.',
    image: '/hero/hero-5.png',
  },
];

export default function DiscipleshipNewsSection() {
  return (
    <NewsSection
      kicker="Updates"
      title="Discipleship News"
      description="Updates and highlights from the School of Discipleship."
      items={DISCIPLESHIP_NEWS}
      backgroundClassName="bg-[#eef4fb]"
    />
  );
}

