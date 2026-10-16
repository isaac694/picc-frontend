import { apiFetch } from '@/lib/api';

const ABOUT_CONTEXT = `
PICC stands for Pentecost International Christian Centre.

PICC was founded by Pastor Esau Banda.

Pastor Esau Banda is the founder of Pentecost International Christian Centre (PICC).

PICC is a Christian church. The PICC website describes its story
as a testament to God's grace and help through the years.

PICC's Tenets of Faith include beliefs concerning:
- The Bible
- God
- The depraved nature of man
- Jesus Christ as Saviour
- Repentance, justification and sanctification
- Water baptism
- Holy Communion
- Baptism, gifts and fruit of the Holy Spirit
- The second coming of Christ and resurrection of the dead
- Giving and Kingdom service
- Divine healing
- Respect for parents and authorities

PICC Core Values include:
- Absolute Dependence on God
- Discipline
- Diligence
- Focus
- Impact
- Mentorship
- Integrity
- Involvement
- Discipleship and Continuous Learning
- Excellence

The PICC website invites people to worship with the church,
including Sunday services and Thursday gatherings.
`;

type KnowledgeItem = {
  type: string;
  title: string;
  content: string;
  relevance: number;
};

type FaqRecord = {
  question: string;
  answer: string;
  isActive?: boolean;
};

type EventRecord = {
  title: string;
  description?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  isPublished?: boolean;
};

type ServiceRecord = {
  title: string;
  description?: string | null;
  dayOfWeek: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  isActive?: boolean;
};

type SermonRecord = {
  title: string;
  description?: string | null;
  pastor?: string | null;
  speaker?: string | null;
  series?: string | null;
  topic?: string | null;
  date: string;
  videoUrl?: string | null;
  youtubeUrl?: string | null;
  audioUrl?: string | null;
  isPublished?: boolean;
};

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await apiFetch(path);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function scoreText(query: string, text: string): number {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length >= 3);

  const searchableText = text.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    if (searchableText.includes(word)) {
      score += 1;
    }
  }

  return score;
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export async function getPICCContext(question: string): Promise<string> {
  const now = new Date();

  const [faqsRaw, eventsPayload, servicesRaw, sermonsPayload] = await Promise.all([
    fetchJson<FaqRecord[]>('/api/faqs'),
    fetchJson<{ events?: EventRecord[] }>('/api/events?take=50'),
    fetchJson<ServiceRecord[]>('/api/services'),
    fetchJson<{ sermons?: SermonRecord[] }>('/api/sermons?take=50'),
  ]);

  const faqs = (Array.isArray(faqsRaw) ? faqsRaw : []).filter(
    (faq) => faq.isActive !== false,
  );

  const events = (eventsPayload?.events ?? []).filter((event) => {
    if (event.isPublished === false) return false;
    return parseDate(event.date) >= now;
  });

  const services = (Array.isArray(servicesRaw) ? servicesRaw : []).filter(
    (service) => service.isActive !== false,
  );

  const sermons = (sermonsPayload?.sermons ?? []).filter(
    (sermon) => sermon.isPublished !== false,
  );

  const items: KnowledgeItem[] = [];

  items.push({
    type: 'ABOUT',
    title: 'About PICC',
    content: ABOUT_CONTEXT,
    relevance: scoreText(question, ABOUT_CONTEXT) + 10,
  });

  for (const faq of faqs) {
    const content = `${faq.question} ${faq.answer}`;

    items.push({
      type: 'FAQ',
      title: faq.question,
      content: faq.answer,
      relevance: scoreText(question, content) + 3,
    });
  }

  for (const event of events) {
    const content = [
      event.title,
      event.description ?? '',
      event.location ?? '',
      event.startTime ?? '',
      event.endTime ?? '',
    ].join(' ');

    items.push({
      type: 'EVENT',
      title: event.title,
      content: [
        event.description ? `Description: ${event.description}` : '',
        `Date: ${parseDate(event.date).toLocaleDateString()}`,
        event.startTime ? `Start: ${event.startTime}` : '',
        event.endTime ? `End: ${event.endTime}` : '',
        event.location ? `Location: ${event.location}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      relevance: scoreText(question, content),
    });
  }

  for (const service of services) {
    const content = [
      service.title,
      service.description ?? '',
      service.dayOfWeek,
      service.startTime ?? '',
      service.endTime ?? '',
      service.location ?? '',
    ].join(' ');

    items.push({
      type: 'SERVICE',
      title: service.title,
      content: [
        service.description ? `Description: ${service.description}` : '',
        `Day: ${service.dayOfWeek}`,
        service.startTime ? `Start: ${service.startTime}` : '',
        service.endTime ? `End: ${service.endTime}` : '',
        service.location ? `Location: ${service.location}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      relevance: scoreText(question, content),
    });
  }

  for (const sermon of sermons) {
    const pastor = sermon.pastor ?? sermon.speaker ?? '';
    const videoUrl = sermon.videoUrl ?? sermon.youtubeUrl ?? '';
    const content = [
      sermon.title,
      sermon.description ?? '',
      pastor,
      sermon.series ?? '',
      sermon.topic ?? '',
    ].join(' ');

    items.push({
      type: 'SERMON',
      title: sermon.title,
      content: [
        sermon.description ? `Description: ${sermon.description}` : '',
        pastor ? `Pastor: ${pastor}` : '',
        sermon.series ? `Series: ${sermon.series}` : '',
        sermon.topic ? `Topic: ${sermon.topic}` : '',
        `Date: ${parseDate(sermon.date).toLocaleDateString()}`,
        videoUrl ? `Video: ${videoUrl}` : '',
        sermon.audioUrl ? `Audio: ${sermon.audioUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      relevance: scoreText(question, content),
    });
  }

  const sortedItems = items
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 15);

  if (sortedItems.length === 0) {
    return 'No relevant PICC database information was found.';
  }

  return sortedItems
    .map((item) => `[${item.type}] ${item.title}\n${item.content}`)
    .join('\n\n---\n\n');
}
