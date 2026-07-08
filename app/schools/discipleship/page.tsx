import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventsCarousel from '@/components/EventsCarousel';
import DiscipleshipNewsSection from '@/components/schools/DiscipleshipNewsSection';
import { BookOpen, ShieldCheck, Sun, Anchor, Zap, Flame, Gift, Crown } from 'lucide-react';
import Image from 'next/image';
import SchoolIntakeGate from '@/components/schools/SchoolIntakeGate';
import SchoolKeyDatesList from '@/components/schools/SchoolKeyDatesList';
import { apiUrl } from '@/lib/api';

type SchoolInfo = {
  header: string | null;
  motto: string | null;
  about: string | null;
  mission: string | null;
  vision: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  missionImageUrl: string | null;
  coreValuesImageUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lessons: Array<{
    num?: string | null;
    title: string;
    description: string;
  }> | null;
  coreValues: Array<{
    name: string;
    description: string;
  }> | null;
};

const discipleshipFallbackInfo: SchoolInfo = {
  header: 'School of Discipleship',
  motto: 'Rooted in Christ, Growing in Truth, Impacting the World',
  about: null,
  mission:
    'To equip and nurture believers through sound biblical teaching, spiritual formation, and practical dscipleship, empowering them to become mature followers of Jesus Christ who live out the mandate of bringing hope to the hopeless and life to the dying.',
  vision:
    'To raise a generation of deeply rooted, spiritually grounded, and kingdom-minded disciples who reflect the character of Christ and effectively impact their communities and the world.',
  heroImageUrl: '/schools/discipleship/discipleship.jpeg',
  logoImageUrl: '/schools/discipleship/logo.png',
  missionImageUrl: '/schools/discipleship/lessons.jpeg',
  coreValuesImageUrl: '/schools/discipleship/contact.jpeg',
  phone: '+265 999 045 869 / +265 992 603 608',
  email: 'discipleship@piccworldwide.org',
  address:
    'Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi',
  lessons: [
    {
      num: '01',
      title: 'The Nature and Character of God',
      description: 'Exploring the attributes, holiness, and love of our Creator',
    },
    {
      num: '02',
      title: 'The Word of God',
      description: 'The authority, power, and practical application of the Holy Scriptures',
    },
    {
      num: '03',
      title: 'Understanding Faith',
      description: "Building a firm foundation of belief and trust in God's promises",
    },
    {
      num: '04',
      title: 'Understanding Prayer and Fasting',
      description: 'Deepening your spiritual intimacy and power through disciplined seeking',
    },
    {
      num: '05',
      title: 'Understanding Kingdom Giving',
      description: 'Principles of stewardship, generosity, and financial blessing',
    },
    {
      num: '06',
      title: 'Understanding Kingdom',
      description: "Living as citizens of God's realm and under His sovereign rule",
    },
    {
      num: '07',
      title: 'Dedication and Devotion to God',
      description: 'Consecrating your life and heart to the service of the Almighty',
    },
    {
      num: '08',
      title: "The Holy Spirit and His Ministry in the Believer's Life",
      description: "The role and empowerment of the Spirit in the believer's life",
    },
  ],
  coreValues: [
    {
      name: 'Christ-Centered Living',
      description: 'We uphold Jesus Christ as the foundation of our faith and the model for all discipleship.',
    },
    {
      name: 'Biblical Truth',
      description: 'We are committed to teaching and applying the Word of God as the ultimate authority for life and doctrine.',
    },
    {
      name: 'Spiritual Growth',
      description: 'We prioritize continuous growth in faith, character, and intimacy with God.',
    },
    {
      name: 'Prayer and Devotion',
      description: 'We cultivate a lifestyle of prayer, fasting, and total dependence on God.',
    },
    {
      name: 'Faith and Obedience',
      description: "We encourage believers to walk by faith and live in obedience to God's word.",
    },
    {
      name: 'Kingdom Stewardship',
      description: 'We promote faithful giving and responsible stewardship as an expression of worship.',
    },
    {
      name: 'Empowerment by the Holy Spirit',
      description: "We emphasize the role of the Holy Spirit in guiding, empowering, and transforming the believer's life.",
    },
    {
      name: 'Commitment to Discipleship',
      description: 'We are devoted to raising true disciples who disciple others.',
    },
  ],
};

const normalizeLessons = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  const lessons = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const lesson = item as Record<string, unknown>;
      if (typeof lesson.title !== 'string' || typeof lesson.description !== 'string') return null;

      return {
        num: typeof lesson.num === 'string' ? lesson.num : null,
        title: lesson.title,
        description: lesson.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return lessons.length ? lessons : null;
};

