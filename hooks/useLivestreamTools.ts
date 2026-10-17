import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { apiUrl, messageFromApiPayload } from '@/lib/api';
import { PAYCHANGU_CHECKOUT_METHOD, processPaychanguPayment } from '@/lib/paychangu-initialize';
import { sendGivingNotification, sendTestimonyNotification } from '@/lib/email';
import { toast } from 'sonner';

const NOTEPAD_STORAGE_KEY = 'picc-livestream-notepad';
const LEGACY_NOTEPAD_STORAGE_KEY = 'livestream-notepad-content';

export function useNotepad() {
  const [notepadContent, setNotepadContent] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(NOTEPAD_STORAGE_KEY) || localStorage.getItem(LEGACY_NOTEPAD_STORAGE_KEY) || '';
  });

  // Save to localStorage whenever content changes
  useEffect(() => {
    localStorage.setItem(NOTEPAD_STORAGE_KEY, notepadContent);
  }, [notepadContent]);

  return { notepadContent, setNotepadContent };
}

export function useTestimonyForm(churchEmail: string = 'testimony@piccworldwide.org') {
  const [testimonyForm, setTestimonyForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    situation: '',
    testimony: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTestimonyChange = (field: keyof typeof testimonyForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTestimonyForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTestimonySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!testimonyForm.fullName || !testimonyForm.situation || !testimonyForm.testimony) {
      toast.error('Please complete the required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendTestimonyNotification({
        churchEmail,
        fullName: testimonyForm.fullName,
        phone: testimonyForm.phone || undefined,
        area: testimonyForm.area || undefined,
        situation: testimonyForm.situation,
        testimony: testimonyForm.testimony,
      });

      toast.success('Thank you! Your testimony has been sent.');
      setTestimonyForm({
        fullName: '',
        phone: '',
        area: '',
        situation: '',
        testimony: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit testimony.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { testimonyForm, handleTestimonyChange, handleTestimonySubmit, isSubmitting };
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
    paymentMethod: PAYCHANGU_CHECKOUT_METHOD,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!giveForm.amount || !giveForm.fullName || !giveForm.phone) {
      toast.error('Please complete the required fields before submitting.');
      return;
    }

    const nameParts = giveForm.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      toast.error('Please enter your full name (first and last).');
      return;
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const normalizedPhone = normalizePaychanguPhone(giveForm.phoneCountry, giveForm.phone);
    if (giveForm.phoneCountry === '+265' && normalizedPhone.length !== 9) {
      toast.error('Please enter a valid Malawi mobile number with 9 digits.');
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

      const givingData = await givingResponse.json();

      if (!givingResponse.ok) {
        throw new Error(messageFromApiPayload(givingData, 'Failed to save giving record'));
      }

      const givingId = givingData?.id;
      if (!givingId) {
        throw new Error('Giving record saved but no ID was returned.');
      }

      await processPaychanguPayment({
        amount: parseFloat(giveForm.amount),
        currency: giveForm.currency,
        email: giveForm.email,
        firstName,
        lastName,
        phone: normalizedPhone,
        reason: resolvedReason,
        givingId,
        account: 'main',
        returnPath: '/livestream',
      });

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

      toast.success('Complete your payment in the PayChangu window.');
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
        paymentMethod: PAYCHANGU_CHECKOUT_METHOD,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { giveForm, isSubmitting, handleGiveChange, handleGiveSubmit };
}
