import type { ContentSeed } from '@/lib/content-items';

/** Built-in About page content. Admins can load these into the editor and change them. */

type Entry = { title: string; description: string };

const TENETS: Entry[] = [
                    {
                      title: 'The Bible',
                      description:
                        'We believe that the entire bible, both Old and New Testaments, are written by the inspiration of the Holy Spirit and that the bible is infallible in its declaration, final in its authority, comprehensive and all sufficient in its provisions (2 Tim 3:16, 17; 2 Peter 1:20, 21).',
                    },
                    {
                      title: 'About God',
                      description:
                        'As revealed to us by the Bible, we believe in the existence of only one God, who created the universe and is revealed as Triune God the Father, the Son and the Holy Spirit (Gen 1:1; Mat. 3:16,17; 28:19; 2 Cor. 13:14; Gen 1:26), one in nature, essence and attributes omnipotent (Deut. 6:4; Job 42:2; Rev. 19:6; Isaiah 46:9, 10), omnipresent (Psalm 139:7-12; 147:5), and omniscient (Isaiah 46:9, 10; Job 42:2; Acts 5:4,5).',
                    },
                    {
                      title: 'The Depraved Nature of Man',
                      description:
                        'We believe that all men have sinned and come short of the glory of God (Romans 3:23, Gen 3:1-19; 6:23; Mat 13:41, 42), and need Repentance (Acts 2:38; Mat. 4:17; Acts 20:21) and Regeneration (John 3:3, 5; Titus 3:5).',
                    },
                    {
                      title: 'The Saviour',
                      description:
                        "We believe man's need of a Saviour has been met in the person of Jesus Christ (Mat. 1:21; John 4:42; Eph. 5:23; Ph. 2:6-11), because of His Deity (Acts 2:36; John 1:1; 20:28; Romans 9:5; Titus 2:13, 14; Isaiah 9:6), Virgin Birth (Isaiah 7:14; Mat. 1:18; Luke 1:25-26), Sinless Life (John 8:46; Heb. 4:15; 2 Cor. 5:21), Atoning death (Romans 3:25; Heb. 9:22; 1 John 2:2), Resurrection (Acts 2:36; 10:39, 40; Mat. 28:5-7; Acts 2:24; 1 Cor. 15:3,4) and Ascension (Acts 1:9-11; 2:33-36), His abiding intercession (Heb. 7:25; Romans 8:34) and His second coming to judge the living and the dead (Rev. 22:12, 20; 1 Thes. 4:16-18; 2 Tim 4:1; Acts 1:11; 10:42).",
                    },
                    {
                      title: 'Repentance, Justification and Sanctification',
                      description:
                        "We believe all men have to repent and confess their sins before God (Acts 2:38; 3:19; 17:30; Luke 5:17) and believe in the vicarious death of Jesus Christ before they can be justified before God (Romans 4:25; 5:1). We believe in the sanctification of the believer through the working of the Holy Spirit (1 Cor. 1:30; 6:11) and God's gift of eternal life to the believer (Romans 6:23b; John 17:2, 3; 10:27, 28; 1 John 5:11-13).",
                    },
                    {
                      title: 'Water Baptism',
                      description:
                        'We believe in the sacrament of Baptism by immersion as a testimony of a convert who has attained a responsible age of 13 years (Mat. 3:16; Mark 1:9, 10; 16:16; Mat. 28:19; Acts 2:38). Infants and children are not baptized but are dedicated to the Lord (Luke 2:22-24, 34; Mark 10:13-16).',
                    },
                    {
                      title: 'Holy Communion',
                      description:
                        "We believe in the covenant practice of taking the Lord's Supper or Holy Communion for all Christians and this should be partaken by all members who are in full fellowship (Luke 22:19, 20; Acts 20:7; 1 Cor. 11:23-33).",
                    },
                    {
                      title: 'Baptism, Gifts and Fruit of The Holy Spirit',
                      description:
                        'We believe in the Baptism of the Holy Spirit for all believers with the initial evidence of speaking in tongues (Joel 2:28, 29; Acts 2:3,4,38,39; 10:44-46; 19:1-6); and in the operation of the gifts and fruit of the Holy Spirit (1 Cor. 12:8-11; 28-30; Rom. 12:6-8 and Gal. 5:22,23).',
                    },
                    {
                      title: 'The Second Coming of Christ and the Resurrection of the Dead',
                      description:
                        'We believe in the Second Coming of Christ and Resurrection of the dead, both the saved and the unsaved, those that are saved to the resurrection of life and the unsaved to the Resurrection of damnation (Acts 1:11, 10:42; Mark 13:26; John 5:28, 29; Dan. 12:2; Romans 2:7-11; 6:23).',
                    },
                    {
                      title: 'Giving and Kingdom Service',
                      description:
                        'We believe in tithing and in the giving of offerings, talents and skills towards the cause of promoting the kingdom of God. We believe that God blesses a cheerful giver (Gen. 14:18-20; Exodus 31:1-6; Mal. 3:6-10; Heb. 7:1-4; Mat. 23:23; Acts 20:35; 2 Cor. 9:1-9; 1 Cor. 16:1, 2).',
                    },
                    {
                      title: 'Divine Healing',
                      description:
                        "We believe that divine healing is biblical and is provided for God's people in the atonement (Isaiah 53:4,5; Mat. 8:7-13, 16,17; James 5:14-16; Luke 13:10-16; Acts 10:38; Mark 16:17,18).",
                    },
                    {
                      title: 'Due Respect to Parents and Authorities',
                      description:
                        'We believe that all the children of God should obey laws of the country, obey the government and those in authority and that they should honour their parents and elders (Romans 13:1-5; Ephesians 6:1-3; 1 Peter 2:13-14).',
                    },
                  ];

