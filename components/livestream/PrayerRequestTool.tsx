'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const initialPrayerForm = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  bornAgain: '',
  areaOfNeed: '',
  request: '',
};

const inputClass =
  'mt-2 w-full rounded-xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60';

export default function PrayerRequestTool({ ministryKey = 'main' }: { ministryKey?: string }) {
  const [prayerForm, setPrayerForm] = useState(initialPrayerForm);
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);

  const handlePrayerChange =
    (field: keyof typeof prayerForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setPrayerForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handlePrayerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prayerForm.fullName || !prayerForm.request) {
      toast.error('Please complete the required fields before submitting.');
      return;
    }

    setPrayerSubmitting(true);
    try {
      const response = await apiFetch('/api/prayer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministryKey,
          name: prayerForm.fullName,
          email: prayerForm.email || undefined,
          phone: prayerForm.phone || undefined,
          address: prayerForm.address || undefined,
          city: prayerForm.city || undefined,
          state: prayerForm.state || undefined,
          country: prayerForm.country || undefined,
          bornAgain: prayerForm.bornAgain || undefined,
          areaOfNeed: prayerForm.areaOfNeed || undefined,
          request: prayerForm.request,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to submit prayer request.');
      }

      toast.success('Thank you! Your prayer request was submitted.');
      setPrayerForm(initialPrayerForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit prayer request.');
    } finally {
      setPrayerSubmitting(false);
    }
  };

  return (
    <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,#4B7BA7_0%,#2D5A8C_45%,#1E3A5F_100%)] p-6 text-white shadow-sm">
      <h3 className="text-2xl font-semibold mb-2">Prayer Request</h3>
      <p className="text-sm text-white/75 mb-5">
        Send your request and our team will stand with you in prayer.
      </p>

      <form className="space-y-4" onSubmit={handlePrayerSubmit}>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={prayerForm.fullName}
            onChange={handlePrayerChange('fullName')}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              Email
            </label>
            <input
              type="email"
              placeholder="Email Address"
              value={prayerForm.email}
              onChange={handlePrayerChange('email')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              Phone/Mobile
            </label>
            <input
              type="tel"
              placeholder="Mobile Number"
              value={prayerForm.phone}
              onChange={handlePrayerChange('phone')}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              Address
            </label>
            <input
              type="text"
              placeholder="Address"
              value={prayerForm.address}
              onChange={handlePrayerChange('address')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              City
            </label>
            <input
              type="text"
              placeholder="City"
              value={prayerForm.city}
              onChange={handlePrayerChange('city')}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              State
            </label>
            <input
              type="text"
              placeholder="State"
              value={prayerForm.state}
              onChange={handlePrayerChange('state')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/70">
              Country
            </label>
            <input
              type="text"
              placeholder="Country"
              value={prayerForm.country}
              onChange={handlePrayerChange('country')}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Are you born again?
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-sm text-foreground shadow-sm"
              >
                <input
                  type="radio"
                  name="livestreamBornAgain"
                  value={option}
                  required
                  checked={prayerForm.bornAgain === option}
                  onChange={handlePrayerChange('bornAgain')}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Area of Need
          </label>
          <select
            value={prayerForm.areaOfNeed}
            onChange={handlePrayerChange('areaOfNeed')}
            className={inputClass}
            required
          >
            <option value="">Select area of need</option>
            <option value="Spiritual Growth">Spiritual Growth</option>
            <option value="Healing">Healing</option>
            <option value="Financial">Financial</option>
            <option value="Family">Family</option>
            <option value="Marriage">Marriage</option>
            <option value="Children">Children</option>
            <option value="Career/Job">Career/Job</option>
            <option value="Education">Education</option>
            <option value="Relationships">Relationships</option>
            <option value="Deliverance">Deliverance</option>
            <option value="Guidance">Guidance</option>
            <option value="Salvation">Salvation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/70">
            Prayer Request
          </label>
          <textarea
            rows={4}
            placeholder="What would you like us to pray with you about?"
            required
            value={prayerForm.request}
            onChange={handlePrayerChange('request')}
            className={inputClass}
          />
        </div>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={prayerSubmitting}>
          {prayerSubmitting ? 'Sending...' : 'Send My Prayer'}
        </Button>
      </form>
    </div>
  );
}
