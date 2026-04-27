'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EventsCarousel from '@/components/EventsCarousel';
import DiscipleshipNewsSection from '@/components/schools/DiscipleshipNewsSection';
import { BookOpen, ShieldCheck, Sun, Anchor, Zap, Flame, Gift, Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import SchoolIntakeGate from '@/components/schools/SchoolIntakeGate';

export default function SchoolOfDiscipleshipPage() {
  const enrollmentRef = useRef<HTMLElement>(null);

  const scrollToEnrollment = () => {
    enrollmentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const courses = [
    {
      icon: Sun,
      title: 'The Nature and Character of God',
      description: 'Exploring the attributes, holiness, and love of our Creator',
      num: '01',
    },
    {
      icon: BookOpen,
      title: 'The Word of God',
      description: 'The authority, power, and practical application of the Holy Scriptures',
      num: '02',
    },
    {
      icon: ShieldCheck,
      title: 'Understanding Faith',
      description: 'Building a firm foundation of belief and trust in God\'s promises',
      num: '03',
    },
    {
      icon: Flame,
      title: 'Understanding Prayer and Fasting',
      description: 'Deepening your spiritual intimacy and power through disciplined seeking',
      num: '04',
    },
    {
      icon: Gift,
      title: 'Understanding Kingdom Giving',
      description: 'Principles of stewardship, generosity, and financial blessing',
      num: '05',
    },
    {
      icon: Crown,
      title: 'Understanding Kingdom',
      description: 'Living as citizens of God\'s realm and under His sovereign rule',
      num: '06',
    },
    {
      icon: Anchor,
      title: 'Dedication and Devotion to God',
      description: 'Consecrating your life and heart to the service of the Almighty',
      num: '07',
    },
    {
      icon: Zap,
      title: 'The Holy Spirit and His Ministry in the Believer\'s Life',
      description: 'The role and empowerment of the Spirit in the believer\'s life',
      num: '08',
    },
  ];

  const coreValues = [
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
      description: 'We encourage believers to walk by faith and live in obedience to God\'s word.',
      
    },
    {
      name: 'Kingdom Stewardship',
      description: 'We promote faithful giving and responsible stewardship as an expression of worship.',
    },
    {
      name: 'Empowerment by the Holy Spirit',
      description: 'We emphasize the role of the Holy Spirit in guiding, empowering, and transforming the believer\'s life.',
      
    },
    {
      name: 'Commitment to Discipleship',
      description: 'We are devoted to raising true disciples who disciple others.',
      
    },
  ];

  const importantDates = [
    ['Foundation Level Starts', 'January 20, 2025'],
    ['Growth Level Starts', 'February 10, 2025'],
    ['Leadership Level Starts', 'March 3, 2025'],
    ['Enrollment Deadline', '1 week before start'],
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
          style={{ backgroundImage: 'url("/schools/discipleship/discipleship.jpeg")' }}
        />
      
        {/* Lighter Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f3c]/60 via-[#0d1f3c]/40 to-[#0d1f3c]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.1),transparent)] pointer-events-none" />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a84c]" />

        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full border border-[#c9a84c] mb-6 bg-white p-2 shadow-2xl">
          <div className="absolute inset-1.5 rounded-full border border-[#c9a84c]/30" />
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <Image 
              src="/schools/discipleship/logo.png" 
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
          School of Discipleship
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 relative">
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
          <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
        </div>

        <p className="relative text-white text-lg sm:text-xl italic font-serif max-w-lg mx-auto leading-relaxed mb-10 drop-shadow-md">
          &quot;Rooted in Christ, Growing in Truth, Impacting the World&quot;
        </p>

        <div className="relative flex flex-wrap gap-3 justify-center">
          <button 
            onClick={scrollToEnrollment}
            className="border border-white/60 text-white text-xs font-bold tracking-[0.15em] uppercase px-8 py-3.5 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors duration-200 bg-[#0d1f3c]/40 backdrop-blur-md"
          >
            Register Now
          </button>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="bg-white border-y border-slate-100 py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1px_1fr]">
          <div className="text-center px-8 py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">✦</div>
            <h2 className="text-[#0d1f3c] text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Mission Statement</h2>
            <p className="text-slate-600 text-base leading-relaxed font-serif italic">
              To equip and nurture believers through sound biblical teaching, spiritual formation, and practical dscipleship, empowering them to become mature followers of Jesus Christ who live out the mandate of bringing hope to the hopeless and life to the dying.
            </p>
          </div>

          <div className="hidden md:block bg-[#c9a84c]/25 my-4" />

          <div className="text-center px-8 py-6 border-t border-[#c9a84c]/20 md:border-t-0">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">◈</div>
            <h2 className="text-[#0d1f3c] text-lg font-semibold font-serif mb-4 tracking-wide uppercase">Vision Statement</h2>
            <p className="text-slate-600 text-base leading-relaxed font-serif italic">
              To raise a generation of deeply rooted, spiritually grounded, and kingdom-minded disciples who reflect the character of Christ and effectively impact their communities and the world.
            </p>
          </div>
        </div>
      </section>

      {/* ── LESSONS ── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white">
        {/* Background Image with significantly increased visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat opacity-40 grayscale-[20%]"
          style={{ backgroundImage: 'url("/schools/discipleship/lessons.jpeg")' }}
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
          style={{ backgroundImage: 'url("/schools/discipleship/contact.jpeg")' }}
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
              { icon: '📞', label: 'Phone', lines: ['+265 999 045 869', '+265 992 603 608'] },
              { icon: '✉', label: 'Email', lines: ['discipleship@piccworldwide.org'] },
              { icon: '⊕', label: 'Location', lines: ['Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi'] },
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
      <section ref={enrollmentRef} className="bg-white py-20 px-4">
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
              <div className="border-t border-slate-100">
                {importantDates.map(([label, date]) => (
                  <div key={label} className="flex justify-between items-center py-4 px-2 border-b border-slate-100 gap-4">
                    <span className="text-[#0d1f3c] font-medium text-sm">{label}</span>
                    <span className="text-[0.7rem] font-semibold tracking-wide text-[#0d1f3c] bg-[#f5e9c8] border border-[#c9a84c] px-3 py-1 whitespace-nowrap">
                      {date}
                    </span>
                  </div>
                ))}
              </div>
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
        apiPath="/api/events?take=12&scope=discipleship"
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
