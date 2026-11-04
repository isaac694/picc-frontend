'use client';

import SchoolApplicationForm from '@/components/schools/SchoolApplicationForm';
import SchoolIntakeGate from '@/components/schools/SchoolIntakeGate';

const label = 'block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5';
const section = 'text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5';

export default function PICCSecondaryApplicationForm({ inputClass }: { inputClass: string }) {
  return (
    <SchoolApplicationForm
      schoolKey="picc-secondary"
      requiredFields={['firstName', 'lastName', 'gender', 'dateOfBirth', 'previousSchool', 'parentName', 'phone', 'classApplying']}
    >
      <p className={section}>Student Information</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>First Name *</label>
          <input name="firstName" required type="text" placeholder="John" className={inputClass} />
        </div>
        <div>
          <label className={label}>Last Name *</label>
          <input name="lastName" required type="text" placeholder="Doe" className={inputClass} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>Gender *</label>
          <select name="gender" required className={`${inputClass} appearance-none cursor-pointer`} defaultValue="">
            <option value="" disabled>Select</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label className={label}>Date of Birth *</label>
          <input name="dateOfBirth" required type="date" className={inputClass} />
        </div>
      </div>
      <div className="mb-6">
        <label className={label}>Previous School *</label>
        <input name="previousSchool" required type="text" placeholder="Your previous school" className={inputClass} />
      </div>

      <p className={section}>Parent / Guardian Information</p>
      <div className="mb-4">
        <label className={label}>Parent Name *</label>
        <input name="parentName" required type="text" placeholder="Parent/Guardian name" className={inputClass} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" placeholder="parent@email.com" className={inputClass} />
        </div>
        <div>
          <label className={label}>Phone *</label>
          <input name="phone" required type="tel" placeholder="+265 700 000 000" className={inputClass} />
        </div>
      </div>

      <p className={section}>Class applying for</p>
      <div className="mb-2">
        <label className={label}>Choose the class you are applying for *</label>
        <select name="classApplying" required className={`${inputClass} appearance-none cursor-pointer`} defaultValue="Form 1">
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
    </SchoolApplicationForm>
  );
}
