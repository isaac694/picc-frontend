'use client';

import SchoolApplicationForm from '@/components/schools/SchoolApplicationForm';
import SchoolIntakeGate from '@/components/schools/SchoolIntakeGate';

const label = 'block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5';
const section = 'text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-[#f5e9c8] pb-3 mb-5';

export default function DiscipleshipRegistrationForm({ inputClass }: { inputClass: string }) {
  return (
    <SchoolApplicationForm
      schoolKey="discipleship"
      requiredFields={['firstName', 'lastName', 'gender', 'phone', 'learningLevel']}
      successTitle="Registration received"
    >
      <p className={section}>Personal Information</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>First Name *</label>
          <input name="firstName" required type="text" placeholder="David" className={inputClass} />
        </div>
        <div>
          <label className={label}>Last Name *</label>
          <input name="lastName" required type="text" placeholder="Banda" className={inputClass} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" placeholder="david@email.com" className={inputClass} />
        </div>
        <div>
          <label className={label}>Phone *</label>
          <input name="phone" required type="tel" placeholder="+265 999 000 000" className={inputClass} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={label}>Gender *</label>
          <select name="gender" required className={`${inputClass} appearance-none cursor-pointer`} defaultValue="">
            <option value="" disabled>Select</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label className={label}>Home church / zone</label>
          <input name="homeChurch" type="text" placeholder="e.g. Area 49 zone" className={inputClass} />
        </div>
      </div>

      <p className={section}>Course Preference</p>
      <div className="mb-4">
        <label className={label}>Learning Level *</label>
        <select name="learningLevel" required className={`${inputClass} appearance-none cursor-pointer`} defaultValue="">
          <option value="" disabled>Select your learning level</option>
          <option>Foundation Level</option>
          <option>Growth Level</option>
          <option>Leadership Level</option>
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
    </SchoolApplicationForm>
  );
}
