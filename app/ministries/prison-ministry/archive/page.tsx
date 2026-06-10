import MinistryArchive from '@/components/MinistryArchive';

const outreachItems = [
  {
    title: 'Christmas Hope Visit',
    date: 'December 24, 2025',
    description: 'A special outreach event providing holiday meals, hygiene kits, and a message of redemption to inmates.',
    image: '/hero/hero-1.jpg',
  },
  {
    title: 'Restoration Workshop',
    date: 'March 15, 2026',
    description: 'A faith-based vocational training session designed to prepare individuals for successful reintegration into society.',
    image: '/hero/hero-2.jpg',
  },
  {
    title: 'Families of the Incarcerated Support',
    date: 'May 20, 2025',
    description: 'A community gathering focused on spiritual and emotional support for families of those currently serving time.',
    image: '/hero/hero-3.jpg',
  },
];

const newsItems = [
  {
    badge: 'Ministry Update',
    date: 'May 10, 2026',
    title: 'Quarterly Outreach Impacts 500+ Inmates',
    description: 'Our latest quarterly visit across regional facilities saw over 500 individuals reached with the Gospel and essential hygiene support.',
    image: '/hero/hero-1.jpg',
  },
  {
    badge: 'Restoration',
    date: 'April 22, 2026',
    title: 'New Discipleship Program Launches',
    description: 'We are excited to announce a new 12-week intensive discipleship curriculum specifically tailored for the incarcerated heart.',
    image: '/hero/hero-2.jpg',
  },
  {
    badge: 'Success Story',
    date: 'March 15, 2026',
    title: 'Testimony of Transformation: A Life Reclaimed',
    description: 'Read the powerful story of a former inmate who is now flourishing as a local community leader and follower of Christ.',
    image: '/hero/hero-store.jpg',
  },
];

export default function PrisonMinistryArchivePage() {
  return (
    <MinistryArchive
      ministryName="Prison Ministry"
      ministryPath="/ministries/prison-ministry"
      ministryKey="prison-ministry"
      newsItems={newsItems}
      outreachItems={outreachItems}
      archiveCategories={['outreach']}
    />
  );
}
