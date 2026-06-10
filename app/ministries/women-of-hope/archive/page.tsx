import MinistryArchive from '@/components/MinistryArchive';

const newsItems = [
  {
    badge: 'Projects',
    date: 'June 2026',
    title: 'Women of Hope Projects Continue to Serve Communities',
    description: 'The ministry continues to champion practical projects that strengthen families and respond to community needs.',
    image: '/ministries/woh/news-1.JPG',
  },
  {
    badge: 'Training',
    date: 'May 2026',
    title: 'Skills Training Initiative Builds Capacity',
    description: 'Women are being equipped with practical skills, encouragement, and discipleship for everyday leadership.',
    image: '/ministries/woh/news-2.JPG',
  },
  {
    badge: 'Outreach',
    date: 'May 2026',
    title: 'Community Outreach Brings Hope and Care',
    description: 'Women of Hope continues to support outreach moments that bring encouragement, prayer, and practical help.',
    image: '/ministries/woh/news-3.JPG',
  },
];

const outreachItems = [
  { title: '500+ Mattress Procurement', date: 'Ongoing', description: 'Current Project', image: '/moments/6.jpg' },
  { title: 'Skills Training Initiative', date: 'Ongoing', description: 'Current Project', image: '/moments/7.jpg' },
  { title: 'Borehole Planting', date: 'Ongoing', description: 'Current Project', image: '/moments/8.jpg' },
  { title: 'Orphanage Establishment', date: 'Upcoming', description: 'Future Project', image: '/moments/9.jpg' },
  { title: 'Bus Procurement', date: 'Upcoming', description: 'Future Project', image: '/hero/hero-2.jpg' },
];

export default function WomenOfHopeArchivePage() {
  return (
    <MinistryArchive
      ministryName="Women of Hope"
      ministryPath="/ministries/women-of-hope"
      ministryKey="women-of-hope"
      newsItems={newsItems}
      outreachItems={outreachItems}
      archiveCategories={['project', 'initiative']}
    />
  );
}
