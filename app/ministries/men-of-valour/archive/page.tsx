import MinistryArchive from '@/components/MinistryArchive';
import { MEN_OF_VALOUR_NEWS_ITEMS, MEN_OF_VALOUR_NEWS_KEY } from '@/components/menOfValourNews';

const ministryProjects = [
  {
    title: 'Widows Support Program',
    date: 'Monthly - Area 49',
    description: 'Providing food hampers, spiritual encouragement, and basic necessities to widows in our community.',
    image: '/ministries/men-of-valour/mov-1.jpg',
    location: 'Lilongwe'
  },
  {
    title: 'Youth Mentorship Initiative',
    date: 'Quarterly',
    description: 'Men of Valour partnering with the Youth Church to provide professional and spiritual mentorship to young men.',
    image: '/ministries/men-of-valour/mov-2.jpg',
    location: 'Camp of God'
  },
  {
    title: 'Hospital Visitation',
    date: 'Every 2nd Saturday',
    description: 'Praying for the sick and providing relief items to patients in local hospitals.',
    image: '/ministries/men-of-valour/mov-3.jpg',
    location: 'Kamuzu Central Hospital'
  },
];

export default function MenOfValourArchivePage() {
  return (
    <MinistryArchive
      ministryName="Men of Valour"
      ministryPath="/ministries/men-of-valour"
      ministryKey="men-of-valour"
      newsContentKey={MEN_OF_VALOUR_NEWS_KEY}
      newsItems={MEN_OF_VALOUR_NEWS_ITEMS}
      outreachItems={ministryProjects}
      archiveCategories={['initiative']}
    />
  );
}
