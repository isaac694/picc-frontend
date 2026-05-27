'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const SEE_YOU_FALLBACK_IMAGE = '/home/see-you-in-church.JPG';

type SeeYouService = {
  id: string;
  day: string;
  time: string;
  title: string;
};

const DEFAULT_SEE_YOU_SERVICES: SeeYouService[] = [
  { id: 'default-tuesday', day: 'Tuesday', time: '5:30 PM - 7:30 PM', title: 'Home Church Service' },
  { id: 'default-wednesday', day: 'Wednesday', time: '9:00 AM - 12:00 PM', title: 'Intercession, Counselling & Deliverance' },
  { id: 'default-thursday', day: 'Thursday', time: '6:00 PM - 8:00 PM', title: 'Special Word Encounter Service' },
  { id: 'default-sunday', day: 'Sunday', time: '7:00 AM - 12:00 PM', title: 'Miracles & Celebration Service' },
  { id: 'default-everyday', day: 'Everyday', time: '5:00 AM - 6:00 AM', title: 'Morning Glory Prayer' },
  { id: 'default-saturday', day: 'Saturday', time: '8:30 AM - 11:00 AM', title: 'Corporate Soul Winning' },
  { id: 'default-sunday-prayer', day: 'Sunday', time: 'After the last service', title: 'One on One Prayers and Counseling' },
];

const normalizeImageUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  if (trimmed === '/home/see-you-in-church.jpg') return SEE_YOU_FALLBACK_IMAGE;
  return trimmed;
};

const parseSeeYouServices = (body?: string | null): SeeYouService[] => {
  if (!body) return DEFAULT_SEE_YOU_SERVICES;

  try {
    const parsed = JSON.parse(body);
    const services = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.services)
        ? parsed.services
        : [];

    const normalized = services
      .map((service: unknown, index: number) => {
        if (!service || typeof service !== 'object') return null;
        const item = service as Record<string, unknown>;
        const day = typeof item.day === 'string' ? item.day : typeof item.dayOfWeek === 'string' ? item.dayOfWeek : '';
        const time = typeof item.time === 'string' ? item.time : '';
        const title = typeof item.title === 'string' ? item.title : '';

        if (!day && !time && !title) return null;

        return {
          id: typeof item.id === 'string' ? item.id : `see-you-service-${index}`,
          day,
          time,
          title,
        };
      })
      .filter((service: SeeYouService | null): service is SeeYouService => Boolean(service));

    return normalized.length ? normalized : DEFAULT_SEE_YOU_SERVICES;
  } catch {
    return DEFAULT_SEE_YOU_SERVICES;
  }
};

