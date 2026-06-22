import MinistryArchive from '@/components/MinistryArchive';
import { WAILING_WOMAN_NEWS_ITEMS, WAILING_WOMAN_NEWS_KEY } from '@/components/wailingWomanNews';

const projectItems = [
  {
    title: 'Community Outreach 1',
    date: 'June 2026',
    description: 'Outreach to local communities, offering support and prayer.',
    location: 'Lilongwe, Malawi',
    image: '/ministries/wailing-woman/outreach-1.jpg',
  },
  {
    title: 'Community Outreach 2',
    date: 'July 2026',
    description: 'Prayer and practical help for families in need.',
    location: 'Lilongwe, Malawi',
    image: '/ministries/wailing-woman/outreach-2.jpg',
  },
];

export default function WailingWomanArchivePage() {
  return (
    <MinistryArchive
      ministryName="Wailing Woman"
      ministryPath="/ministries/wailing-woman"
      ministryKey="wailing-woman"
      newsContentKey={WAILING_WOMAN_NEWS_KEY}
      newsItems={WAILING_WOMAN_NEWS_ITEMS}
      outreachItems={projectItems}
      archiveCategories={['highlight', 'material']}
    />
  );
}
