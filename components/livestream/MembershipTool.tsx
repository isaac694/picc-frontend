'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { sendMembershipNotification } from '@/lib/email';

const EMPTY_FORM = { fullName: '', gender: '', email: '', phone: '', dateOfBirth: '', city: '', country: 'Malawi' };

const inputClass =
  'mt-2 w-full rounded-xl border border-white/15 bg-white/90 px-4 py-3 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60';
const labelClass = 'text-xs uppercase tracking-[0.2em] text-white/70';

export default function MembershipTool({ source = 'livestream' }: { source?: string }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const change = (field: keyof typeof EMPTY_FORM) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName || !form.gender || !form.email || !form.phone || !form.city || !form.country) {
      toast.error('Please complete the required fields before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await sendMembershipNotification({
        churchEmail: 'info@piccworldwide.org',
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        source,
      });
      toast.success('Thank you! Your membership form was submitted.');
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit membership form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-white">
      <h3 className="mb-2 text-lg font-semibold">Become a member</h3>
      <p className="mb-5 text-white/70">If you made a decision today, we would love to connect with you.</p>
      <form className="grid gap-4" onSubmit={submit}>
        <div>
          <label className={labelClass} htmlFor="member-name">Full Name</label>
          <input id="member-name" type="text" placeholder="Full Name" required value={form.fullName} onChange={change('fullName')} className={inputClass} />
        </div>
        <fieldset>
          <legend className={labelClass}>Gender</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {['Male', 'Female'].map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/90 px-3 py-2 text-sm text-black shadow-sm">
                <input type="radio" name="member-gender" value={option} required checked={form.gender === option} onChange={change('gender')} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="member-email">Email</label>
            <input id="member-email" type="email" placeholder="Email Address" required value={form.email} onChange={change('email')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="member-phone">Phone/Mobile</label>
            <input id="member-phone" type="tel" placeholder="Mobile Number" required value={form.phone} onChange={change('phone')} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="member-dob">Date of birth (optional)</label>
          <input id="member-dob" type="date" value={form.dateOfBirth} onChange={change('dateOfBirth')} className={inputClass} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="member-city">City/District</label>
            <input id="member-city" type="text" placeholder="City/District" required value={form.city} onChange={change('city')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="member-country">Country</label>
            <input id="member-country" type="text" placeholder="Country" required value={form.country} onChange={change('country')} className={inputClass} />
          </div>
        </div>
        <Button className="w-full bg-white text-black hover:bg-white/90" disabled={submitting}>
          {submitting ? 'Sending...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}