export default function SeeYouInChurchAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [seeYouTitle, setSeeYouTitle] = useState('See You In Church');
  const [seeYouSubtitle, setSeeYouSubtitle] = useState('Grow deeper in your walk with God this week.');
  const [seeYouImageUrl, setSeeYouImageUrl] = useState('');
  const [seeYouServices, setSeeYouServices] = useState<SeeYouService[]>(DEFAULT_SEE_YOU_SERVICES);
  const [bannerDraftTitle, setBannerDraftTitle] = useState('');
  const [bannerDraftSubtitle, setBannerDraftSubtitle] = useState('');
  const [serviceDraft, setServiceDraft] = useState<Omit<SeeYouService, 'id'>>({
    day: '',
    time: '',
    title: '',
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;

    const fetchContent = async () => {
      try {
        const response = await apiFetch('/api/site-content/see-you-in-church');
        if (!response.ok) return;
        const data = await response.json();
        setSeeYouTitle(data.title || 'See You In Church');
        setSeeYouSubtitle(data.subtitle || 'Grow deeper in your walk with God this week.');
        setSeeYouImageUrl(normalizeImageUrl(data.imageUrl));
        setSeeYouServices(parseSeeYouServices(data.body));
      } catch {
        // ignore
      }
    };

    fetchContent();
  }, [token]);

  const uploadImage = async (file: File) => {
    if (!token) return null;

    if (file.size > 1024 * 1024) {
      setStatus('Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        setStatus('Image upload failed.');
        return null;
      }
      const data = await response.json();
      return apiUrl(data.url);
    } catch {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const handleSave = async () => {
    setStatus('');
    try {
      const response = await apiFetch('/api/site-content/see-you-in-church', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: seeYouTitle,
          subtitle: seeYouSubtitle,
          imageUrl: seeYouImageUrl,
          body: JSON.stringify({ services: seeYouServices }),
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save See You in Church settings.');
        return;
      }
      setStatus('See You in Church section updated.');
    } catch {
      setStatus('Unable to save See You in Church settings.');
    }
  };

  const editBanner = () => {
    setIsEditingBanner(true);
    setEditingServiceId(null);
    setBannerDraftTitle(seeYouTitle);
    setBannerDraftSubtitle(seeYouSubtitle);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveBanner = async () => {
    setStatus('');
    const finalTitle = bannerDraftTitle.trim() || seeYouTitle;
    const finalSubtitle = bannerDraftSubtitle.trim() || seeYouSubtitle;

    try {
      const response = await apiFetch('/api/site-content/see-you-in-church', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: finalTitle,
          subtitle: finalSubtitle,
          imageUrl: seeYouImageUrl,
          body: JSON.stringify({ services: seeYouServices }),
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save banner settings.');
        return;
      }
      setSeeYouTitle(finalTitle);
      setSeeYouSubtitle(finalSubtitle);
      setBannerDraftTitle('');
      setBannerDraftSubtitle('');
      setIsEditingBanner(false);
      setStatus('Banner section updated and form cleared.');
    } catch {
      setStatus('Unable to save banner settings.');
    }
  };

  const clearServiceDraft = () => {
    setServiceDraft({ day: '', time: '', title: '' });
    setEditingServiceId(null);
  };

  const editService = (service: SeeYouService) => {
    setIsEditingBanner(false);
    setEditingServiceId(service.id);
    setServiceDraft({
      day: service.day,
      time: service.time,
      title: service.title,
    });
  };

  const saveServiceDraft = () => {
    if (!serviceDraft.day.trim() || !serviceDraft.time.trim() || !serviceDraft.title.trim()) {
      setStatus('Please fill day, time, and service title before saving a See You in Church service.');
      return;
    }

    setIsEditingBanner(false);
    const nextService = {
      id: editingServiceId || `see-you-service-${Date.now()}`,
      day: serviceDraft.day.trim(),
      time: serviceDraft.time.trim(),
      title: serviceDraft.title.trim(),
    };

    setSeeYouServices((prev) =>
      editingServiceId
        ? prev.map((service) => (service.id === editingServiceId ? nextService : service))
        : [...prev, nextService],
    );
    clearServiceDraft();
    setStatus('');
  };

  const removeService = (id: string) => {
    setSeeYouServices((prev) => prev.filter((service) => service.id !== id));
  };

  if (!token) {
    return (
      <AdminLoginCard
        email={email}
        password={password}
        loginError={loginError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
            Admin
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground">
            See You in Church
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Control the featured call-to-action on the homepage.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition ${
          isEditingBanner ? 'border-primary bg-primary/5 shadow-md' : 'border-border/60 bg-card'
        }`}>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Section Banner</h3>
            <p className="text-sm text-foreground/60 mt-1">
              Edit the background image and text for the homepage CTA.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              placeholder={seeYouTitle}
              value={bannerDraftTitle}
              onFocus={() => setIsEditingBanner(true)}
              onChange={(event) => setBannerDraftTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subtitle
            </label>
            <textarea
              placeholder={seeYouSubtitle}
              value={bannerDraftSubtitle}
              onFocus={() => setIsEditingBanner(true)}
              onChange={(event) => setBannerDraftSubtitle(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Image <span className="text-[11px] font-normal text-foreground/50">(Max 1MB allowed)</span>
            </label>
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                  setSeeYouImageUrl(url);
                  setUploadName(file.name);
                }
              }}
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSeeYouImageUrl('');
                setUploadName('');
              }}
            >
              Remove Image
            </Button>
            {isEditingBanner ? (
              <Button onClick={handleSaveBanner}>
                Save Banner
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSave}>
                Save Image Only
              </Button>
            )}
          </div>
          {uploadName && (
            <p className="text-xs text-foreground/60">Selected: {uploadName}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
            Preview
          </p>
          <div
            className="h-44 rounded-xl bg-cover bg-center border border-border/60"
            style={{ backgroundImage: `url(${seeYouImageUrl || SEE_YOU_FALLBACK_IMAGE})` }}
          />
          <div
            className={`rounded-2xl border p-4 transition cursor-pointer hover:border-primary/50 ${
              isEditingBanner
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/60 bg-background'
            }`}
            onClick={() => editBanner()}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              Banner Content
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {seeYouTitle || 'See You in Church'}
            </h3>
            <p className="text-sm text-foreground/70">
              {seeYouSubtitle || 'Grow deeper in your walk with God this week.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  editBanner();
                }}
              >
                Edit Banner Text
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Homepage Service Cards</h2>
          <p className="text-sm text-foreground/60 mt-1">
            These entries appear only in the homepage See You in Church section.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {editingServiceId ? 'Edit Service Card' : 'Add Service Card'}
              </h3>
              <p className="text-sm text-foreground/60 mt-1">
                Update the card text, then save the full section below.
              </p>
            </div>

            <div className="space-y-3">
              <label className="grid gap-2 text-sm text-foreground/70">
                <span>Day</span>
                <input
                  type="text"
                  placeholder="Sunday"
                  value={serviceDraft.day}
                  onChange={(event) => setServiceDraft((prev) => ({ ...prev, day: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
              <label className="grid gap-2 text-sm text-foreground/70">
                <span>Time</span>
                <input
                  type="text"
                  placeholder="7:00 AM - 12:00 PM"
                  value={serviceDraft.time}
                  onChange={(event) => setServiceDraft((prev) => ({ ...prev, time: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
              <label className="grid gap-2 text-sm text-foreground/70">
                <span>Service title</span>
                <input
                  type="text"
                  placeholder="Miracles & Celebration Service"
                  value={serviceDraft.title}
                  onChange={(event) => setServiceDraft((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={saveServiceDraft}>
                {editingServiceId ? 'Update Card' : 'Add Card'}
              </Button>
              {(editingServiceId || serviceDraft.day || serviceDraft.time || serviceDraft.title) && (
                <Button variant="outline" onClick={clearServiceDraft}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Current Cards</h3>
              <p className="text-sm text-foreground/60 mt-1">
                Select a card to edit it on the left.
              </p>
            </div>

            {seeYouServices.length === 0 ? (
              <p className="text-sm text-foreground/60">No homepage services yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seeYouServices.map((service) => (
                  <div
                    key={service.id}
                    className={`rounded-2xl border p-4 transition ${
                      editingServiceId === service.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 bg-card'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                      {service.day || 'Day'}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {service.time || 'Time'}
                    </p>
                    <p className="text-sm text-foreground/70">
                      {service.title || 'Service title'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => editService(service)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removeService(service.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
          <Button onClick={handleSave}>Save Section</Button>
          <Button
            variant="outline"
            onClick={() => setSeeYouServices(DEFAULT_SEE_YOU_SERVICES)}
          >
            Restore Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
