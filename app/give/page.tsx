'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const DEFAULT_GIVING_TYPES = [
  'First Fruit',
  'Sunday Service',
  'Tithe',
  'Project Offering',
  'Thanks Giving',
  "Prophet's Offering",
];

type BankTransferDetails = {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  account_expiration_timestamp?: number;
};

export default function GivePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [bankTransferDetails, setBankTransferDetails] = useState<BankTransferDetails | null>(null);
  const [givingTypes, setGivingTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    currency: 'MWK',
    amount: '',
    fullName: '',
    email: '',
    phone: '',
    phoneCountry: '+265',
    bookletNumber: '',
    givingDate: '',
    givingType: '',
    specialRecipient: '',
    reason: '',
    paymentMethod: 'airtel',
  });

  useEffect(() => {
    const fetchGivingTypes = async () => {
      try {
        const response = await apiFetch('/api/giving-types');
        if (response.ok) {
          const data = await response.json();
          const types = Array.isArray(data) ? data : data.types || [];
          setGivingTypes(types.length > 0 ? types : DEFAULT_GIVING_TYPES);
        } else {
          setGivingTypes(DEFAULT_GIVING_TYPES);
        }
      } catch {
        setGivingTypes(DEFAULT_GIVING_TYPES);
      }
    };
    fetchGivingTypes();
  }, []);

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
  setBankTransferDetails(null);

  if (!formData.amount || !formData.fullName || !formData.phone) {
    setFormError('Please complete the required fields before submitting.');
    return;
  }

  const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) {
    setFormError('Please enter your full name (first and last).');
    return;
  }

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  const normalizedPhone = normalizePaychanguPhone(formData.phoneCountry, formData.phone);

  if (formData.phoneCountry === '+265' && normalizedPhone.length !== 9) {
    setFormError('Please enter a valid Malawi mobile number with 9 digits.');
    return;
  }

  const resolvedReason =
    formData.reason || formData.givingType || 'Giving';

  setIsSubmitting(true);

  try {
    // 1. Save giving record
    const givingResponse = await apiFetch('/api/giving', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookletNumber: formData.bookletNumber,
        givingDate: formData.givingDate,
        givingType: formData.givingType,
        specialRecipient: formData.specialRecipient,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        fullName: formData.fullName,
        email: formData.email,
        phone: normalizedPhone,
        phoneCountry: formData.phoneCountry,
        paymentMethod: formData.paymentMethod,
        reason: resolvedReason,
      }),
    });

    const givingData = await givingResponse.json();

    if (!givingResponse.ok) {
      throw new Error(givingData.error || 'Failed to save giving record');
    }

    // 2. Initialize PayChangu payment
    const paymentResponse = await apiFetch('/api/paychangu/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        email: formData.email,
        firstName,
        lastName,
        phone: normalizedPhone,
        paymentMethod: formData.paymentMethod,
        reason: resolvedReason,
        givingId: givingData.id,
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      const errorMessage =
        typeof paymentData?.error === 'string'
          ? paymentData.error
          : paymentData?.message || JSON.stringify(paymentData?.error) || 'Payment initialization failed.';
      throw new Error(errorMessage);
    }

    if (formData.paymentMethod === 'card' && paymentData?.checkoutUrl) {
      window.location.href = paymentData.checkoutUrl;
      return;
    }

    if (formData.paymentMethod === 'bank') {
      setBankTransferDetails(paymentData?.bankTransfer || null);
      setFormSuccess(
        'Thank you! Your bank transfer account has been generated. Use the details below to complete your giving. You will receive a confirmation email once payment is successful.'
      );
    } else {
      setFormSuccess(
        'Thank you! Your giving request was submitted. Follow the mobile prompt to complete payment. You will receive a confirmation email once payment is successful.'
      );
    }

    // 4. Reset form
    setFormData((prev) => ({
      ...prev,
      currency: 'MWK',
      amount: '',
      fullName: '',
      email: '',
      phone: '',
      phoneCountry: '+265',
      bookletNumber: '',
      givingDate: '',
      givingType: '',
      specialRecipient: '',
      reason: '',
      paymentMethod: 'airtel',
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
              <Link href="/" className="hover:text-foreground">Home</Link>
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
              <div className="rounded-3xl bg-background p-6 sm:p-8 shadow-sm border border-border/60">
                <div className="border-2 border-foreground/30 rounded-2xl p-4 sm:p-8">
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-foreground/20 bg-white shadow-sm">
                      <Image
                        src="/logo.png"
                        alt="PICC logo"
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-foreground/50">
                      Pentecost International Christian Centre
                    </p>
                    <p className="text-xs italic text-foreground/60">
                      Bringing hope to the hopeless and life to the dying
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">Kingdom Investments Records</h3>
                    <p className="text-sm italic text-foreground/60">Honour the Lord with your Substance</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                      <span className="sm:min-w-[110px] text-foreground/70">Booklet No.</span>
                      <input
                        type="text"
                        name="bookletNumber"
                        value={formData.bookletNumber}
                        onChange={handleChange}
                        className="w-full min-w-0 flex-1 border-b border-dashed border-foreground/40 bg-transparent py-1 outline-none"
                        placeholder="..............."
                      />
                    </label>
                    <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                      <span className="sm:min-w-[70px] text-foreground/70">Date</span>
                      <input
                        type="date"
                        name="givingDate"
                        value={formData.givingDate}
                        onChange={handleChange}
                        className="w-full min-w-0 flex-1 border-b border-dashed border-foreground/40 bg-transparent py-1 outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                    <div>
                      <p className="text-sm font-semibold text-foreground/70 mb-3">Tick where appropriate</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {givingTypes.map((label) => (
                          <label key={label} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="givingType"
                              value={label}
                              checked={formData.givingType === label}
                              onChange={handleChange}
                              className="h-4 w-4 border border-foreground/40"
                            />
                            <span className="text-foreground/70">{label}</span>
                          </label>
                        ))}
                      </div>
                      <label className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                        <span className="sm:min-w-[130px] text-foreground/70">Special Recipient</span>
                        <input
                          type="text"
                          name="specialRecipient"
                          value={formData.specialRecipient}
                          onChange={handleChange}
                          className="w-full min-w-0 flex-1 border-b border-dashed border-foreground/40 bg-transparent py-1 outline-none"
                          placeholder="........................"
                        />
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr] items-start sm:items-center gap-3 text-sm min-w-0">
                        <span className="text-foreground/70">Amount</span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                          <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="h-10 w-full sm:w-auto rounded-full border border-border bg-background px-3 text-xs"
                          >
                            <option value="MWK">MWK</option>
                            <option value="USD">USD</option>
                          </select>
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
                            className="h-10 w-full min-w-0 flex-1 rounded-full border border-border bg-background px-3 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm min-w-0">
                        <span className="sm:min-w-[110px] text-foreground/70">Full Names</span>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full min-w-0 flex-1 border-b border-dashed border-foreground/40 bg-transparent py-1 outline-none"
                          placeholder="...................................."
                          required
                        />
                      </label>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                          <span className="sm:min-w-[110px] text-foreground/70">Email</span>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full min-w-0 flex-1 border-b border-dashed border-foreground/40 bg-transparent py-1 outline-none"
                            placeholder="name@email.com"
                          />
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 min-w-0">
                          <select
                            id="phoneCountry"
                            name="phoneCountry"
                            value={formData.phoneCountry}
                            onChange={handleChange}
                            className="h-10 w-full rounded-full border border-border bg-background px-3 text-xs"
                          >
                            <option value="+265">Malawi (+265)</option>
                            <option value="+233">Ghana (+233)</option>
                            <option value="+234">Nigeria (+234)</option>
                            <option value="+254">Kenya (+254)</option>
                            <option value="+255">Tanzania (+255)</option>
                            <option value="+260">Zambia (+260)</option>
                            <option value="+27">South Africa (+27)</option>
                            <option value="+44">United Kingdom (+44)</option>
                            <option value="+1">United States (+1)</option>
                          </select>
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone number"
                            className="h-10 w-full min-w-0 rounded-full border border-border bg-background px-3 text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-background p-6 sm:p-8 shadow-sm border border-border/60">
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
                    <label htmlFor="paymentMethodBank" className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                      <input
                        id="paymentMethodBank"
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={formData.paymentMethod === 'bank'}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-medium text-foreground">Bank Transfer</span>
                    </label>
                    <label htmlFor="paymentMethodCard" className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                      <input
                        id="paymentMethodCard"
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-medium text-foreground">Card Payment</span>
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
                    {isSubmitting ? 'Processing...' : 'Give'}
                  </Button>
                </div>
                {formError && (
                  <p className="mt-4 text-sm text-red-600">{formError}</p>
                )}
                {formSuccess && (
                  <p className="mt-4 text-sm text-green-600">{formSuccess}</p>
                )}
                {bankTransferDetails && (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                    <p className="font-semibold">Bank transfer details</p>
                    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <dt className="text-green-700">Bank</dt>
                        <dd className="font-medium">{bankTransferDetails.bank_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-green-700">Account Name</dt>
                        <dd className="font-medium">{bankTransferDetails.account_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-green-700">Account Number</dt>
                        <dd className="font-medium">{bankTransferDetails.account_number || 'N/A'}</dd>
                      </div>
                      {bankTransferDetails.account_expiration_timestamp && (
                        <div>
                          <dt className="text-green-700">Expires</dt>
                          <dd className="font-medium">
                            {new Date(bankTransferDetails.account_expiration_timestamp * 1000).toLocaleString()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
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
