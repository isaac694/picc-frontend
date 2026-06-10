import MinistryArchive from '@/components/MinistryArchive';
import { YOUTH_CHURCH_NEWS_ITEMS, YOUTH_CHURCH_NEWS_KEY } from '@/components/youthChurchNews';

const ministryProjects = [
  { id: 1, type: 'Campus Outreach', title: 'University Mentorship Program', status: 'Ongoing', image: '/ministries/youth-church/img-4.jpg' },
  { id: 2, type: 'Teens Initiative', title: 'High School Faith Clubs', status: 'Active', image: '/ministries/youth-church/img-3.jpg' },
  { id: 3, type: 'CTG Project', title: 'Young Men’s Leadership Workshop', status: 'Active', image: '/ministries/youth-church/img-1.jpg' },
];

const projectItems = ministryProjects.map(p => ({
  title: p.title,
  date: p.status,
  description: p.type,
  image: p.image
}));

export default function YouthChurchArchivePage() {
  return (
    <MinistryArchive
      ministryName="Youth Church"
      ministryPath="/ministries/youth-church-ministry"
      ministryKey="youth-church"
      newsContentKey={YOUTH_CHURCH_NEWS_KEY}
      newsItems={YOUTH_CHURCH_NEWS_ITEMS}
      outreachItems={projectItems}
      archiveCategories={['initiative']}
    />
  );
}
