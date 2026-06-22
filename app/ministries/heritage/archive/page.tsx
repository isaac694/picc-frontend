import MinistryArchive from '@/components/MinistryArchive';

const newsItems = [
  {
    badge: 'Update',
    date: 'May 2026',
    title: 'Heritage Kids Community Fair',
    description: 'A joyful day of games, crafts, and family fellowship at the Heritage Ministry community fair.',
    image: '/ministries/heritage/news-1.JPG',
  },
  {
    badge: 'Launch',
    date: 'May 2026',
    title: 'New Heritage Worship Space',
    description: "We celebrated the opening of our refreshed children's worship room and learning zones.",
    image: '/ministries/heritage/news-2.JPG',
  },
  {
    badge: 'Weekly',
    date: 'May 2026',
    title: 'Heritage Kids Midweek Club',
    description: 'Our energetic midweek club continues to help kids grow in faith through music and story time.',
    image: '/ministries/heritage/news-3.JPG',
  },
  {
    badge: 'Highlight',
    date: 'May 2026',
    title: 'Creative Art & Prayer Night',
    description: 'A special evening where children expressed faith through art, worship, and prayer circles.',
    image: '/ministries/heritage/news-4.JPG',
  },
  {
    badge: 'Community',
    date: 'May 2026',
    title: 'Family Outreach Sunday',
    description: 'Heritage families joined together to serve and bless our local neighborhood.',
    image: '/ministries/heritage/news-5.JPG',
  },
  {
    badge: 'Celebration',
    date: 'May 2026',
    title: "Children's Choir Presentation",
    description: 'The Heritage Kids Choir led worship with joyful singing and enthusiastic praise.',
    image: '/ministries/heritage/news-6.JPG',
  },
];

const outreachItems = newsItems.map((item) => ({
  title: item.title,
  date: item.date,
  description: item.description,
  image: item.image,
}));

export default function HeritageArchivePage() {
  return (
    <MinistryArchive
      ministryName="Heritage"
      ministryPath="/ministries/heritage"
      ministryKey="heritage"
      newsItems={newsItems}
      outreachItems={outreachItems}
      archiveCategories={['highlight']}
    />
  );
}
