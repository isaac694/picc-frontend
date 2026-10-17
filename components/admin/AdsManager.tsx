'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Loader2, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { apiFetch } from '@/lib/api';
import { useMediaUpload } from '@/hooks/use-media-upload';
import MediaUploadProgress from '@/components/admin/MediaUploadProgress';
import WebsiteAdThumbnail from '@/components/WebsiteAdThumbnail';
import { adminErrorToast, adminSuccessToast, adminToastFromResponse } from '@/components/admin/admin-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  findPublicSitePageByPath,
  isKnownPublicSitePath,
  normalizePublicPath,
  PUBLIC_SITE_PAGE_GROUPS,
  publicSitePagesByGroup,
} from '@/lib/public-site-pages';
import {
  ADMIN_WEBSITE_ADS_BASE,
  normalizeWebsiteAdStoragePath,
  parseWebsiteAds,
  websiteAdBannerUrlForApi,
  websiteAdLinkForApi,
  websiteAdLinkUrl,
  type WebsiteAd,
} from '@/lib/website-ads';

const LINK_CUSTOM_VALUE = '__custom__';
const LINK_NONE_VALUE = '__none__';

type AdDraft = {
  name: string;
  description: string;
  url: string;
};

const EMPTY_DRAFT: AdDraft = {
  name: '',
  description: '',
  url: '',
};

const formatWhen = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