const CORE_VALUES: Entry[] = [
                  {
                    title: 'Absolute Dependence on God',
                    description:
                      'We maintain that God is big enough to meet all the needs of the ministry and that every divine vision is naturally eligible for divine provision.',
                  },
                  {
                    title: 'Discipline',
                    description:
                      'We value discipline in the conduct of the work of the ministry because it takes discipline to be distinguished. Therefore, both leaders and members shall be expected to place greater value on essentials, order their priorities intelligibly, operate by schedules, function without requiring supervision and make the most of the available time.',
                  },
                  {
                    title: 'Diligence',
                    description:
                      'There is no woman who can give birth to a child without first going through labour. In like manner, we cannot deliver our mandate without going through the labour room of diligence. We shall, therefore, exercise diligence in the pursuit of our divine mandate and the implementation of church programs.',
                  },
                  {
                    title: 'Focus',
                    description:
                      'Focus is an important key for ensuring fruitfulness in ministry. We shall, therefore, remain focused in the pursuit of our heavenly vision.',
                  },
                  {
                    title: 'Impact',
                    description:
                      'In Luke 8:1-3, our Lord Jesus Christ impacted the people spiritually so they ministered to him out of their substance. As such, we shall remain committed to impacting the people spiritually through the consistent preaching of the unadulterated word of hope and life with the demonstration of the Spirit and power. In addition, we shall use the resources at our disposal to provide compassionate service to those in need.',
                  },
                  {
                    title: 'Mentorship',
                    description:
                      'We believe that there are people who have obtained what we are trying to obtain, so we shall make every effort to discover their secrets and engage those secrets in our pursuits. There is no race anyone is running in the world today that someone else does not have a baton for it already.',
                  },
                  {
                    title: 'Integrity',
                    description:
                      'We value integrity; therefore, we shall seek to be above reproach in all our dealings as the people of God inside and outside the Church.',
                  },
                  {
                    title: 'Involvement',
                    description:
                      "We shall encourage and provide opportunity for all members to be involved in the church's ministry based on giftedness, interest and availability and in the community as an expression of our Christian citizenship.",
                  },
                  {
                    title: 'Discipleship and Continuous Learning',
                    description:
                      'Discipleship is the training of believers to be Christ-like. The emphasis is on holiness, righteousness, faithfulness, honesty, sincerity, humanity, prayerfulness and leading disciplined and responsible lives. Discipleship shall be done both at corporate and individual level. In addition, we shall create an environment for continuous learning and production of Christian literature because it takes a studious life to secure a glorious ministry. The ministry shall also have a functional library.',
                  },
                  {
                    title: 'Excellence',
                    description:
                      'We shall seek to honour God who gave His best (the Saviour) by maintaining a high standard of excellence in all our ministries and activities (Colossians 3:23-24).',
                  },
                ];

const YEARLY_THEMES: Array<{ year: number; theme: string }> = [];

export const ABOUT_TENET_SEEDS: ContentSeed[] = TENETS.map((entry) => ({ title: entry.title, body: entry.description }));

export const ABOUT_CORE_VALUE_SEEDS: ContentSeed[] = CORE_VALUES.map((entry) => ({ title: entry.title, body: entry.description }));

/** Splits "Theme - Scripture" into its parts (the scripture is the text after the last dash). */
export function splitThemeText(text: string) {
  const trimmed = text.trim().replace(/[:\s]+$/, '');
  const index = trimmed.lastIndexOf(' - ');
  if (index < 0) return { theme: trimmed, scripture: '' };
  return { theme: trimmed.slice(0, index).trim(), scripture: trimmed.slice(index + 3).trim() };
}

export function yearlyThemeSeeds(entries: Array<{ year: number; theme: string }> = YEARLY_THEMES): ContentSeed[] {
  return [...entries]
    .sort((a, b) => b.year - a.year)
    .map((entry) => {
      const { theme, scripture } = splitThemeText(entry.theme);
      return { title: theme, subtitle: scripture, data: { year: entry.year } };
    });
}
