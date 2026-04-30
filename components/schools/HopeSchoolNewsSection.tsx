'use client';

import NewsSection, { type NewsSectionItem } from '@/components/NewsSection';

const HOPE_SCHOOL_NEWS: NewsSectionItem[] = [
  {
    badge: 'Hope School',
    date: 'March 2026',
    title: 'New Intake Registration Open',
    description: 'Enrollment is now open for the next Hope School intake for leadership training.',
    image: '/hero/hero-4.JPG',
  },
  {
    badge: 'Leadership',
    date: 'March 2026',
    title: 'Leadership Modules Schedule',
    description: 'Module schedule updates and weekly class expectations for all students.',
    image: '/hero/hero-10.JPG',
  },
  {
    badge: 'Ministry',
    date: 'February 2026',
    title: 'Service & Practicum Opportunities',
    description: 'Practical ministry service opportunities are available through local church teams.',
    image: '/hero/hero-7.png',
  },
  {
    badge: 'Mission',
    date: 'February 2026',
    title: 'Mission Focus Month',
    description: 'Teaching and prayer emphasis to foster missionary interests and concern.',
    image: '/hero/hero-8.JPG',
  },
  {
    badge: 'Mentorship',
    date: 'January 2026',
    title: 'Mentorship Signups',
    description: 'Mentors and ministry supervisors are needed to support new students.',
    image: '/hero/hero-3.JPG',
  },
  {
    badge: 'Update',
    date: 'January 2026',
    title: 'Attendance & Punctuality Reminder',
    description: 'Please arrive on time and keep up with weekly assignments and class participation.',
    image: '/hero/hero-5.png',
  },
];

export default function HopeSchoolNewsSection() {
  return (
    <NewsSection
      kicker="Updates"
      title="Hope School News"
      description="Updates and reminders for Hope School students, volunteers, and leadership."
      items={HOPE_SCHOOL_NEWS}
      backgroundClassName="bg-[#eef4fb]"
    />
  );
}