export default function AdsManager({ token }: { token: string }) {
  const { runUpload, progress, uploading: uploadingBanner } = useMediaUpload();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [ads, setAds] = useState<WebsiteAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bannerUploadName, setBannerUploadName] = useState('');
  const [bannerPath, setBannerPath] = useState('');
  const [linkMode, setLinkMode] = useState<'none' | 'page' | 'custom'>('none');
  const [linkedPagePath, setLinkedPagePath] = useState('');

  const pagesByGroup = useMemo(() => publicSitePagesByGroup(), []);

  const sortedAds = useMemo(
    () => [...ads].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))),
    [ads],
  );

  const applyLinkToDraft = (url: string) => {
    setDraft((prev) => ({ ...prev, url: url.trim() }));
  };

  const syncLinkModeFromUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setLinkMode('none');
      setLinkedPagePath('');
      return;
    }
    const normalized = normalizePublicPath(trimmed);
    if (isKnownPublicSitePath(normalized)) {
      setLinkMode('page');
      setLinkedPagePath(normalized);
      applyLinkToDraft(normalized);
      return;
    }
    setLinkMode('custom');
    setLinkedPagePath('');
  };

  const resetModal = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setBannerUploadName('');
    setBannerPath('');
    setLinkMode('none');
    setLinkedPagePath('');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const openCreateModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const openEditModal = (ad: WebsiteAd) => {
    setEditingId(ad.id);
    const banner = ad.url || ad.imageUrl;
    const link = String(ad.link || '').trim();
    setDraft({
      name: ad.name,
      description: ad.description,
      url: link,
    });
    syncLinkModeFromUrl(link);
    setBannerPath(normalizeWebsiteAdStoragePath(banner));
    setBannerUploadName('');
    setModalOpen(true);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      adminErrorToast('Please upload an image for the card thumbnail.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      adminErrorToast('Image must be 5MB or less.');
      return;
    }
    setBannerUploadName(file.name);
    try {
      const uploaded = await runUpload(file, 'website-ads');
      setBannerPath(normalizeWebsiteAdStoragePath(uploaded));
      adminSuccessToast('Banner uploaded.');
    } catch (error) {
      adminErrorToast(error instanceof Error ? error.message : 'Banner upload failed.');
      setBannerUploadName('');
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${ADMIN_WEBSITE_ADS_BASE}?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        adminErrorToast('Unable to load website ads.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setAds(parseWebsiteAds(data));
    } catch {
      adminErrorToast('Unable to load website ads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSave = async () => {
    if (!draft.name.trim()) {
      adminErrorToast('Name is required.');
      return;
    }
    const linkUrl = draft.url.trim();
    const storedBanner = normalizeWebsiteAdStoragePath(bannerPath);
    const bannerForApi = websiteAdBannerUrlForApi(storedBanner);
    const linkForApi = websiteAdLinkForApi(linkUrl);

    if (!bannerForApi && !linkForApi) {
      adminErrorToast('Choose a page link or upload a banner image.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: draft.name.trim(),
        description: draft.description.trim(),
      };
      if (bannerForApi) payload.url = bannerForApi;
      if (linkForApi) payload.link = linkForApi;

      const requestUrl = editingId
        ? `${ADMIN_WEBSITE_ADS_BASE}/${encodeURIComponent(editingId)}`
        : ADMIN_WEBSITE_ADS_BASE;
      const method = editingId ? 'PUT' : 'POST';

      const response = await apiFetch(requestUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      await adminToastFromResponse(response, {
        success: editingId ? 'Ad updated.' : 'Ad created. Activate it to show on the website.',
        error: editingId ? 'Unable to update ad.' : 'Unable to create ad.',
      });

      if (!response.ok) return;

      setModalOpen(false);
      resetModal();
      await refresh();
    } catch {
      adminErrorToast(editingId ? 'Unable to update ad.' : 'Unable to create ad.');
    } finally {
      setSaving(false);
    }
  };

  const setActiveState = async (ad: WebsiteAd, active: boolean) => {
    setTogglingId(ad.id);
    try {
      const action = active ? 'activate' : 'deactivate';
      const response = await apiFetch(`${ADMIN_WEBSITE_ADS_BASE}/${encodeURIComponent(ad.id)}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      await adminToastFromResponse(response, {
        success: active ? 'Ad activated.' : 'Ad deactivated.',
        error: active ? 'Unable to activate ad.' : 'Unable to deactivate ad.',
      });

      if (!response.ok) return;
      await refresh();
    } catch {
      adminErrorToast(active ? 'Unable to activate ad.' : 'Unable to deactivate ad.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (ad: WebsiteAd) => {
    setDeletingId(ad.id);
    try {
      const response = await apiFetch(`${ADMIN_WEBSITE_ADS_BASE}/${encodeURIComponent(ad.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok && response.status !== 204) {
        await adminToastFromResponse(response, { success: 'Ad deleted.', error: 'Unable to delete ad.' });
        return;
      }

      adminSuccessToast('Ad deleted.');
      if (editingId === ad.id) {
        setModalOpen(false);
        resetModal();
      }
      await refresh();
    } catch {
      adminErrorToast('Unable to delete ad.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading ads…' : `${sortedAds.length} popup ad${sortedAds.length === 1 ? '' : 's'}`}
        </p>
        <Button type="button" size="sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add ad
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading ads…
        </div>
      ) : sortedAds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No popup ads yet. Click <span className="font-medium text-foreground">Add ad</span> to create one, then activate it.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {sortedAds.map((ad) => {
            const openLink = websiteAdLinkUrl(ad);
            return (
            <article
              key={ad.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative border-b border-border/50">
                <WebsiteAdThumbnail ad={ad} variant="intrinsic" className="w-full" />
                <Badge
                  variant="outline"
                  className={`absolute right-2 top-2 text-[10px] shadow-sm ${ad.isActive
                    ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                    : 'border-amber-200 bg-amber-50/95 text-amber-900'}`}
                >
                  {ad.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold leading-snug">{ad.name || 'Untitled ad'}</h2>
                  {openLink ? (
                    <a
                      href={openLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-primary"
                      title="Open link"
                      aria-label={`Open link for ${ad.name || 'ad'}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
                {ad.description ? (
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{ad.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No description.</p>
                )}
                <p className="text-[10px] text-muted-foreground">Updated {formatWhen(ad.updatedAt || ad.createdAt)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${ad.name || 'ad'}`}
                    onClick={() => openEditModal(ad)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {ad.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={togglingId === ad.id}
                      onClick={() => void setActiveState(ad, false)}
                    >
                      {togglingId === ad.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={togglingId === ad.id}
                      onClick={() => void setActiveState(ad, true)}
                    >
                      {togglingId === ad.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                      Activate
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${ad.name || 'ad'}`}
                    onClick={() =>
                      confirmDeleteToast({
                        title: 'Delete this ad?',
                        description: ad.name || 'This popup ad will be permanently removed.',
                        onConfirm: () => void handleDelete(ad),
                      })
                    }
                    disabled={deletingId === ad.id}
                  >
                    {deletingId === ad.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit popup ad' : 'Add popup ad'}</DialogTitle>
            <DialogDescription>
              New ads start inactive. Activate an ad after saving to show it on the public website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Name</Label>
              <Input
                id="ad-name"
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Easter Conference 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-description">Description</Label>
              <Textarea
                id="ad-description"
                rows={4}
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Join us for a special conference. Tap to register."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-link-target">Link to page</Label>
              <Select
                value={
                  linkMode === 'none'
                    ? LINK_NONE_VALUE
                    : linkMode === 'custom'
                      ? LINK_CUSTOM_VALUE
                      : linkedPagePath || LINK_NONE_VALUE
                }
                onValueChange={(value) => {
                  if (value === LINK_NONE_VALUE) {
                    setLinkMode('none');
                    setLinkedPagePath('');
                    applyLinkToDraft('');
                    return;
                  }
                  if (value === LINK_CUSTOM_VALUE) {
                    setLinkMode('custom');
                    setLinkedPagePath('');
                    return;
                  }
                  setLinkMode('page');
                  setLinkedPagePath(value);
                  applyLinkToDraft(value);
                }}
              >
                <SelectTrigger id="ad-link-target" className="w-full">
                  <SelectValue placeholder="Choose where the ad goes" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(320px,60vh)]">
                  <SelectItem value={LINK_NONE_VALUE}>No link (banner only)</SelectItem>
                  <SelectItem value={LINK_CUSTOM_VALUE}>Custom URL…</SelectItem>
                  {PUBLIC_SITE_PAGE_GROUPS.map((group) => {
                    const pages = pagesByGroup.get(group);
                    if (!pages?.length) return null;
                    return (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {pages.map((page) => (
                          <SelectItem key={page.path} value={page.path}>
                            {page.label} ({page.path})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>

              {linkMode === 'custom' ? (
                <Input
                  id="ad-url"
                  type="url"
                  value={draft.url}
                  onChange={(event) => applyLinkToDraft(event.target.value)}
                  placeholder="https://piccworldwide.org/events or /events"
                />
              ) : null}

              {linkMode === 'page' && linkedPagePath ? (
                <p className="text-xs text-muted-foreground">
                  Visitors go to{' '}
                  <span className="font-medium text-foreground">{linkedPagePath}</span>
                  {findPublicSitePageByPath(linkedPagePath)
                    ? ` — ${findPublicSitePageByPath(linkedPagePath)?.label}`
                    : null}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pick an on-site page, or use a custom URL for external links (optional if the ad is banner-only).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Card banner</Label>
              <div className="overflow-hidden rounded-xl border border-border/60">
                <WebsiteAdThumbnail
                  ad={{
                    name: draft.name || 'New ad',
                    url: bannerPath,
                    imageUrl: bannerPath,
                  }}
                  variant="intrinsic"
                  className="w-full rounded-md border border-border/60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleBannerUpload(event)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Upload banner
                </Button>
                {bannerUploadName ? (
                  <span className="truncate text-xs text-muted-foreground">{bannerUploadName}</span>
                ) : null}
              </div>
              <MediaUploadProgress uploading={uploadingBanner} progress={progress} />
              <p className="text-xs text-muted-foreground">Shown on admin cards and in the popup.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || uploadingBanner}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Save changes' : 'Create ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