const normalizeCoreValues = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  const coreValues = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const coreValue = item as Record<string, unknown>;
      if (typeof coreValue.name !== 'string' || typeof coreValue.description !== 'string') return null;

      return {
        name: coreValue.name,
        description: coreValue.description,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return coreValues.length ? coreValues : null;
};

async function getDiscipleshipInfo(): Promise<SchoolInfo> {
  try {
    const response = await fetch(apiUrl('/api/schools/discipleship/info'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return discipleshipFallbackInfo;
    }

    const data = (await response.json().catch(() => null)) as Partial<SchoolInfo> | null;

    return {
      header: data?.header ?? discipleshipFallbackInfo.header,
      motto: data?.motto ?? discipleshipFallbackInfo.motto,
      about: data?.about ?? discipleshipFallbackInfo.about,
      mission: data?.mission ?? discipleshipFallbackInfo.mission,
      vision: data?.vision ?? discipleshipFallbackInfo.vision,
      heroImageUrl: data?.heroImageUrl ?? discipleshipFallbackInfo.heroImageUrl,
      logoImageUrl: data?.logoImageUrl ?? discipleshipFallbackInfo.logoImageUrl,
      missionImageUrl: data?.missionImageUrl ?? discipleshipFallbackInfo.missionImageUrl,
      coreValuesImageUrl: data?.coreValuesImageUrl ?? discipleshipFallbackInfo.coreValuesImageUrl,
      phone: data?.phone ?? discipleshipFallbackInfo.phone,
      email: data?.email ?? discipleshipFallbackInfo.email,
      address: data?.address ?? discipleshipFallbackInfo.address,
      lessons: normalizeLessons(data?.lessons) ?? discipleshipFallbackInfo.lessons,
      coreValues: normalizeCoreValues(data?.coreValues) ?? discipleshipFallbackInfo.coreValues,
    };
  } catch {
    return discipleshipFallbackInfo;
  }
}

const resolveImageSrc = (value: string | null | undefined, fallback: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

export default async function SchoolOfDiscipleshipPage() {
  const schoolInfo = await getDiscipleshipInfo();
  const lessonIcons = [Sun, BookOpen, ShieldCheck, Flame, Gift, Crown, Anchor, Zap];
  const courses = (schoolInfo.lessons ?? discipleshipFallbackInfo.lessons ?? []).map((course, index) => ({
    ...course,
    icon: lessonIcons[index % lessonIcons.length] || BookOpen,
    num: course.num || String(index + 1).padStart(2, '0'),
  }));
  const coreValues = schoolInfo.coreValues ?? discipleshipFallbackInfo.coreValues ?? [];

  const keyDatesFallback: Array<[string, string]> = [
    ['Registration Starts', 'January 20, 2025'],
    ['Registration Closes', 'February 10, 2025'],
    ['Current Cohort Ends', 'March 3, 2025'],
    ['Next Cohort Starts', '1 week before start'],
  ];



  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 bg-stone-50 text-sm text-[#0d1f3c] outline-none focus:border-[#c9a84c] focus:bg-white focus:ring-2 focus:ring-[#c9a84c]/10 transition-all placeholder:text-slate-300';

  const sectionLabelClass =
    'block text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.25em] uppercase mb-2';

  const sectionTitleClass =
    'text-3xl sm:text-4xl font-bold';

  const dividerEl = (
    <div className="flex items-center justify-center gap-3 mt-4">
      <span className="block w-10 h-px bg-[#c9a84c] opacity-50" />
      <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
      <span className="block w-10 h-px bg-[#c9a84c] opacity-50" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <Navigation />

      {/* ── HERO ── */}
      <section className="relative bg-[#0d1f3c] overflow-hidden py-32 px-4 text-center min-h-[75vh] flex flex-col items-center justify-center">
        {/* Background Image - Increased visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: `url("${resolveImageSrc(schoolInfo.heroImageUrl, discipleshipFallbackInfo.heroImageUrl || '/schools/discipleship/discipleship.jpeg')}")` }}
        />
      
        {/* Lighter Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f3c]/60 via-[#0d1f3c]/40 to-[#0d1f3c]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.1),transparent)] pointer-events-none" />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a84c]" />

        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full border border-[#c9a84c] mb-6 bg-white p-2 shadow-2xl">
          <div className="absolute inset-1.5 rounded-full border border-[#c9a84c]/30" />
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <Image 
              src={resolveImageSrc(schoolInfo.logoImageUrl, discipleshipFallbackInfo.logoImageUrl || '/schools/discipleship/logo.png')} 
              alt="School of Discipleship Logo" 
              fill
              className="object-contain p-2"
            />
          </div>
        </div>

        <p className="relative text-[#c9a84c] text-xs font-semibold tracking-[0.25em] uppercase mb-3 drop-shadow-md">
          Area 49, Lilongwe
        </p>

        <h1 className="relative text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif drop-shadow-lg">
          {schoolInfo.header || discipleshipFallbackInfo.header}
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 relative">
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
          <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
        </div>

        <p className="relative text-white text-lg sm:text-xl italic font-serif max-w-lg mx-auto leading-relaxed mb-10 drop-shadow-md">
          &quot;{schoolInfo.motto || discipleshipFallbackInfo.motto}&quot;
        </p>

        <div className="relative flex flex-wrap gap-3 justify-center">
          <a
            href="#enrollment"
            className="border border-white/60 text-white text-xs font-bold tracking-[0.15em] uppercase px-8 py-3.5 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors duration-200 bg-[#0d1f3c]/40 backdrop-blur-md"
          >
            Register Now
          </a>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="bg-white border-y border-slate-100 py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1px_1fr]">
          <div className="text-center px-8 py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">✦</div>
            <h2 className="text-[#0d1f3c] text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Mission Statement</h2>
            <p className="text-slate-600 text-base leading-relaxed font-serif italic">
              {schoolInfo.mission || discipleshipFallbackInfo.mission}
            </p>
          </div>

          <div className="hidden md:block bg-[#c9a84c]/25 my-4" />

          <div className="text-center px-8 py-6 border-t border-[#c9a84c]/20 md:border-t-0">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">◈</div>
            <h2 className="text-[#0d1f3c] text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Vision Statement</h2>
            <p className="text-slate-600 text-base leading-relaxed font-serif italic">
              {schoolInfo.vision || discipleshipFallbackInfo.vision}
            </p>
          </div>
        </div>
      </section>

      {/* ── LESSONS ── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white">
        {/* Background Image with significantly increased visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat opacity-40 grayscale-[20%]"
          style={{ backgroundImage: `url("${resolveImageSrc(schoolInfo.missionImageUrl, discipleshipFallbackInfo.missionImageUrl || '/schools/discipleship/lessons.jpeg')}")` }}
        />
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-14">
            <span className={sectionLabelClass}>Curriculum</span>
            <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Lessons</h2>
            {dividerEl}
          </div>

          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 shadow-2xl border border-[#c9a84c]/20">
            {courses.map(({ icon: Icon, title, description, num }, index) => (
              <div key={index} className="group bg-white/95 p-8 relative overflow-hidden transition-all duration-500 hover:bg-[#0d1f3c]">
                <span className="absolute top-5 right-6 text-5xl font-bold font-serif text-slate-100 group-hover:text-white/5 transition-colors duration-300 select-none">
                  {num}
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="inline-flex items-center justify-center w-11 h-11 border border-slate-300 group-hover:border-[#c9a84c] text-[#0d1f3c] group-hover:text-[#c9a84c] mb-5 transition-colors duration-300">
                  <Icon size={20} />
                </div>
                <h3 className="text-[#0d1f3c] group-hover:text-white font-semibold font-serif text-base mb-2 transition-colors duration-300">
                  {title}
                </h3>
                <p className="text-slate-500 group-hover:text-white/60 text-sm leading-relaxed transition-colors duration-300">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="bg-[#0d1f3c] py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Our Foundation</span>
          <h2 className={`${sectionTitleClass} text-white font-serif`}>Core Values</h2>
          {dividerEl}
        </div>

        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#c9a84c]/20">
          {coreValues.map(({ name, description }, index) => (
            <div key={index} className="group bg-[#0d1f3c] border-t border-l border-[#c9a84c]/15 p-8 hover:bg-[#1a3360] transition-colors duration-300">
              
              <h3 className="text-white text-lg font-semibold font-serif mb-2">{name}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{description}</p>
              <div className="mt-5 text-[#c9a84c] text-lg opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white">
        {/* Background Image with significantly increased visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat opacity-40 grayscale-[10%]"
          style={{ backgroundImage: `url("${resolveImageSrc(schoolInfo.coreValuesImageUrl, discipleshipFallbackInfo.coreValuesImageUrl || '/schools/discipleship/contact.jpeg')}")` }}
        />
        <div className="absolute inset-0 bg-white/50 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-14">
            <span className={sectionLabelClass}>Inquiries</span>
            <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Contact Discipleship Team</h2>
            {dividerEl}
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-px bg-slate-200 shadow-2xl border border-[#c9a84c]/20">
            {[
              { icon: '📞', label: 'Phone', lines: [schoolInfo.phone || discipleshipFallbackInfo.phone].filter((line): line is string => Boolean(line)) },
              { icon: '✉', label: 'Email', lines: [schoolInfo.email || discipleshipFallbackInfo.email].filter((line): line is string => Boolean(line)) },
              { icon: '⊕', label: 'Location', lines: [schoolInfo.address || discipleshipFallbackInfo.address].filter((line): line is string => Boolean(line)) },
            ].map(({ icon, label, lines }) => (
              <div key={label} className="bg-white/95 p-8 text-center hover:bg-white transition-colors duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-[#c9a84c] text-2xl mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="text-[#0d1f3c] font-semibold font-serif text-base mb-3">{label}</h3>
                {lines.map((line) => (
                  <p key={line} className="text-slate-500 text-sm leading-7">
                    {label === 'Email' ? (
                      <a 
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${line}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-[#c9a84c] transition-colors"
                      >
                        {line}
                      </a>
                    ) : label === 'Phone' ? (
                      <a 
                        href={`https://wa.me/${line.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-[#25D366] transition-colors"
                      >
                        {line}
                      </a>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENROLLMENT ── */}
      <section id="enrollment" className="bg-white py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Enrollment 2025</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Course Registration</h2>
          {dividerEl}
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Enrollment Details column */}
          <div className="space-y-12">
            <div>
              <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase mb-6">
                Upcoming Start Dates
              </p>
              <SchoolKeyDatesList schoolKey="discipleship" fallback={keyDatesFallback} />
            </div>

            <div className="bg-stone-50 p-8 border-l-4 border-[#c9a84c]">
              <h4 className="text-[#0d1f3c] font-serif font-bold mb-3">Registration Process</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Follow these steps to enroll in the School of Discipleship and begin your spiritual growth journey:
              </p>
              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Complete the online registration form on the right</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Confirm your enrollment through the email sent to you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Receive course materials and meeting links</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Join your cohort on the scheduled start date</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form column */}
          <div className="border border-slate-200 shadow-sm">
            <div className="bg-[#0d1f3c] border-b-4 border-[#c9a84c] px-8 py-6">
              <h3 className="text-white text-xl font-semibold font-serif">Registration Form</h3>
              <p className="text-white/55 text-sm mt-1">Required fields are marked with an asterisk (*)</p>
            </div>

            <div className="bg-white px-8 py-8">
              {/* Personal Info */}
              <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
                Personal Information
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">First Name *</label>
                  <input type="text" placeholder="David" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Last Name *</label>
                  <input type="text" placeholder="Kipchoge" className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Email *</label>
                  <input type="email" placeholder="david@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Phone *</label>
                  <input type="tel" placeholder="+254 700 000 000" className={inputClass} />
                </div>
              </div>

              {/* Course Selection */}
              <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
                Course Preference
              </p>
              <div className="mb-4">
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Learning Level *</label>
                <select className={`${inputClass} appearance-none cursor-pointer`}>
                  <option>Select your learning level</option>
                  <option>Foundation Level</option>
                  <option>Growth Level</option>
                  <option>Leadership Level</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Preferred Start Date *</label>
                <select className={`${inputClass} appearance-none cursor-pointer`} disabled>
                  <option>Select an intake below</option>
                </select>
              </div>

              <SchoolIntakeGate
                schoolKey="discipleship"
                inputClass={inputClass}
                selectLabel="Choose intake"
                submitLabel="Register for Course"
              />
              <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
                After registration, we will send you course details, meeting times, and materials list.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EventsCarousel
        apiPath="/api/schools/discipleship/events"
        eventsHref="/schools/discipleship/events"
        eventsLabel="View all class events"
        title="Growth & Equipping Events"
        subtitle="Join our classes and seminars designed to deepen your walk with God"
        connectLabel="FOLLOW CHRIST"
        connectTitle="Moving from faith to spiritual maturity"
        connectSubtitle="Our curriculum is designed to equip you with the tools to live a purposeful and rooted Christian life."
        showLivestream={false}
      />
      <DiscipleshipNewsSection />
      <Footer />
    </div>
  );
}
