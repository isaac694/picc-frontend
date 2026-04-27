'use client';

import SchoolIntakeGate from '@/components/schools/SchoolIntakeGate';

export default function PICCSecondaryApplicationForm({ inputClass }: { inputClass: string }) {
  return (
    <div className="bg-white px-8 py-8">
      {/* Student Info */}
      <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
        Student Information
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">First Name *</label>
          <input type="text" placeholder="John" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Last Name *</label>
          <input type="text" placeholder="Doe" className={inputClass} />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Date of Birth *</label>
        <input type="date" className={inputClass} />
      </div>
      <div className="mb-6">
        <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Previous School *</label>
        <input type="text" placeholder="Your previous school" className={inputClass} />
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
          <input type="tel" placeholder="+265 700 000 000" className={inputClass} />
        </div>
      </div>

      {/* Academic Track */}
      <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5">
        Class applying for
      </p>
      <div className="mb-2">
        <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Choose the class you are applying for *</label>
        <select className={`${inputClass} appearance-none cursor-pointer`}>
          <option>Form 1</option>
          <option>Form 2</option>
          <option>Form 3</option>
          <option>Form 4</option>
        </select>
      </div>

      <SchoolIntakeGate
        schoolKey="picc-secondary"
        inputClass={inputClass}
        selectLabel="Select intake/term"
        submitLabel="Submit Application"
      />

      <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
        After submission, we will send you a confirmation email with details about entrance exams and next steps.
      </p>
    </div>
  );
}

