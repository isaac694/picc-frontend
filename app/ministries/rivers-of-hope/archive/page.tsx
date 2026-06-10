import MinistryArchive from '@/components/MinistryArchive';

const outreachItems = [
  {
    title: 'Mzuzu Outreach Mobilization',
    date: 'Active',
    description: 'Crusade Preparation',
    image: '/hero/hero-1.jpg',
  },
  {
    title: 'Pastors Empowerment Manuals',
    date: 'Ongoing',
    description: 'Leadership Training',
    image: '/hero/hero-2.jpg',
  },
  {
    title: 'University Fellowship Networks',
    date: 'Active',
    description: 'Campus Discipleship',
    image: '/images/youth-church/img-4.jpg',
  },
  {
    title: 'Secondary School Scripture Union Support',
    date: 'Ongoing',
    description: 'Youth Mentorship',
    image: '/images/youth-church/img-3.jpg',
  },
  {
    title: 'Post-Crusade Discipleship Centers',
    date: 'Planning',
    description: 'Community Impact',
    image: '/hero/hero-store.jpg',
  },
];

export default function RiversOfHopeArchivePage() {
  return (
    <MinistryArchive
      ministryName="Rivers of Hope"
      ministryPath="/ministries/rivers-of-hope"
      ministryKey="rivers-of-hope"
      outreachItems={outreachItems}
      archiveCategories={['program', 'highlight', 'initiative']}
    />
  );
}
