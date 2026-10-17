'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const SEE_YOU_FALLBACK_IMAGE = '/home/see-you-in-church.JPG';
const SITE_CONTENT_KEY = '/api/site-content/see-you-in-church';
const ADMIN_SERVICE_CARDS = '/api/admin/see-you-in-church/service-cards';

type SeeYouServiceCard = {
  id: string;
  day: string;
  time: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_SERVICE_DRAFT = {
  day: '',
  time: '',
  title: '',
  isActive: true,
};

const normalizeImageUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) {
    try {
      const { pathname } = new URL(trimmed);
      if (pathname.startsWith('/uploads')) return apiUrl(pathname);
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  if (trimmed.startsWith('/uploads')) return apiUrl(trimmed);
  if (trimmed === '/home/see-you-in-church.jpg') return SEE_YOU_FALLBACK_IMAGE;
  return trimmed;
};

const imageUrlForApi = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('/home/')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith('/uploads') || url.pathname.startsWith('/home/')) {
      return url.pathname;
    }
  } catch {
    // relative path
  }
  return trimmed;
};

function parseServiceCardsFromBody(body?: string | null): SeeYouServiceCard[] {
  if (!body) return [];
  try {
    const parsed = JSON.parse(body);
    const services = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.services)
        ? parsed.services
        : [];
    return services
      .map((service: unknown, index: number) => {
        if (!service || typeof service !== 'object') return null;
        const item = service as Record<string, unknown>;
        const day =
          typeof item.day === 'string'
            ? item.day
            : typeof item.dayOfWeek === 'string'
              ? item.dayOfWeek
              : '';
        const time = typeof item.time === 'string' ? item.time : '';
        const title = typeof item.title === 'string' ? item.title : '';
        if (!day && !time && !title) return null;
        return {
          id: typeof item.id === 'string' ? item.id : `legacy-${index}`,
          day,
          time,
          title,
          sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
          isActive: item.isActive !== false,
        };
      })
      .filter((item): item is SeeYouServiceCard => Boolean(item));
  } catch {
    return [];
  }
}

function normalizeApiServiceCard(raw: unknown, index: number): SeeYouServiceCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id : '';
  const title = typeof item.title === 'string' ? item.title : '';
  const day =
    typeof item.day === 'string'
      ? item.day
      : typeof item.dayOfWeek === 'string'
        ? item.dayOfWeek
        : '';
  const time = typeof item.time === 'string' ? item.time : '';
  if (!id || (!title && !day && !time)) return null;
  return {
    id,
    title,
    day,
    time,
    sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
    isActive: item.isActive !== false,
  };
}

export default function SeeYouInChurchAdminPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [seeYouTitle, setSeeYouTitle] = useState('See You In Church');
  const [seeYouSubtitle, setSeeYouSubtitle] = useState('Grow deeper in your walk with God this week.');
  const [seeYouImageUrl, setSeeYouImageUrl] = useState('');
  const [serviceCards, setServiceCards] = useState<SeeYouServiceCard[]>([]);

  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [bannerDraft, setBannerDraft] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
  });
  const [bannerUploadName, setBannerUploadName] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceDraft, setServiceDraft] = useState(EMPTY_SERVICE_DRAFT);
  const [savingService, setSavingService] = useState(false);

  const { runUpload, progress, uploading } = useMediaUpload();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const loadServiceCards = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiFetch(ADMIN_SERVICE_CARDS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data.serviceCards)
          ? data.serviceCards
          : Array.isArray(data.services)
            ? data.services
            : [];
        const normalized = list
          .map((item: unknown, index: number) => normalizeApiServiceCard(item, index))
          .filter((item: SeeYouServiceCard | null): item is SeeYouServiceCard => Boolean(item))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
        setServiceCards(normalized);
        return;
      }
    } catch {
      // fall through to site-content body
    }

    try {
      const contentRes = await apiFetch(SITE_CONTENT_KEY);
      if (contentRes.ok) {
        const data = await contentRes.json();
        setServiceCards(parseServiceCardsFromBody(data.body));
      }
    } catch {
      // ignore
    }
  }, [token]);

  const loadBanner = useCallback(async () => {
    try {
      const response = await apiFetch(SITE_CONTENT_KEY);
      if (!response.ok) return;
      const data = await response.json();
      setSeeYouTitle(data.title || 'See You In Church');
      setSeeYouSubtitle(data.subtitle || 'Grow deeper in your walk with God this week.');
      setSeeYouImageUrl(normalizeImageUrl(data.imageUrl));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      await Promise.all([loadBanner(), loadServiceCards()]);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loadBanner, loadServiceCards]);

  const uploadImage = async (file: File) => {
    if (file.size > 1024 * 1024) {
      setStatus(
        'Your image file size is too big. Please compress it first before re uploading. Only pictures less than 1MB are allowed.',
      );
      return null;
    }
    try {
      return await runUpload(file, 'page-images');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.');
      return null;
    }
  };

  const openBannerDialog = () => {
    setBannerDraft({
      title: seeYouTitle,
      subtitle: seeYouSubtitle,
      imageUrl: seeYouImageUrl,
    });
    setBannerUploadName('');
    setBannerDialogOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const closeBannerDialog = () => {
    setBannerDialogOpen(false);
    setBannerUploadName('');
  };

  const openAddServiceDialog = () => {
    setEditingServiceId(null);
    setServiceDraft(EMPTY_SERVICE_DRAFT);
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (card: SeeYouServiceCard) => {
    setEditingServiceId(card.id);
    setServiceDraft({
      day: card.day,
      time: card.time,
      title: card.title,
      isActive: card.isActive,
    });
    setServiceDialogOpen(true);
  };

  const closeServiceDialog = () => {
    setServiceDialogOpen(false);
    setEditingServiceId(null);
    setServiceDraft(EMPTY_SERVICE_DRAFT);
  };

  const handleSaveBanner = async () => {
    if (!token) return;
    setSavingBanner(true);
    setStatus('');
    try {
      const response = await apiFetch(SITE_CONTENT_KEY, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: bannerDraft.title.trim() || seeYouTitle,
          subtitle: bannerDraft.subtitle.trim() || seeYouSubtitle,
          imageUrl: imageUrlForApi(bannerDraft.imageUrl || seeYouImageUrl),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus(typeof data.error === 'string' ? data.error : 'Unable to save banner.');
        return;
      }
      const data = await response.json();
      setSeeYouTitle(data.title || bannerDraft.title);
      setSeeYouSubtitle(data.subtitle || bannerDraft.subtitle);
      setSeeYouImageUrl(normalizeImageUrl(data.imageUrl));
      closeBannerDialog();
      setStatus('Banner updated.');
    } catch {
      setStatus('Unable to save banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveService = async () => {
    if (!token) return;
    const day = serviceDraft.day.trim();
    const time = serviceDraft.time.trim();
    const title = serviceDraft.title.trim();
    if (!day || !time || !title) {
      setStatus('Please fill day, time, and service title.');
      return;
    }

    setSavingService(true);
    setStatus('');
    try {
      const payload = {
        title,
        day,
        time,
        isActive: serviceDraft.isActive,
        ...(editingServiceId ? {} : { sortOrder: serviceCards.length }),
      };

      const url = editingServiceId
        ? `${ADMIN_SERVICE_CARDS}/${encodeURIComponent(editingServiceId)}`
        : ADMIN_SERVICE_CARDS;
      const method = editingServiceId ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fieldErrors = Array.isArray(data.errors)
          ? data.errors.map((e: { field?: string; error?: string }) => e.error || e.field).join(' ')
          : '';
        setStatus(
          typeof data.error === 'string'
            ? fieldErrors
              ? `${data.error} ${fieldErrors}`
              : data.error
            : 'Unable to save service card.',
        );
        return;
      }

      closeServiceDialog();
      await loadServiceCards();
      setStatus(editingServiceId ? 'Service card updated.' : 'Service card added.');
    } catch {
      setStatus('Unable to save service card.');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!token) return;
    setStatus('');
    try {
      const response = await apiFetch(`${ADMIN_SERVICE_CARDS}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus(typeof data.error === 'string' ? data.error : 'Unable to delete service card.');
        return;
      }
      if (editingServiceId === id) closeServiceDialog();
      await loadServiceCards();
      setStatus('Service card deleted.');
    } catch {
      setStatus('Unable to delete service card.');
    }
  };

  const requestDeleteService = (card: SeeYouServiceCard) => {
    confirmDeleteToast({
      title: 'Delete this service card?',
      description: card.title || `${card.day} · ${card.time}`,
      onConfirm: () => void handleDeleteService(card.id),
    });
  };

  const serviceFormFields = (
    <div className="space-y-4">
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Day</span>
        <input
          type="text"
          placeholder="Sunday"
          value={serviceDraft.day}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, day: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Time</span>
        <input
          type="text"
          placeholder="7:00 AM - 12:00 PM"
          value={serviceDraft.time}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, time: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Service title</span>
        <input
          type="text"
          placeholder="Miracles & Celebration Service"
          value={serviceDraft.title}
          onChange={(event) => setServiceDraft((prev) => ({ ...prev, title: event.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
      </label>
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div>
          <Label htmlFor="service-active" className="text-sm font-medium">
            Active on homepage
          </Label>
          <p className="text-xs text-muted-foreground">Inactive cards are hidden from visitors.</p>
        </div>
        <Switch
          id="service-active"
          checked={serviceDraft.isActive}
          onCheckedChange={(checked) => setServiceDraft((prev) => ({ ...prev, isActive: checked }))}
        />
      </div>
    </div>
  );

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-primary/70">Admin</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-5xl">See You in Church</h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Manage the homepage banner and service schedule cards via the backend API.
          </p>
        </div>
        <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={openBannerDialog}>
          <Pencil className="h-4 w-4" />
          Edit banner
        </Button>
      </div>

      {status ? <p className="text-sm text-foreground/70">{status}</p> : null}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">Banner preview</p>
        <div
          className="mt-4 h-44 rounded-xl border border-border/60 bg-cover bg-center"
          style={{ backgroundImage: `url(${seeYouImageUrl || SEE_YOU_FALLBACK_IMAGE})` }}
        />
        <div className="mt-4 rounded-2xl border border-border/60 bg-background p-4">
          <h3 className="text-lg font-semibold text-foreground">{seeYouTitle || 'See You in Church'}</h3>
          <p className="mt-1 text-sm text-foreground/70">
            {seeYouSubtitle || 'Grow deeper in your walk with God this week.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Homepage service cards</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Shown in the See You in Church section on the homepage.
            </p>
          </div>
          <Button type="button" className="gap-2 shrink-0" onClick={openAddServiceDialog}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-foreground/60">Loading service cards…</p>
        ) : serviceCards.length === 0 ? (
          <p className="text-sm text-foreground/60">No service cards yet. Add one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {serviceCards.map((card) => (
              <div
                key={card.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  card.isActive ? 'border-border/60 bg-background' : 'border-border/40 bg-muted/30 opacity-80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">{card.day || 'Day'}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{card.time || 'Time'}</p>
                  <p className="text-sm text-foreground/70">{card.title || 'Service title'}</p>
                  {!card.isActive ? (
                    <p className="mt-1 text-xs font-medium text-muted-foreground">Inactive</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${card.title || 'service'}`}
                    onClick={() => openEditServiceDialog(card)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${card.title || 'service'}`}
                    onClick={() => requestDeleteService(card)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={bannerDialogOpen}
        onOpenChange={(open) => {
          setBannerDialogOpen(open);
          if (!open) setBannerUploadName('');
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>Edit banner</DialogTitle>
            <DialogDescription>Title, subtitle, and background image for the homepage section.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,520px)] space-y-4 overflow-y-auto px-6 py-5">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Title</span>
              <input
                ref={titleInputRef}
                type="text"
                value={bannerDraft.title}
                onChange={(event) => setBannerDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Subtitle</span>
              <textarea
                rows={3}
                value={bannerDraft.subtitle}
                onChange={(event) => setBannerDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
              />
            </label>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Upload image{' '}
                <span className="text-[11px] font-normal text-foreground/50">(max 1MB)</span>
              </label>
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) {
                    setBannerDraft((prev) => ({ ...prev, imageUrl: normalizeImageUrl(url) }));
                    setBannerUploadName(file.name);
                  }
                }}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              />
              <MediaUploadProgress uploading={uploading} progress={progress} className="mt-2" />
              {bannerUploadName ? (
                <p className="mt-1 text-xs text-foreground/60">Selected: {bannerUploadName}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBannerDraft((prev) => ({ ...prev, imageUrl: '' }));
                setBannerUploadName('');
              }}
            >
              Remove image
            </Button>
          </div>
          <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeBannerDialog} disabled={savingBanner}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveBanner()} disabled={savingBanner}>
              {savingBanner ? 'Saving…' : 'Save banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={serviceDialogOpen}
        onOpenChange={(open) => {
          setServiceDialogOpen(open);
          if (!open) {
            setEditingServiceId(null);
            setServiceDraft(EMPTY_SERVICE_DRAFT);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
            <DialogTitle>{editingServiceId ? 'Edit service card' : 'Add service card'}</DialogTitle>
            <DialogDescription>
              {editingServiceId
                ? 'Update this schedule entry on the homepage.'
                : 'Create a new service time card for the homepage.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5">{serviceFormFields}</div>
          <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeServiceDialog} disabled={savingService}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveService()} disabled={savingService}>
              {savingService ? 'Saving…' : editingServiceId ? 'Save changes' : 'Add service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
