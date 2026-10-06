import { PrismaClient } from '@prisma/client';

const ABOUT_CONTEXT = `
PICC stands for Pentecost International Christian Centre.

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

const globalForPrisma = globalThis as unknown as {
  piccPrisma?: PrismaClient;
};

const prisma =
  globalForPrisma.piccPrisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.piccPrisma = prisma;
}

type KnowledgeItem = {
  type: string;
  title: string;
  content: string;
  relevance: number;
};

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

export async function getPICCContext(question: string): Promise<string> {
  const now = new Date();

  const [
    faqs,
    events,
    services,
    sermons,
  ] = await Promise.all([
    prisma.fAQ.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      take: 100,
    }),

    prisma.event.findMany({
      where: {
        isPublished: true,
        date: {
          gte: now,
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 20,
    }),

    prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),

    prisma.sermon.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 50,
    }),
  ]);

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
        `Date: ${event.date.toLocaleDateString()}`,
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
      service.startTime,
      service.endTime ?? '',
      service.location ?? '',
    ].join(' ');

    items.push({
      type: 'SERVICE',
      title: service.title,
      content: [
        service.description ? `Description: ${service.description}` : '',
        `Day: ${service.dayOfWeek}`,
        `Start: ${service.startTime}`,
        service.endTime ? `End: ${service.endTime}` : '',
        service.location ? `Location: ${service.location}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      relevance: scoreText(question, content),
    });
  }

  for (const sermon of sermons) {
    const content = [
      sermon.title,
      sermon.description ?? '',
      sermon.pastor ?? '',
      sermon.series ?? '',
      sermon.topic ?? '',
    ].join(' ');

    items.push({
      type: 'SERMON',
      title: sermon.title,
      content: [
        sermon.description ? `Description: ${sermon.description}` : '',
        sermon.pastor ? `Pastor: ${sermon.pastor}` : '',
        sermon.series ? `Series: ${sermon.series}` : '',
        sermon.topic ? `Topic: ${sermon.topic}` : '',
        `Date: ${sermon.date.toLocaleDateString()}`,
        sermon.videoUrl ? `Video: ${sermon.videoUrl}` : '',
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
    .map(
      (item) =>
        `[${item.type}] ${item.title}\n${item.content}`
    )
    .join('\n\n---\n\n');
}
