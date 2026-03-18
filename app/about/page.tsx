'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
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

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-36 md:py-48 text-white rounded-b-[36px] md:rounded-b-[48px]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/about/header.JPG')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/35" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mt-24 md:mt-32">
              <div className="text-xs uppercase tracking-[0.35em] text-white/70 mb-4 flex items-center gap-3">
                <a href="/" className="hover:text-white">Home</a>
                <span className="text-white/50">/</span>
                <a href="/about" className="hover:text-white">About</a>
              </div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">About Our Church</h1>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
              <div className="relative h-[40rem] md:h-[60rem] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/about/tenets-1.JPG"
                  alt="Our church family"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4">
                  THE <span className="text-secondary">PICC</span> TENETS
                  <br />
                  OF <span className="text-secondary">FAITH.</span>
                </h2>
                <div className="space-y-8">
                  {[
                    {
                      title: 'The Bible',
                      description: 'We believe that the entire bible, both Old and New Testaments, are written by the inspiration of the Holy Spirit.(2 Tim 3:16, 17; 2 Peter 1:20, 21).'
                    },
                    {
                      title: 'About God',
                      description: 'As revealed to us by the Bible, we believe in the exis- tence of only one God, who created the universe and is revealed as Triune God the Father, the Son and the Holy Spirit. (Gen 1:1; Mat. 3:16,17; 28:19; 2 Cor. 13:14; Gen 1:26)'
                    },
                    {
                      title: 'The Depraved Nature of Man',
                      description: 'We believe that all men have sinned and come short of the glory of God (Romans 3:23, Gen 3:1-19; 6:23; Mat 13:41, 42), and need Repentance (Acts 2:38; Mat. 4:17; Acts 20:21) and Regeneration. (John 3:3, 5; Titus 3:5)'
                    },
                    {
                      title: 'The Saviour',
                      description: 'We believe mans need of a Saviour has been met in the person of Jesus Christ (Mat. 1:21; John 4:42; Eph. 5:23; Ph. 2:6-11), because of His Deity (Acts 2:36; John 1:1; 20:28; Romans 9:5; Titus 2:13, 14; Isaiah 9:6), Vir- gin Birth (Isaiah 7:14; Mat. 1:18; Luke 1:25-26), Sinless Life (John 8:46; Heb. 4:15; 2 Cor. 5:21), Atoning death (Romans 3:25; Heb. 9:22; 1 John 2:2), Resurrection (Acts 2:36; 10:39, 40; Mat. 28:5-7; Acts 2:24; 1 Cor. 15:3,4) and Ascension (Acts 1:9-11; 2:33-36), His abiding interces- sion (Heb. 7:25; Romans 8:34) and His second coming to judge the living and the dead (Rev. 22:12, 20; 1 Thes. 4:16-18; 2 Tim 4:1; Acts 1:11; 10:42).'
                    },
                    {
                      title: 'Holy Communion',
                      description: 'We believe in the covenant practice of taking the Lords Supper or Holy Communion for all Christians and this should be partaken by all members who are in full fel- lowship (Luke 22:19, 20; Acts 20:7; 1 Cor. 11:23-33).'
                    },
                  ].map((belief, i) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{belief.title}</h3>
                      <p className="text-foreground/70 leading-relaxed">{belief.description}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Join Us */}
        <section className="py-16 md:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4">
                MORE TENETS OF FAITH
                </h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
                <div className="space-y-8">
                  {[
                    {
                      title: 'Water Baptism',
                      description: 'We believe in the sacrament of Baptism by immersion as a testimony of a convert who has attained a respon-sible age of 13 years (Mat. 3:16; Mark 1:9, 10; 16:16; Mat. 28:19; Acts 2:38). Infants and children are not baptized but are dedicated to the Lord (Luke 2:22-24, 34; Mark 10:13-16).'
                    },
                    {
                      title: 'Repentance, Justification and Sanctification',
                      description: 'We believe all men have to repent and confess their sins before God (Acts 2:38; 3:19; 17:30; Luke 5:17) and believe in the vicarious death of Jesus Christ before they can be justified before God (Romans 4:25; 5:1). We believe in the sanctification of the believer through the working of the Holy Spirit (1 Cor. 1:30; 6:11) and Gods gift of eternal life to the believer (Romans 6:23b; John 17:2, 3; 10:27, 28; 1 John 5:11-13).'
                    },
                    {
                      title: 'Holy Communion',
                      description: 'We believe in the covenant practice of taking the Lords Supper or Holy Communion for all Christians and this should be partaken by all members who are in full fel- lowship (Luke 22:19, 20; Acts 20:7; 1 Cor. 11:23-33).'
                    },
                    {
                      title: 'Baptism, Gifts and Fruit of The Holy Spirit',
                      description: 'We believe in the Baptism of the Holy Spirit for all be- lievers with the initial evidence of speaking in tongues (Joel 2:28, 29; Acts 2:3,4,38,39; 10:44-46; 19:1-6); and in the operation of the gifts and fruit of the Holy Spirit (1 Cor. 12:8-11; 28-30; Rom. 12:6-8 and Gal. 5:22,23).'
                    },
                    {
                      title: 'Divine Healing',
                      description: 'We believe that divine healing is biblical and is pro- vided for Gods people in the atonement (Isaiah 53:4,5; Mat. 8:7-13, 16,17; James 5:14-16; Luke 13:10-16; Acts 10:38; Mark 16:17,18).'
                    },
                  ].map((belief, i) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{belief.title}</h3>
                      <p className="text-foreground/70 leading-relaxed">{belief.description}</p>
                    </div>
                  ))}
                </div>
              <div className="relative h-[40rem] md:h-[60rem] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/about/tenets-2.JPG"
                  alt="Worship service"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-20 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">Get Acquianted with Pentecost International Christian Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Target className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Mandate</h3>
                <p className="text-foreground/70">
                  Over the years, our church has been a place of refue and hope for countless individuals seeking meaning and purpose in life
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Core Values</h3>
                <p className="text-foreground/70">
                  To glorify God through passionate worship, loving one another as Christ loves us, and proclaiming the Gospel to all nations.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">Tenets of Faith</h3>
                <p className="text-foreground/70">
                  We believe in the Great Commission to go into all the world and make disciples of all nations, baptizing them in the name of the Holy Spirit.
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-xl text-primary mb-4">The Logo</h3>
                <p className="text-foreground/70">
                  At Pentecost International Christian Center, we operate under a structure designed to facilitate spiritual growth and effective ministry.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Leadership Section */}
        <section className="py-20 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center">Our Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Pastor James Martin', role: 'Senior Pastor', image: '/placeholder-profile.jpg' },
                { name: 'Pastor Sarah Johnson', role: 'Worship Pastor', image: '/placeholder-profile.jpg' },
                { name: 'Pastor Michael Chen', role: 'Community Outreach', image: '/placeholder-profile.jpg' },
              ].map((leader, i) => (
                <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-32 h-32 relative mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-primary mb-1">{leader.name}</h3>
                  <p className="text-foreground/70">{leader.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="py-20 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
              <div className="relative h-[24rem] md:h-[30rem] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/about/other.JPG"
                  alt="About PICC"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
                  The PICC Tenets of Faith.
                </h2>

              </div>
            </div>
          </div>
        </section>

        {/* We Are Family Section */}
        <section className="py-20 md:py-28 bg-background">
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
                        <div key={`${src}-${idx}`} className="relative h-[22rem] md:h-[28rem]">
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
                ‹
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setCurrentSlide((s) => s + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
