import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { apiUrl } from '@/lib/api';
import { sendGivingNotification, sendTestimonyNotification } from '@/lib/email';

const NOTEPAD_STORAGE_KEY = 'picc-livestream-notepad';
const LEGACY_NOTEPAD_STORAGE_KEY = 'livestream-notepad-content';

export function useNotepad() {
  const [notepadContent, setNotepadContent] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(NOTEPAD_STORAGE_KEY) || localStorage.getItem(LEGACY_NOTEPAD_STORAGE_KEY);
    if (saved) {
      setNotepadContent(saved);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever content changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(NOTEPAD_STORAGE_KEY, notepadContent);
    }
  }, [notepadContent, isInitialized]);

  return { notepadContent, setNotepadContent };
}

export function useTestimonyForm() {
  const [testimonyForm, setTestimonyForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    situation: '',
    testimony: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleTestimonyChange = (field: keyof typeof testimonyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonyForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTestimonySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!testimonyForm.fullName || !testimonyForm.situation || !testimonyForm.testimony) {
      setFormError('Please complete the required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendTestimonyNotification({
        churchEmail: 'info@piccworldwide.org',
        fullName: testimonyForm.fullName,
        phone: testimonyForm.phone || undefined,
        area: testimonyForm.area || undefined,
        situation: testimonyForm.situation,
        testimony: testimonyForm.testimony,
      });

      setFormSuccess('Thank you! Your testimony has been sent.');
      setTestimonyForm({
        fullName: '',
        phone: '',
        area: '',
        situation: '',
        testimony: '',
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit testimony.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { testimonyForm, handleTestimonyChange, handleTestimonySubmit, isSubmitting, formError, formSuccess };
}

export function useGiveForm() {
  const [giveForm, setGiveForm] = useState({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const normalizePaychanguPhone = (countryCode: string, rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    if (countryCode === '+265') {
      return digits.replace(/^0+/, '');
    }
    return `${countryCode}${digits}`;
  };

  const handleGiveChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setGiveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!giveForm.amount || !giveForm.fullName || !giveForm.phone) {
      setFormError('Please complete the required fields before submitting.');
      return;
    }

    const nameParts = giveForm.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setFormError('Please enter your full name (first and last).');
      return;
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const normalizedPhone = normalizePaychanguPhone(giveForm.phoneCountry, giveForm.phone);
    if (giveForm.phoneCountry === '+265' && normalizedPhone.length !== 9) {
      setFormError('Please enter a valid Malawi mobile number with 9 digits.');
      return;
    }

    const resolvedReason =
      giveForm.reason || giveForm.givingType || 'Giving';

    setIsSubmitting(true);
    try {
      const givingResponse = await fetch(apiUrl('/api/giving'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookletNumber: giveForm.bookletNumber,
          givingDate: giveForm.givingDate,
          givingType: giveForm.givingType,
          specialRecipient: giveForm.specialRecipient,
          amount: parseFloat(giveForm.amount),
          currency: giveForm.currency,
          fullName: giveForm.fullName,
          email: giveForm.email,
          phone: normalizedPhone,
          phoneCountry: giveForm.phoneCountry,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
        }),
      });

      if (!givingResponse.ok) {
        const givingData = await givingResponse.json();
        throw new Error(givingData.error || 'Failed to save giving record');
      }

      const paymentResponse = await fetch(apiUrl('/api/paychangu/initialize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: giveForm.amount,
          firstName,
          lastName,
          phone: normalizedPhone,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
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

      try {
        await sendGivingNotification({
          userEmail: giveForm.email || undefined,
          churchEmail: 'info@piccworldwide.org',
          fullName: giveForm.fullName,
          amount: giveForm.amount,
          currency: giveForm.currency,
          phone: normalizedPhone,
          phoneCountry: giveForm.phoneCountry,
          paymentMethod: giveForm.paymentMethod,
          reason: resolvedReason,
          givingType: giveForm.givingType,
          specialRecipient: giveForm.specialRecipient,
          givingDate: giveForm.givingDate,
          bookletNumber: giveForm.bookletNumber,
        });
      } catch (emailError) {
        console.error('Giving notification email failed:', emailError);
      }

      setFormSuccess('Thank you! Your giving request was submitted. Follow the mobile prompt to complete payment.');
      setGiveForm((prev) => ({
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

  return { giveForm, isSubmitting, formError, formSuccess, handleGiveChange, handleGiveSubmit };
}
