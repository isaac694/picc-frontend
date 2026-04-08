'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { apiUrl } from '@/lib/api';

export default function AboutPage() {
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const familySlides = [
    ['/moments/1.jpg', '/moments/2.jpg', '/moments/3.jpg'],
    ['/moments/4.jpg', '/moments/5.jpg', '/moments/6.jpg'],
    ['/moments/7.jpg', '/moments/8.jpg', '/moments/9.jpg'],
  ];
  const extendedSlides = [
    familySlides[familySlides.length - 1],
    ...familySlides,
    familySlides[0],
  ];
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideTransition, setSlideTransition] = useState(true);
  const [openTenet, setOpenTenet] = useState<number | null>(0);
  const [openCoreValue, setOpenCoreValue] = useState<number | null>(0);
  const [showAllThemes, setShowAllThemes] = useState(false);

  useEffect(() => {
    const imageKeys = [
      'about-header-bg',
      'about-tenets-image',
      'about-core-values-image',
      'about-themes-bg',
      'about-worship-image',
    ];

    const fetchImages = async () => {
      const entries = await Promise.all(
        imageKeys.map(async (key) => {
          try {
            const response = await fetch(apiUrl(`/api/site-content/${key}`));
            if (!response.ok) return [key, ''] as const;
            const data = await response.json();
            const imageUrl = data.imageUrl
              ? data.imageUrl.startsWith('http')
                ? data.imageUrl
                : apiUrl(data.imageUrl)
              : '';
            return [key, imageUrl] as const;
          } catch (error) {
            return [key, ''] as const;
          }
        })
      );

      setPageImages(Object.fromEntries(entries));
    };

    fetchImages();
  }, []);

  const resolveImage = (key: string, fallback: string) => pageImages[key] || fallback;

  const yearlyThemes = [
    { year: 2010, theme: 'Theme to be updated' },
    { year: 2011, theme: 'Theme to be updated' },
    { year: 2012, theme: 'Theme to be updated' },
    { year: 2013, theme: 'Theme to be updated' },
    { year: 2014, theme: 'Theme to be updated' },
    { year: 2015, theme: 'Theme to be updated' },
    { year: 2016, theme: 'Theme to be updated' },
    { year: 2017, theme: 'Theme to be updated' },
    { year: 2018, theme: 'Theme to be updated' },
    { year: 2019, theme: 'Theme to be updated' },
    { year: 2020, theme: 'Theme to be updated' },
    { year: 2021, theme: 'Theme to be updated' },
    { year: 2022, theme: 'Theme to be updated' },
    { year: 2023, theme: 'Theme to be updated' },
    { year: 2024, theme: 'Theme to be updated' },
    { year: 2025, theme: 'Theme to be updated' },
    { year: 2026, theme: 'The year of the hand of God - Ezekiel 37:1-10' },
  ];
  const currentYear = new Date().getFullYear();
  const currentYearTheme = yearlyThemes.find((entry) => entry.year === currentYear);
  const otherYearThemes = yearlyThemes.filter((entry) => entry.year !== currentYear);

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${resolveImage('about-header-bg', '/about/header.JPG')})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-24 md:mt-32">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="text-white/50">/</span>
                <Link href="/about" className="hover:text-white">About</Link>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">About Our Church</h1>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 sm:py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
              <div className="relative h-[26rem] sm:h-[34rem] md:h-[50rem] lg:h-[60rem] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src={resolveImage('about-tenets-image', '/about/tenets-1.JPG')}
                  alt="Our church family"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="h-[26rem] sm:h-[34rem] md:h-[50rem] lg:h-[60rem] flex flex-col">
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4">
                  THE <span className="text-secondary">PICC</span> TENETS
                  <br />
                  OF <span className="text-secondary">FAITH.</span>
                </h2>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {[
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
                  ].map((belief, i) => {
                    const isOpen = openTenet === i;
                    return (
                      <div
                        key={belief.title}
                        className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenTenet(isOpen ? null : i)}
                          className="w-full flex items-center justify-between gap-4 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="text-lg font-semibold text-foreground">
                            {belief.title}
                          </span>
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 text-primary text-xl leading-none"
                            aria-hidden="true"
                          >
                            {isOpen ? '-' : '+'}
                          </span>
                        </button>
                        {isOpen && (
                          <p className="mt-3 text-foreground/70 leading-relaxed">
                            {belief.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                Our Foundation
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
                PICC Core Values
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
              <div className="space-y-4">
                {[
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
                ].map((value, i) => {
                  const isOpen = openCoreValue === i;
                  return (
                    <div
                      key={value.title}
                      className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenCoreValue(isOpen ? null : i)}
                        className="w-full flex items-center justify-between gap-4 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="text-lg font-semibold text-foreground">
                          {value.title}
                        </span>
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 text-primary text-xl leading-none"
                          aria-hidden="true"
                        >
                            {isOpen ? '-' : '+'}
                        </span>
                      </button>
                      {isOpen && (
                        <p className="mt-3 text-foreground/70 leading-relaxed">
                          {value.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="relative h-[26rem] sm:h-[34rem] md:h-[50rem] lg:h-[60rem] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src={resolveImage('about-core-values-image', '/about/core-values.JPG')}
                  alt="PICC core values"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Watch Our Story */}
        <section className="py-16 sm:py-20 md:py-24 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/80">
              Our 28th Anniversary Documentary
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold mt-4">Watch Our Story</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mt-4">
              The story of Pentecost International Christian Center is a testament to
              God&apos;s grace and help through the years.
            </p>

            <div className="mt-12">
              <div className="relative w-full overflow-hidden rounded-[28px] shadow-2xl bg-black/90 aspect-[16/9] md:aspect-[21/9]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/IloZ7uo2UYY"
                  title="PICC 28th Anniversary Documentary"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="mt-12 flex justify-end">
              <p className="text-4xl md:text-6xl font-semibold text-primary-foreground/35 text-right">
              Know more about the church.
              </p>
            </div>
          </div>
        </section>

        {/* Yearly Themes Archive */}
        <section className="relative py-16 sm:py-20 md:py-24">
          <div className="absolute inset-0">
            <Image
              src={resolveImage('about-themes-bg', '/about/themes.jpeg')}
              alt="PICC yearly themes"
              fill
              className="object-cover object-[center_30%]"
            />
          </div>
          <div
            className={
              showAllThemes
                ? 'absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/70'
                : 'absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55'
            }
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <div className="mb-12">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-3">
                Since 2010
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold mb-3">
                PICC Yearly Themes
              </h2>
              <p className="text-white/80 max-w-2xl">
                A living archive of the themes God has given our church over the years.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentYearTheme && (
                <div
                  key={currentYearTheme.year}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-[72px] text-center rounded-xl bg-white/15 text-white font-semibold py-3 border border-white/20">
                      {currentYearTheme.year}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2">
                        Yearly Theme
                      </p>
                      <h3 className="text-lg md:text-xl font-semibold text-white">
                        {currentYearTheme.theme}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {showAllThemes &&
                otherYearThemes.map((entry) => (
                  <div
                    key={entry.year}
                    className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-[72px] text-center rounded-xl bg-white/15 text-white font-semibold py-3 border border-white/20">
                        {entry.year}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2">
                          Yearly Theme
                        </p>
                        <h3 className="text-lg md:text-xl font-semibold text-white">
                          {entry.theme}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowAllThemes((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition-colors hover:bg-white/20"
              >
                {showAllThemes
                  ? 'Hide themes from other years'
                  : 'View themes from other years'}
              </button>
            </div>
          </div>
        </section>

        {/* Worship With Us */}
        <section className="pt-24 md:pt-32 pb-10 md:pb-12 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <p className="text-3xl md:text-5xl text-primary/15 font-semibold mb-4">
              we love and celebrate you!
            </p>
            <div className="overflow-hidden rounded-[36px] bg-primary text-primary-foreground shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
                <div className="relative min-h-[18rem] sm:min-h-[22rem] md:min-h-[32rem] lg:min-h-[36rem]">
                  <Image
                    src={resolveImage('about-worship-image', '/about/worship-with-us.jpg')}
                    alt="Worship with us"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="px-6 py-12 sm:px-10 sm:py-16 md:px-14 md:py-20 text-center flex flex-col justify-center h-full">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-4">Worship With Us</h2>
                  <p className="text-primary-foreground/85 mb-8 leading-relaxed">
                    Join us every Sunday in any of our services and every Thursday for an
                    uplifting time in God&apos;s presence.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/#see-you-in-church-home"
                      className="px-6 py-3 rounded-full border border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                    >
                      View This Week&apos;s Schedule
                    </Link>
                    <Link
                      href="/locations"
                      className="px-6 py-3 rounded-full border border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                    >
                      Locate a Church
                    </Link>
                    <Link
                      href="/livestream"
                      className="px-6 py-3 rounded-full border border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                    >
                      Attend Service Online
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* We Are Family Section */}
        <section className="pt-12 md:pt-16 pb-20 md:pb-28 bg-background">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">We Are Family</h2>
              <p className="text-foreground/70 mt-2">Snapshots of life together.</p>
            </div>

            <div className="relative overflow-hidden w-full">
              <div
                className={slideTransition ? 'flex transition-transform duration-600' : 'flex'}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                onTransitionEnd={() => {
                  if (currentSlide === 0) {
                    setSlideTransition(false);
                    setCurrentSlide(familySlides.length);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  } else if (currentSlide === extendedSlides.length - 1) {
                    setSlideTransition(false);
                    setCurrentSlide(1);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setSlideTransition(true));
                    });
                  }
                }}
              >
                {extendedSlides.map((slide, slideIndex) => (
                  <div key={slideIndex} className="min-w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {slide.map((src, idx) => (
                        <div key={`${src}-${idx}`} className="relative h-[16rem] sm:h-[20rem] md:h-[28rem]">
                          <Image
                            src={src}
                            alt="We are family moment"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => setCurrentSlide((s) => s - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary"
              >
                {'<'}
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setCurrentSlide((s) => s + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary"
              >
                {'>'}
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

