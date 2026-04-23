import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Users, Heart, Smile, Book, Music, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Hope School Ministry - Children\'s Faith Development',
  description: 'Nurturing young hearts and minds in a Christ-centered community',
};

export default function HopeSchoolPage() {
  const activities = [
    {
      icon: Book,
      title: 'Bible Stories & Lessons',
      description: 'Age-appropriate biblical teaching and spiritual formation',
      num: '01',
    },
    {
      icon: Music,
      title: 'Worship & Music',
      description: 'Engaging songs, worship activities, and creative expression',
      num: '02',
    },
    {
      icon: Heart,
      title: 'Values Development',
      description: 'Building character, kindness, integrity, and Christian virtues',
      num: '03',
    },
    {
      icon: Users,
      title: 'Community Projects',
      description: 'Service learning and outreach to help others in need',
      num: '04',
    },
    {
      icon: Smile,
      title: 'Fun & Games',
      description: 'Interactive games and activities that reinforce learning',
      num: '05',
    },
    {
      icon: Trophy,
      title: 'Recognition & Awards',
      description: 'Celebrating growth, effort, and spiritual development',
      num: '06',
    },
  ];

  const ageGroups = [
    {
      name: 'Tiny Explorers',
      description: 'Introduction to Jesus and basic Bible stories',
      level: 'Ages 3-5',
    },
    {
      name: 'Young Believers',
      description: 'Bible foundations and early character development',
      level: 'Ages 6-8',
    },
    {
      name: 'Growing Disciples',
      description: 'Deeper faith understanding and service opportunities',
      level: 'Ages 9-12',
    },
  ];

  const importantDates = [
    ['Registration Deadline', 'April 30, 2025'],
    ['Term 1 Starts', 'May 4, 2025'],
    ['Term 1 Ends', 'July 27, 2025'],
    ['Term 2 Registration', 'August 17, 2025'],
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
      <section className="relative bg-[#0d1f3c] overflow-hidden py-28 px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.18),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a84c]" />

        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border border-[#c9a84c] mb-6">
          <div className="absolute inset-1.5 rounded-full border border-[#c9a84c]/30" />
          <Smile size={32} className="text-[#c9a84c]" />
        </div>

        <p className="relative text-[#c9a84c] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
          Nurturing Faith — Nairobi, Kenya
        </p>

        <h1 className="relative text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif">
          Hope School Ministry
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 relative">
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
          <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
        </div>

        <p className="relative text-white/70 text-lg sm:text-xl italic font-serif max-w-lg mx-auto leading-relaxed mb-10">
          Where children discover faith, make friends, and grow in God&apos;s love
        </p>

        <div className="relative flex flex-wrap gap-3 justify-center">
          <button className="bg-[#c9a84c] text-[#0d1f3c] text-xs font-bold tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#e2c27d] transition-colors duration-200">
            Join Us This Sunday
          </button>
          <Link href="/services">
            <button className="border border-white/40 text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors duration-200">
              Service Times
            </button>
          </Link>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="bg-[#0d1f3c] border-t border-[#c9a84c]/20 py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1px_1fr]">
          <div className="text-center px-8 py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">✦</div>
            <h2 className="text-[#c9a84c] text-lg font-semibold font-serif mb-4 tracking-wide">Our Mission</h2>
            <p className="text-white/65 text-base leading-relaxed font-serif italic">
              To provide a vibrant, welcoming community where children can experience God&apos;s love through 
              engaging lessons, creative activities, and meaningful friendships.
            </p>
          </div>

          <div className="hidden md:block bg-[#c9a84c]/25 my-4" />

          <div className="text-center px-8 py-6 border-t border-[#c9a84c]/20 md:border-t-0">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c9a84c] text-[#c9a84c] text-xl mb-5">◈</div>
            <h2 className="text-[#c9a84c] text-lg font-semibold font-serif mb-4 tracking-wide">Our Vision</h2>
            <p className="text-white/65 text-base leading-relaxed font-serif italic">
              That every child is valued, loved, and encouraged to grow in their personal relationship 
              with Jesus Christ, becoming a light in their generation.
            </p>
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ── */}
      <section className="bg-stone-50 py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>What We Do</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>The Hope School Experience</h2>
          {dividerEl}
        </div>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200">
          {activities.map(({ icon: Icon, title, description, num }, index) => (
            <div key={index} className="group bg-white p-8 relative overflow-hidden transition-colors duration-300 hover:bg-[#0d1f3c]">
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
      </section>

      {/* ── AGE GROUPS ── */}
      <section className="bg-[#0d1f3c] py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Programs</span>
          <h2 className={`${sectionTitleClass} text-white font-serif`}>Age Groups</h2>
          {dividerEl}
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-px bg-[#c9a84c]/20">
          {ageGroups.map(({ name, description, level }, index) => (
            <div key={index} className="group bg-[#0d1f3c] border-t border-l border-[#c9a84c]/15 p-8 hover:bg-[#1a3360] transition-colors duration-300">
              <span className="inline-block text-[#0d1f3c] bg-[#c9a84c] text-[0.6rem] font-bold tracking-[0.15em] uppercase px-3 py-1 mb-4">
                {level}
              </span>
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
      <section className="bg-stone-50 py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Get in Touch</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Contact Hope School</h2>
          {dividerEl}
        </div>

        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-px bg-slate-200">
          {[
            { icon: '📞', label: 'Phone', lines: ['+254 700 456 789', '(Sunday Mornings)'] },
            { icon: '✉', label: 'Email', lines: ['hopeschool@church.ke', 'kids@church.ke'] },
            { icon: '⊕', label: 'Location', lines: ['PICC Main Church', 'Sunday Services'] },
          ].map(({ icon, label, lines }) => (
            <div key={label} className="bg-white p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 border border-[#c9a84c] text-2xl mx-auto mb-4">
                {icon}
              </div>
              <h3 className="text-[#0d1f3c] font-semibold font-serif text-base mb-3">{label}</h3>
              {lines.map((line) => (
                <p key={line} className="text-slate-500 text-sm leading-7">{line}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── ENROLLMENT ── */}
      <section className="bg-white py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Registration 2025</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Child Enrollment</h2>
          {dividerEl}
        </div>

        {/* Key Dates */}
        <div className="max-w-2xl mx-auto mb-16">
          <p className="text-center text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase mb-5">
            Important Dates
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

        {/* Form */}
        <div className="max-w-2xl mx-auto border border-slate-200">
          <div className="bg-[#0d1f3c] border-b-4 border-[#c9a84c] px-8 py-6">
            <h3 className="text-white text-xl font-semibold font-serif">Registration Form</h3>
            <p className="text-white/55 text-sm mt-1">Required fields are marked with an asterisk (*)</p>
          </div>

          <div className="bg-white px-8 py-8">
            {/* Child Info */}
            <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
              Child Information
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">First Name *</label>
                <input type="text" placeholder="Sarah" className={inputClass} />
              </div>
              <div>
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Last Name *</label>
                <input type="text" placeholder="Kipchoge" className={inputClass} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Date of Birth *</label>
              <input type="date" className={inputClass} />
            </div>
            <div className="mb-6">
              <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Age Group *</label>
              <select className={`${inputClass} appearance-none cursor-pointer`}>
                <option>Select age group</option>
                <option>Tiny Explorers (3-5)</option>
                <option>Young Believers (6-8)</option>
                <option>Growing Disciples (9-12)</option>
              </select>
            </div>

            {/* Parent Info */}
            <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
              Parent / Guardian Information
            </p>
            <div className="mb-4">
              <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Parent Name *</label>
              <input type="text" placeholder="Parent/Guardian name" className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Email *</label>
                <input type="email" placeholder="parent@email.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Phone *</label>
                <input type="tel" placeholder="+254 700 000 000" className={inputClass} />
              </div>
            </div>

            <button className="w-full mt-8 bg-[#0d1f3c] hover:bg-[#1a3360] text-white text-xs font-bold tracking-[0.2em] uppercase py-4 transition-colors duration-200 border-b-2 border-[#c9a84c]">
              Register My Child
            </button>
            <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
              We will contact you shortly to confirm registration and answer any questions you may have.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
