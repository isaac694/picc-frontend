'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Users } from 'lucide-react';
import { apiUrl } from '@/lib/api';

export default function GivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    currency: 'MWK',
    amount: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountry: '+265',
    address: '',
    country: '',
    reason: '',
    paymentMethod: 'airtel',
    message: '',
  });

  const normalizePaychanguPhone = (countryCode: string, rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (countryCode === '+265') {
      return digits.replace(/^0+/, '');
    }
    return `${countryCode}${digits}`;
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.amount || !formData.firstName || !formData.lastName || !formData.phone) {
      setFormError('Please complete the required fields before submitting.');
      return;
    }

    const normalizedPhone = normalizePaychanguPhone(formData.phoneCountry, formData.phone);
    if (formData.phoneCountry === '+265' && normalizedPhone.length !== 9) {
      setFormError('Please enter a valid Malawi mobile number with 9 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/paychangu/initialize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: normalizedPhone,
          paymentMethod: formData.paymentMethod,
          reason: formData.reason,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string'
            ? data.error
            : data?.message || JSON.stringify(data?.error) || 'Payment initialization failed.';
        throw new Error(errorMessage);
      }

      setFormSuccess('Thank you! Your giving request was submitted. Follow the mobile prompt to complete payment.');
      setFormData((prev) => ({
        ...prev,
        amount: '',
        reason: '',
        message: '',
      }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {/* Header */}
        <section className="bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-6 md:pb-8">
            <div className="text-sm text-foreground/60 flex items-center gap-3">
              <a href="/" className="hover:text-foreground">Home</a>
              <span className="text-foreground/30">›</span>
              <span className="text-foreground/40">Give</span>
            </div>
          </div>
        </section>

        {/* Donate Now */}
        <section className="py-16 sm:py-20 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary mb-12">Give Now</h2>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="rounded-3xl bg-background p-8 shadow-sm border border-border/60">
                <h3 className="text-xl font-semibold text-primary mb-6">Enter Amount</h3>
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="currency" className="text-sm font-medium text-foreground">
                      Currency
                    </label>
                    <select
                      id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                    >
                      <option value="MWK">MWK</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="amount" className="text-sm font-medium text-foreground">
                      Amount
                    </label>
                    <input
                      id="amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="1"
                      step="any"
                      inputMode="decimal"
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-background p-8 shadow-sm border border-border/60">
                <h3 className="text-xl font-semibold text-primary mb-6">Personal Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phoneCountry" className="text-sm font-medium text-foreground">
                        Country Code
                      </label>
                      <select
                        id="phoneCountry"
                        name="phoneCountry"
                        value={formData.phoneCountry}
                        onChange={handleChange}
                        className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                      >
                        <option value="+265">🇲🇼 Malawi (+265)</option>
                        <option value="+233">🇬🇭 Ghana (+233)</option>
                        <option value="+234">🇳🇬 Nigeria (+234)</option>
                        <option value="+254">🇰🇪 Kenya (+254)</option>
                        <option value="+255">🇹🇿 Tanzania (+255)</option>
                        <option value="+260">🇿🇲 Zambia (+260)</option>
                        <option value="+27">🇿🇦 South Africa (+27)</option>
                        <option value="+44">🇬🇧 United Kingdom (+44)</option>
                        <option value="+1">🇺🇸 United States (+1)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phone" className="text-sm font-medium text-foreground">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number"
                        className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="address" className="text-sm font-medium text-foreground">
                      Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Address"
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="country" className="text-sm font-medium text-foreground">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                    >
                      <option value="">Select Country</option>
                      <option value="Malawi">🇲🇼 Malawi</option>
                      <option value="Ghana">🇬🇭 Ghana</option>
                      <option value="Nigeria">🇳🇬 Nigeria</option>
                      <option value="Kenya">🇰🇪 Kenya</option>
                      <option value="Tanzania">🇹🇿 Tanzania</option>
                      <option value="Zambia">🇿🇲 Zambia</option>
                      <option value="South Africa">🇿🇦 South Africa</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom</option>
                      <option value="United States">🇺🇸 United States</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Comment
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write a Comment"
                    className="min-h-[140px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-background p-8 shadow-sm border border-border/60">
                <h3 className="text-xl font-semibold text-primary mb-6">Payment Info</h3>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Payment Method</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label htmlFor="paymentMethodAirtel" className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                      <input
                        id="paymentMethodAirtel"
                        type="radio"
                        name="paymentMethod"
                        value="airtel"
                        checked={formData.paymentMethod === 'airtel'}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-medium text-foreground">Airtel Money</span>
                    </label>
                    <label htmlFor="paymentMethodMpamba" className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                      <input
                        id="paymentMethodMpamba"
                        type="radio"
                        name="paymentMethod"
                        value="mpamba"
                        checked={formData.paymentMethod === 'mpamba'}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-medium text-foreground">Mpamba</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <label htmlFor="reason" className="text-sm font-medium text-foreground">
                    Giving Reason
                  </label>
                  <input
                    id="reason"
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Giving Reason"
                    className="h-12 rounded-full border border-border bg-background px-4 text-sm"
                  />
                </div>
                <div className="mt-6">
                  <Button
                    type="submit"
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Donate Now'}
                  </Button>
                </div>
                {formError && (
                  <p className="mt-4 text-sm text-red-600">{formError}</p>
                )}
                {formSuccess && (
                  <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
                )}
              </div>
            </form>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

