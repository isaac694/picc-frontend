import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventsCarousel from '@/components/EventsCarousel';
import HopeSchoolNewsSection from '@/components/schools/HopeSchoolNewsSection';
import HopeSchoolRegistrationForm from '@/components/schools/HopeSchoolRegistrationForm';
import SchoolKeyDatesList from '@/components/schools/SchoolKeyDatesList';
import { apiUrl } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Building2, Compass, Crown, GraduationCap, Lightbulb, LogIn, Mail, MapPin, Phone, Sparkles, Target, UserPlus, Users } from 'lucide-react';

export const metadata = {
  title: 'Hope School - Leadership Training & Ministry Equipping',
  description: 'Leadership training and practical equipping for effective Christian service',
};

type SchoolInfo = {
  header: string | null;
  motto: string | null;
  about: string | null;
  mission: string | null;
  vision: string | null;
  heroImageUrl: string | null;
  logoImageUrl: string | null;
  missionImageUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

const hopeSchoolFallbackInfo: SchoolInfo = {
  header: 'Hope School of Ministry',
  motto: 'Raising a New Generation of Leaders with Global Influence',
  about: `Hope School exists to equip believers with leadership training, practical ministry skills, and a heart for mission.

To provide general leadership training in preparing future leaders for life, citizenship, and active Christian service.
To provide training and practical experience for believers who desire to be equipped for effective service to Christ and in their local churches.
To provide relevant instruction to believers in their fields of ministry that will enable them to gain skills and abilities necessary for effective ministry.
To foster missionary interests and concern.`,
  mission:
    'To provide leadership training and practical ministry equipping for believers who desire to serve Christ effectively in their local churches and communities.',
  vision:
    'To raise future leaders prepared for life, citizenship, and active Christian service, carrying vision, character, and missionary concern.',
  heroImageUrl: '/schools/hope-school/hosom.jpeg',
  logoImageUrl: '/schools/hope-school/logo.png',
  missionImageUrl: '/schools/hope-school/modules.jpeg',
  phone: '+265 999 045 869 / +265 992 603 608',
  email: 'info@piccworldwide.org / hopeschool@piccworldwide.org',
  address:
    'Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi',
};

async function getHopeSchoolInfo(): Promise<SchoolInfo> {
  try {
    const response = await fetch(apiUrl('/api/schools/hope-school/info'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return hopeSchoolFallbackInfo;
    }

    const data = (await response.json().catch(() => null)) as Partial<SchoolInfo> | null;

    return {
      header: data?.header ?? hopeSchoolFallbackInfo.header,
      motto: data?.motto ?? hopeSchoolFallbackInfo.motto,
      about: data?.about ?? hopeSchoolFallbackInfo.about,
      mission: data?.mission ?? hopeSchoolFallbackInfo.mission,
      vision: data?.vision ?? hopeSchoolFallbackInfo.vision,
      heroImageUrl: data?.heroImageUrl ?? hopeSchoolFallbackInfo.heroImageUrl,
      logoImageUrl: data?.logoImageUrl ?? hopeSchoolFallbackInfo.logoImageUrl,
      missionImageUrl: data?.missionImageUrl ?? hopeSchoolFallbackInfo.missionImageUrl,
      phone: data?.phone ?? hopeSchoolFallbackInfo.phone,
      email: data?.email ?? hopeSchoolFallbackInfo.email,
      address: data?.address ?? hopeSchoolFallbackInfo.address,
    };
  } catch {
    return hopeSchoolFallbackInfo;
  }
}

const splitLines = (value: string | null) =>
  (value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const splitContactValue = (value: string | null) =>
  (value || '')
    .split(/\r?\n|\/+/)
    .map((line) => line.trim())
    .filter(Boolean);

const resolveImageSrc = (value: string | null | undefined, fallback: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  return trimmed;
};

export default async function HopeSchoolPage() {
  const schoolInfo = await getHopeSchoolInfo();
  const aboutLines = splitLines(schoolInfo.about);
  const fallbackAboutLines = splitLines(hopeSchoolFallbackInfo.about);
  const introText = aboutLines[0] || fallbackAboutLines[0] || '';
  const aims = aboutLines.length > 1 ? aboutLines.slice(1) : fallbackAboutLines.slice(1);
  const phoneLines = splitContactValue(schoolInfo.phone);
  const emailLines = splitContactValue(schoolInfo.email);
  const addressLines = splitContactValue(schoolInfo.address);

  const modules = [
    {
      icon: Crown,
      title: 'Principles of success in leadership',
      description: 'Foundational principles that shape healthy leadership and long-term impact.',
      num: '01',
    },
    {
      icon: Users,
      title: 'The making of a leader',
      description: 'How leaders are formed through calling, process, and faithful stewardship.',
      num: '02',
    },
    {
      icon: Target,
      title: 'The character of a leader',
      description: 'Integrity, humility, and consistency-the inner life that sustains ministry.',
      num: '03',
    },
    {
      icon: Building2,
      title: 'The family of a leader',
      description: 'Building a strong home and healthy relationships while serving faithfully.',
      num: '04',
    },
    {
      icon: Compass,
      title: 'The spiritual life of a leader',
      description: 'Prayer, the Word, and devotion as the source of strength and direction.',
      num: '05',
    },
    {
      icon: Lightbulb,
      title: 'Principles and power of vision',
      description: 'Developing, communicating, and pursuing God-given vision with clarity.',
      num: '06',
    },
    {
      icon: GraduationCap,
      title: 'Maximizing your potential',
      description: 'Discovering gifts and developing skills for excellence in service.',
      num: '07',
    },
    {
      icon: Crown,
      title: 'Work ethic of a leader',
      description: 'Discipline, diligence, and consistency in ministry responsibilities.',
      num: '08',
    },
    {
      icon: Compass,
      title: 'How God speaks',
      description: 'Hearing and obeying God through Scripture, the Spirit, and wisdom.',
      num: '09',
    },
    {
      icon: Users,
      title: 'Loyalty in Ministry',
      description: 'Faithfulness, honor, and unity-serving with a loyal spirit.',
      num: '10',
    },
    {
      icon: Building2,
      title: 'How to start a church from scratch',
      description: 'Practical steps for church planting and building a healthy ministry foundation.',
      num: '11',
    },
    {
      icon: BookOpen,
      title: 'The Holy Spirit',
      description: 'Understanding the Spirit\'s work, empowerment, and guidance in ministry.',
      num: '12',
    },
    {
      icon: GraduationCap,
      title: 'Ladders of excellence in Ministry',
      description: 'Growing through levels of maturity, responsibility, and proven faithfulness.',
      num: '13',
    },
    {
      icon: Lightbulb,
      title: 'Understanding Kingdom giving',
      description: 'Stewardship, generosity, and faith principles for Kingdom advancement.',
      num: '14',
    },
    {
      icon: Building2,
      title: 'Church Administration and Management',
      description: 'Systems, teams, and governance that support healthy ministry operations.',
      num: '15',
    },
    {
      icon: Target,
      title: 'Principles of Kingdom Service',
      description: 'Serving with humility, purpose, and excellence as a Kingdom steward.',
      num: '16',
    },
    {
      icon: Compass,
      title: 'Principles and Practices of Evangelism',
      description: 'Practical tools and biblical foundations for winning and discipling souls.',
      num: '17',
    },
    {
      icon: BookOpen,
      title: 'The Power ministry',
      description: 'Walking in faith for signs, wonders, and compassionate ministry to people.',
      num: '18',
    },
    {
      icon: GraduationCap,
      title: 'The preacher and his preaching',
      description: 'Preparing messages, preaching with clarity, and growing as a communicator.',
      num: '19',
    },
    {
      icon: Lightbulb,
      title: 'Laws of Church Growth',
      description: 'Principles that help ministries grow healthily and sustainably over time.',
      num: '20',
    },
  ];

  const keyDatesFallback: Array<[string, string]> = [
    ['Registration Opens', 'March 15, 2025'],
    ['Registration Deadline', 'April 30, 2025'],
    ['Cohort 1 Starts', 'May 4, 2025'],
    ['Cohort 1 Ends', 'July 27, 2025'],
    ['Cohort 2 Registration', 'August 17, 2025'],
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

      <section className="relative bg-[#0d1f3c] overflow-hidden py-48 px-4 text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={resolveImageSrc(schoolInfo.heroImageUrl, hopeSchoolFallbackInfo.heroImageUrl || '/schools/hope-school/hosom.jpeg')}
            alt="Hope School Background"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f3c]/60 via-[#0d1f3c]/40 to-[#0d1f3c]/70" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.18),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a84c] z-10" />

        <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full border border-[#c9a84c] mb-6 bg-white/10 backdrop-blur-sm p-4">
          <div className="absolute inset-1.5 rounded-full border border-[#c9a84c]/30" />
          <Image
            src={resolveImageSrc(schoolInfo.logoImageUrl, hopeSchoolFallbackInfo.logoImageUrl || '/schools/hope-school/logo.png')}
            alt="Hope School Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        <p className="relative z-10 text-[#c9a84c] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
          Area 49, Lilongwe
        </p>

        <h1 className="relative z-10 text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif">
          {schoolInfo.header || hopeSchoolFallbackInfo.header}
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
          <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
        </div>

        <p className="relative z-10 text-white/70 text-lg sm:text-xl italic font-serif max-w-lg mx-auto leading-relaxed mb-10">
          &quot;{schoolInfo.motto || hopeSchoolFallbackInfo.motto}&quot;
        </p>

        <div className="relative z-10 flex flex-wrap gap-3 justify-center">
          <a href="#enrollment">
            <button className="bg-[#c9a84c] text-[#0d1f3c] text-xs font-bold tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#e2c27d] transition-colors duration-200">
              Enroll Now
            </button>
          </a>
        </div>
      </section>

      <section className="bg-stone-50 py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Purpose</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Aims</h2>
          {dividerEl}
          <p className="mt-5 text-slate-600 text-base leading-relaxed font-serif max-w-3xl mx-auto">
            {introText}
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-100 bg-white shadow-sm p-8 sm:p-10">
          <ul className="grid gap-4 text-slate-700 text-sm sm:text-base leading-relaxed">
            {aims.map((aim) => (
              <li key={aim} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 rotate-45 bg-[#c9a84c] shrink-0" />
                <span>{aim}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#0d1f3c] py-24 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1px_1fr]">
          <div className="text-center px-8 py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">
              <Sparkles size={18} />
            </div>
            <h2 className="text-white text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Our Mission</h2>
            <p className="text-white/70 text-base leading-relaxed font-serif italic">
              {schoolInfo.mission || hopeSchoolFallbackInfo.mission}
            </p>
          </div>

          <div className="hidden md:block bg-[#c9a84c]/20 my-4" />

          <div className="text-center px-8 py-6 border-t border-[#c9a84c]/10 md:border-t-0">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">
              <Compass size={18} />
            </div>
            <h2 className="text-white text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Our Vision</h2>
            <p className="text-white/70 text-base leading-relaxed font-serif italic">
              {schoolInfo.vision || hopeSchoolFallbackInfo.vision}
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-12 px-4 overflow-hidden">
        <Image
          src={resolveImageSrc(schoolInfo.missionImageUrl, hopeSchoolFallbackInfo.missionImageUrl || '/schools/hope-school/modules.jpeg')}
          alt="Modules Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0d1f3c]/40" />

        <div className="relative text-center mb-8">
          <span className={sectionLabelClass}>Curriculum</span>
          <h2 className={`${sectionTitleClass} text-white font-serif`}>Modules</h2>
          {dividerEl}
          <p className="mt-5 text-white/90 text-base leading-relaxed font-serif max-w-3xl mx-auto">
            A practical leadership and ministry curriculum designed to develop skills, character, and spiritual strength.
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#c9a84c]/20">
          {modules.map(({ icon: Icon, title, description, num }, index) => (
            <div key={index} className="group bg-[#0d1f3c]/40 backdrop-blur-sm p-5 relative overflow-hidden transition-colors duration-300 hover:bg-[#1a3360]/60">
              <span className="absolute top-4 right-5 text-5xl font-bold font-serif text-white/5 group-hover:text-white/10 transition-colors duration-300 select-none">
                {num}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <div className="inline-flex items-center justify-center w-10 h-10 border border-[#c9a84c]/30 group-hover:border-[#c9a84c] text-[#c9a84c] mb-4 transition-colors duration-300">
                <Icon size={18} />
              </div>
              <h3 className="text-white font-semibold font-serif text-sm mb-1.5 transition-colors duration-300">
                {title}
              </h3>
              <p className="text-white/80 text-xs leading-relaxed transition-colors duration-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 py-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <span className={sectionLabelClass}>Online Learning</span>
            <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Join Hope School Online Classes</h2>
            <div className="flex items-center gap-3 mt-4 mb-6">
              <span className="block w-10 h-px bg-[#c9a84c] opacity-50" />
              <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
              <span className="block w-10 h-px bg-[#c9a84c] opacity-50" />
            </div>
            <p className="text-slate-600 text-base leading-relaxed font-serif max-w-xl">
              Access online classes, register as a new learner, or log in to continue with your Hope School coursework.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/schools/hope-school/online-classes?mode=register"
              className="group border border-[#c9a84c]/40 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-[#c9a84c] hover:shadow-md"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-[#c9a84c] text-[#c9a84c] transition-colors group-hover:bg-[#c9a84c] group-hover:text-[#0d1f3c]">
                <UserPlus size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0d1f3c]">Register</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create your online class access and begin the enrollment flow.
              </p>
              <span className="mt-6 inline-flex text-xs font-bold uppercase tracking-[0.15em] text-[#0d1f3c]">
                Start registration
              </span>
            </Link>

            <Link
              href="/schools/hope-school/online-classes?mode=login"
              className="group border border-[#0d1f3c]/15 bg-[#0d1f3c] p-7 shadow-sm transition-all hover:-translate-y-1 hover:bg-[#17345f] hover:shadow-md"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-[#c9a84c] text-[#c9a84c] transition-colors group-hover:bg-[#c9a84c] group-hover:text-[#0d1f3c]">
                <LogIn size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Login</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Return to your online class dashboard and learning materials.
              </p>
              <span className="mt-6 inline-flex text-xs font-bold uppercase tracking-[0.15em] text-[#c9a84c]">
                Continue learning
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Get in Touch</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Contact Hope School of Ministry</h2>
          {dividerEl}
        </div>

        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-px bg-slate-100">
          {[
            { icon: Phone, label: 'Phone', lines: phoneLines.length > 0 ? phoneLines : splitContactValue(hopeSchoolFallbackInfo.phone) },
            { icon: Mail, label: 'Email', lines: emailLines.length > 0 ? emailLines : splitContactValue(hopeSchoolFallbackInfo.email) },
            { icon: MapPin, label: 'Location', lines: addressLines.length > 0 ? addressLines : splitContactValue(hopeSchoolFallbackInfo.address) },
          ].map(({ icon: Icon, label, lines }) => (
            <div key={label} className="bg-stone-50 p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 border border-[#c9a84c] text-2xl mx-auto mb-4">
                <Icon size={22} />
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
      </section>

      <section id="enrollment" className="bg-[#eef4fb] py-24 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Registration 2025</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Enrollment</h2>
          {dividerEl}
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-12">
            <div>
              <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase mb-6">
                Important Dates
              </p>
              <SchoolKeyDatesList schoolKey="hope-school" fallback={keyDatesFallback} />
            </div>

            <div className="bg-white p-8 border-l-4 border-[#c9a84c] shadow-sm">
              <h4 className="text-[#0d1f3c] font-serif font-bold mb-3">Registration Process</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                To join Hope School Ministry, please follow these simple steps to ensure your registration is processed correctly:
              </p>
              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">+</span>
                  <span>Complete the online registration form on the right</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">+</span>
                  <span>Receive a confirmation email with your registration ID</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">+</span>
                  <span>Attend the orientation session on the start date</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">+</span>
                  <span>Join our vibrant community of learners and believers</span>
                </li>
              </ul>
            </div>
          </div>

          <HopeSchoolRegistrationForm inputClass={inputClass} schoolKey="hope-school" />
        </div>
      </section>

      <EventsCarousel
        apiPath="/api/schools/hope-school/events"
        eventsHref="/schools/hope-school/events"
        eventsLabel="View all school events"
        title="Hope School Events"
        subtitle="Stay updated with our latest school activities and academic calendar"
        connectLabel="HOPE SCHOOL"
        connectTitle="Building a brighter future for every student"
        connectSubtitle="Join us in our journey of excellence and faith based education."
        showLivestream={false}
      />
      <HopeSchoolNewsSection />
      <Footer />
    </div>
  );
}
