import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';
import PICCSecondaryApplicationForm from '@/components/schools/PICCSecondaryApplicationForm';

export const metadata = {
  title: 'PICC Secondary School - Quality Christian Education',
  description: 'Excellence in academic and spiritual development for secondary students',
};

export default function PICCSecondaryPage() {
  const coreValues = [
    'Absolute dependence on God',
    'Discipline',
    'Integrity',
    'Excellence',
    'Diligence',
    'Involvement',
    'Focus',
    'Mentorship',
    'Impactfulness',
  ];

  const importantDates = [
    ['Registration Opens', 'January 15, 2025'],
    ['Application Deadline', 'March 31, 2025'],
    ['Entrance Exams', 'April 12–13, 2025'],
    ['Results Released', 'May 15, 2025'],
    ['School Opens', 'June 2, 2025'],
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
      <section className="relative bg-[#0d1f3c] overflow-hidden py-32 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        {/* Background Image */}
        <Image
          src="/schools/picc-secondary/campus.jpg"
          alt="PICC Secondary Campus"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f3c]/60 via-[#0d1f3c]/40 to-[#0d1f3c]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.18),transparent)] pointer-events-none" />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-[#c9a84c]" />

        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-[#c9a84c] mb-6 overflow-hidden bg-white mx-auto">
          <div className="absolute inset-1.5 rounded-full border border-[#c9a84c]/30 z-10 pointer-events-none" />
          <Image
            src="/schools/picc-secondary/logo.jpg"
            alt="PICC Secondary Logo"
            fill
            className="object-cover"
          />
        </div>

        <p className="relative text-[#c9a84c] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
          Area 49, Lilongwe
        </p>

        <h1 className="relative text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-serif">
          PICC Secondary School
        </h1>

        <div className="flex items-center justify-center gap-3 mb-6 relative">
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
          <span className="block w-1.5 h-1.5 bg-[#c9a84c] rotate-45" />
          <span className="block w-14 h-px bg-[#c9a84c] opacity-60" />
        </div>

        <p className="relative text-white/70 text-lg sm:text-xl italic font-serif max-w-lg mx-auto leading-relaxed mb-10">
          "Equipping Children Today To Become Godly Leaders Tomorrow"
        </p>

        <div className="relative flex flex-wrap gap-3 justify-center">
          <button className="bg-[#c9a84c] text-[#0d1f3c] text-xs font-bold tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#e2c27d] transition-colors duration-200">
            Visit the school's official website
          </button>
         
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className={sectionLabelClass}>Discover Our School</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif mb-6`}>About PICC Secondary School</h2>
          {dividerEl}
          <p className="mt-10 text-slate-600 text-lg leading-relaxed font-serif italic max-w-3xl mx-auto">
            PICC Secondary School is a fast growing private secondary institution established in 2024 with a vision of transforming students that will bring hope to the society through Christ centered education in partnership with parents and community. The school began its academic journey by enrolling its first cohort of Form one students, laying a strong foundation built on academic excellence, discipline and innovation.
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="/schools/picc-secondary/our-mission.jpg"
          alt="Mission Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0d1f3c]/40" />
        
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="bg-white/90 backdrop-blur-sm p-12 shadow-sm border-t-4 border-[#c9a84c]">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-[#c9a84c] text-[#c9a84c] text-2xl mb-6">✦</div>
            <h2 className="text-[#0d1f3c] text-2xl font-bold font-serif mb-6 tracking-wide uppercase">Our Mission</h2>
            <p className="text-slate-600 text-lg leading-relaxed font-serif italic">
              Equipping children today to become Godly leaders tomorrow by providing rigorous academics, 
              Bible based education, discipline unto discipleship and missions mindedness that inspire the next generation.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-12 shadow-sm border-t-4 border-[#c9a84c]">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-[#c9a84c] text-[#c9a84c] text-2xl mb-6">◈</div>
            <h2 className="text-[#0d1f3c] text-2xl font-bold font-serif mb-6 tracking-wide uppercase">Our Vision</h2>
            <p className="text-slate-600 text-lg leading-relaxed font-serif italic">
              Our vision is transformed students that bring hope to the society through Christ centered education 
              in partnership with parents and community.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="relative py-14 px-4 overflow-hidden">
        <Image
          src="/schools/picc-secondary/core-values.png"
          alt="Core Values Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0d1f3c]/60" />

        <div className="relative text-center mb-10">
          <span className={sectionLabelClass}>Our Foundation</span>
          <h2 className={`${sectionTitleClass} text-white font-serif`}>Core Values</h2>
          {dividerEl}
        </div>

        <div className="relative max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#c9a84c]/20">
          {coreValues.map((value, index) => (
            <div key={index} className="group bg-[#0d1f3c]/60 backdrop-blur-sm border-t border-l border-[#c9a84c]/15 p-6 hover:bg-[#1a3360]/80 transition-colors duration-300 flex flex-col items-center text-center">
              <div className="w-10 h-10 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg font-serif">{index + 1}</span>
              </div>
              <h3 className="text-white text-sm font-semibold font-serif mb-2 uppercase tracking-widest">{value}</h3>
              <div className="w-8 h-px bg-[#c9a84c]/30 mt-3 group-hover:w-14 transition-all duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="bg-stone-50 py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Get in Touch</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Contact Us</h2>
          {dividerEl}
        </div>

        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-px bg-slate-200">
          {[
            { icon: '📞', label: 'Phone', lines: ['+265 994 798 236', '+265 998 473 289'] },
            { icon: '✉', label: 'Email', lines: ['info@piccschoolsmw.org'] },
            { icon: '⊕', label: 'Location', lines: ['Pentecost International Christian Centre- PICC Along Kaunda Road, Near Best Oil Filling Station Area 49, Post Office Box 31841 Lilongwe 3 Malawi'] },
          ].map(({ icon, label, lines }) => (
            <div key={label} className="bg-white p-8 text-center">
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
      </section>

      {/* ── ENROLLMENT ── */}
      <section className="bg-white py-20 px-4">
        <div className="text-center mb-14">
          <span className={sectionLabelClass}>Admissions 2025</span>
          <h2 className={`${sectionTitleClass} text-[#0d1f3c] font-serif`}>Enrollment &amp; Registration</h2>
          {dividerEl}
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-20 items-start">
          {/* Key Dates & Information */}
          <div className="space-y-12">
            <div>
              <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase mb-5">
                Key Dates
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
              <h4 className="text-[#0d1f3c] font-serif font-bold mb-3">Admission Process</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Prospective students are required to sit for an entrance examination and attend an interview. Admission is based on academic merit and character assessment.
              </p>
              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Submit completed online application form</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Provide recent academic reports from previous school</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Submit a copy of the student&apos;s Birth Certificate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c9a84c] mt-0.5">✓</span>
                  <span>Pay the non-refundable registration fee</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="border border-slate-200 shadow-sm">
            <div className="bg-[#0d1f3c] border-b-4 border-[#c9a84c] px-8 py-6">
              <h3 className="text-white text-xl font-semibold font-serif">Application Form</h3>
              <p className="text-white/55 text-sm mt-1">Required fields are marked with an asterisk (*)</p>
            </div>

            <PICCSecondaryApplicationForm inputClass={inputClass} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
