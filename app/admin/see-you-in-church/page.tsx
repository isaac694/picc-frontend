'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

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
  const [uploadName, setUploadName] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchContent = async () => {
      try {
        const response = await apiFetch('/api/site-content/see-you-in-church');
        if (!response.ok) return;
        const data = await response.json();
        setSeeYouTitle(data.title || 'See You In Church');
        setSeeYouSubtitle(data.subtitle || 'Grow deeper in your walk with God this week.');
        const imageUrl = data.imageUrl
          ? data.imageUrl.startsWith('http')
            ? data.imageUrl
            : apiUrl(data.imageUrl)
          : '';
        setSeeYouImageUrl(imageUrl);
      } catch (error) {
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
    } catch (error) {
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
        }),
      });
      if (!response.ok) {
        setStatus('Unable to save See You in Church settings.');
        return;
      }
      setStatus('See You in Church section updated.');
    } catch (error) {
      setStatus('Unable to save See You in Church settings.');
    }
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
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              type="text"
              value={seeYouTitle}
              onChange={(event) => setSeeYouTitle(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subtitle
            </label>
            <textarea
              value={seeYouSubtitle}
              onChange={(event) => setSeeYouSubtitle(event.target.value)}
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
              accept="image/*"
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
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSeeYouImageUrl('');
                setUploadName('');
              }}
            >
              Remove Image
            </Button>
          </div>
          {uploadName && (
            <p className="text-xs text-foreground/60">Selected: {uploadName}</p>
          )}
          <div>
            <Button onClick={handleSave}>Save Section</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
            Preview
          </p>
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            {seeYouTitle || 'See You in Church'}
          </h3>
          <p className="text-sm text-foreground/70 mb-4">
            {seeYouSubtitle || 'Grow deeper in your walk with God this week.'}
          </p>
          <div
            className="h-44 rounded-xl bg-cover bg-center border border-border/60"
            style={{ backgroundImage: `url(${seeYouImageUrl || '/home/see-you-in-church.JPG'})` }}
          />
        </div>
      </div>
    </div>
  );
}
