import MinistryArchive from '@/components/MinistryArchive';

const newsItems = [
  {
    badge: 'Update',
    date: 'May 2026',
    title: 'ICD Connects Community for Healing',
    description: 'A powerful evening of worship and fellowship as ICD continues to deepen its outreach in Lilongwe.',
    image: '/ministries/icd/news-1.JPG',
  },
  {
    badge: 'Launch',
    date: 'May 2026',
    title: 'Hope Tabernacle ICD launch',
    description: 'Celebrating the official launch of Hope Tabernacle within the ICD network of ministries.',
    image: '/ministries/icd/news-2.JPG',
  },
  {
    badge: 'Highlight',
    date: 'May 2026',
    title: 'ICD outreach makes an impact',
    description: 'Stories from the field as ICD teams serve communities with compassion and practical help.',
    image: '/ministries/icd/news-4.JPG',
  },
];

const outreachItems = [
  { title: 'Hospital Visitation Ministry', date: '3 May 2026', description: 'Upcoming Event', image: '/images/icd/ICD-MAY-26.png' },
  { title: 'Hospital Visitation Ministry', date: '17 May 2026', description: 'Upcoming Event', image: '/images/icd/ICD-MAY-26.png' },
  { title: 'Counselling Programs', date: 'Active', description: 'Current Initiative', image: '/moments/2.JPG' },
  { title: 'School of Ministry', date: 'Ongoing', description: 'Training Project', image: '/moments/3.JPG' },
  { title: 'Deliverance Workshops', date: 'Upcoming', description: 'Outreach', image: '/moments/4.JPG' },
];

export default function IcdArchivePage() {
  return (
    <MinistryArchive
      ministryName="ICD"
      ministryPath="/ministries/icd"
      ministryKey="icd"
      newsItems={newsItems}
      outreachItems={outreachItems}
      archiveCategories={['initiative']}
    />
  );
}
