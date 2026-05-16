'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { IntakeWindow, isIntakeOpen, upcomingIntakes } from '@/lib/schools/enrollment';
import { useSchoolIntakes } from '@/hooks/use-school-intakes';

type Props = {
  inputClass: string;
  intakes?: IntakeWindow[];
  schoolKey?: string;
};

const REQUIRED_MESSAGE = 'Please fill in all required fields.';

export default function HopeSchoolRegistrationForm({
  inputClass,
  intakes: intakesOverride,
  schoolKey = 'hope-school',
}: Props) {
  const hasOverride = Array.isArray(intakesOverride) && intakesOverride.length > 0;
  const { intakes: fetchedIntakes, isLoading, error } = useSchoolIntakes(schoolKey);
  const intakes = useMemo(
    () => (Array.isArray(intakesOverride) && intakesOverride.length > 0 ? intakesOverride : fetchedIntakes),
    [intakesOverride, fetchedIntakes],
  );
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>(() => intakes[0]?.id || '');

  const openIntakes = useMemo(() => intakes.filter((intake) => isIntakeOpen(intake)), [intakes]);
  const nextIntakes = useMemo(() => upcomingIntakes(intakes), [intakes]);
  const hasOpenIntakes = openIntakes.length > 0;
  const canAcceptApplications = hasOverride ? hasOpenIntakes : !isLoading && !error && hasOpenIntakes;
  const showClosedState = !canAcceptApplications;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAcceptApplications) {
      setStatus({
        type: 'error',
        message:
          !hasOverride && error
            ? 'Unable to load enrollment dates. Please try again later.'
            : 'Applications are currently closed.',
      });
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    const requiredKeys = [
      'firstName',
      'lastName',
      'gender',
      'age',
      'maritalStatus',
      'phone',
      'email',
      'residentialAddress',
      'permanentAddress',
      'village',
      'traditionalAuthority',
      'district',
      'country',
      'piccStatus',
      'denomination',
      'learningMode',
    ];

    const missing = requiredKeys.some((key) => !String(payload[key] ?? '').trim());
    if (missing) {
      setStatus({ type: 'error', message: REQUIRED_MESSAGE });
      return;
    }

    const intakeId = String(payload.intakeId || '').trim();
    const intake = intakes.find((item) => item.id === intakeId) || null;
    if (!intake) {
      setStatus({ type: 'error', message: 'Please select an intake/cohort before submitting.' });
      return;
    }
    if (!isIntakeOpen(intake)) {
      setStatus({ type: 'error', message: 'Applications for the selected intake are closed.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setRegistrationId(null);

    try {
      const response = await apiFetch('/api/hope-school/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus({
          type: 'error',
          message: body?.error || body?.message || 'Unable to submit registration. Please try again.',
        });
        return;
      }

      setRegistrationId(body?.id || null);
      setStatus({ type: 'success', message: 'Registration submitted successfully.' });
      form.reset();
    } catch {
      setStatus({
        type: 'error',
        message: 'Unable to connect. Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-200 shadow-sm bg-white">
      <div className="bg-[#0d1f3c] border-b-4 border-[#c9a84c] px-8 py-6">
        <h3 className="text-white text-xl font-semibold font-serif">Registration Form</h3>
        <p className="text-white/55 text-sm mt-1">Required fields are marked with an asterisk (*)</p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        {status && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <p>{status.message}</p>
            {registrationId && (
              <p className="mt-2 text-xs">
                Registration ID: <span className="font-mono">{registrationId}</span>
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-slate-100 pb-2 mb-4">
            Intake / Cohort
          </p>

          {showClosedState ? (
            <div className="rounded-xl border border-slate-200 bg-stone-50 px-4 py-4 text-sm text-slate-700">
              <p className="font-semibold text-red-600">
                {isLoading ? 'Checking application windows...' : error ? 'Unable to load enrollment dates.' : 'Applications are currently closed.'}
              </p>
              {nextIntakes.length > 0 ? (
                <div className="mt-2">
                  <p className="text-slate-600 text-xs uppercase tracking-[0.12em] font-semibold">Upcoming openings</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {nextIntakes.slice(0, 4).map((item) => (
                      <li key={item.id} className="text-[#0d1f3c]">
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-red-600">Please check back later for the next intake.</p>
              )}
            </div>
          ) : (
            <>
              <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">Select intake *</label>
              <select
                name="intakeId"
                required
                value={selectedIntakeId}
                onChange={(e) => setSelectedIntakeId(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="">Select</option>
                {openIntakes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                type="hidden"
                name="intakeLabel"
                value={openIntakes.find((i) => i.id === selectedIntakeId)?.label || ''}
              />
            </>
          )}
        </div>

        <fieldset disabled={isSubmitting || !canAcceptApplications} aria-disabled={isSubmitting || !canAcceptApplications}>

        {/* Personal Information */}
        <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-slate-100 pb-2 mb-4">
          Personal Details
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              First Name *
            </label>
            <input name="firstName" required type="text" placeholder="First Name" className={inputClass} />
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Last Name *
            </label>
            <input name="lastName" required type="text" placeholder="Last Name" className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Gender *
            </label>
            <select name="gender" required className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Age *
            </label>
            <input name="age" required type="number" min={1} placeholder="Age" className={inputClass} />
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Marital Status *
            </label>
            <select name="maritalStatus" required className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Separated">Separated</option>
              <option value="Divorced">Divorced</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Phone/Mobile *
            </label>
            <input name="phone" required type="tel" placeholder="+265 700 000 000" className={inputClass} />
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Email *
            </label>
            <input name="email" required type="email" placeholder="email@address.com" className={inputClass} />
          </div>
        </div>

        {/* Address Details */}
        <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-slate-100 pb-2 mb-4 mt-6">
          Address Information
        </p>
        <div className="mb-4">
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
            Residential Address *
          </label>
          <input
            name="residentialAddress"
            required
            type="text"
            placeholder="Current neighborhood/area"
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
            Permanent Home Address *
          </label>
          <input
            name="permanentAddress"
            required
            type="text"
            placeholder="Home village address"
            className={inputClass}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Village *
            </label>
            <input name="village" required type="text" placeholder="Village name" className={inputClass} />
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              T/A *
            </label>
            <input
              name="traditionalAuthority"
              required
              type="text"
              placeholder="Traditional Authority"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              District *
            </label>
            <input name="district" required type="text" placeholder="District" className={inputClass} />
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              Country *
            </label>
            <input name="country" required type="text" placeholder="Malawi" className={inputClass} defaultValue="Malawi" />
          </div>
        </div>

        {/* Church and Learning details */}
        <p className="text-[#c9a84c] text-[0.65rem] font-semibold tracking-[0.2em] uppercase border-b border-slate-100 pb-2 mb-4 mt-6">
          Church &amp; Learning
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              PICC Status *
            </label>
            <select name="piccStatus" required className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="">Select Status</option>
              <option value="MEMBER">MEMBER</option>
              <option value="REGULAR ATTENDEE">REGULAR ATTENDEE</option>
              <option value="NEW FOLLOWER">NEW FOLLOWER</option>
            </select>
          </div>
          <div>
            <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
              PICC Service Group
            </label>
            <input
              name="piccServiceGroup"
              type="text"
              placeholder="e.g. Ushering, Choir"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
            Church Denomination *
          </label>
          <input name="denomination" required type="text" placeholder="Your church denomination" className={inputClass} />
        </div>

        <div className="mb-6">
          <label className="block text-[#0d1f3c] text-xs font-medium tracking-wide mb-1.5">
            Preferred Mode of Learning *
          </label>
          <select name="learningMode" required className={`${inputClass} appearance-none cursor-pointer`}>
            <option value="">Select Mode of Learning</option>
            <option value="Face to Face">Face to Face</option>
            <option value="Online">Online</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !canAcceptApplications}
          className="w-full mt-8 bg-[#0d1f3c] hover:bg-[#1a3360] disabled:opacity-60 disabled:hover:bg-[#0d1f3c] text-white text-xs font-bold tracking-[0.2em] uppercase py-4 transition-colors duration-200 border-b-2 border-[#c9a84c]"
        >
          {isSubmitting ? 'Submitting...' : canAcceptApplications ? 'Submit Registration' : 'Applications Closed'}
        </button>
        <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
          We will contact you shortly to confirm your registration and provide further details.
        </p>
        </fieldset>
      </form>
    </div>
  );
}
