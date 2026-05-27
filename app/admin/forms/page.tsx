'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { apiFetch, apiUrl } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const FORM_IMAGE_ITEMS = [
  {
    key: 'membership-form-image',
    label: 'Membership Form Image',
    description: 'Update the image shown beside the membership form.',
    fallback: '/images/our-church.JPG',
  },
  {
    key: 'testimony-form-image',
    label: 'Testimony Form Image',
    description: 'Update the image shown beside the testimony form.',
    fallback: '/images/send-message-2.JPG',
  },
  {
    key: 'prayer-form-image',
    label: 'Prayer Request Image',
    description: 'Update the image shown beside the prayer request form.',
    fallback: '/images/our-church.JPG',
  },
];

export default function FormsAdminPage() {
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
  const [formImages, setFormImages] = useState<Record<string, string>>({});
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const normalizeImageUrl = (value: string) =>
    value.startsWith('http') ? value : apiUrl(value);

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  useEffect(() => {
    if (!token) return;

    const fetchImages = async () => {
      setLoading(true);
      const entries = await Promise.all(
        FORM_IMAGE_ITEMS.map(async (item) => {
          try {
            const response = await apiFetch(`/api/site-content/${item.key}`);
            if (!response.ok) {
              return [item.key, item.fallback] as const;
            }
            const data = await response.json();
            const imageUrl = data.imageUrl ? normalizeImageUrl(data.imageUrl) : item.fallback;
            return [item.key, imageUrl] as const;
          } catch (error) {
            return [item.key, item.fallback] as const;
          }
        })
      );
      setFormImages(Object.fromEntries(entries));
      setLoading(false);
    };

    fetchImages();
  }, [token]);

  const uploadImage = async (file: File) => {
    if (!token) return null;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
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
      return normalizeImageUrl(data.url);
    } catch (error) {
      setStatus('Image upload failed.');
      return null;
    }
  };

  const saveImage = async (key: string) => {
    if (!token) return;
    setStatus('');
    try {
      const response = await apiFetch(`/api/site-content/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: formImages[key] || null }),
      });
      if (!response.ok) {
        setStatus('Unable to save form image.');
        return;
      }
      setStatus('Form image updated successfully.');
    } catch (error) {
      setStatus('Unable to save form image.');
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
            Forms Images
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Update the pictures used on the membership, testimony, and prayer forms.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className="text-sm text-foreground/70">{status}</p>}

      <div className="space-y-6">
        {FORM_IMAGE_ITEMS.map((item) => (
          <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">
                  {item.label}
                </p>
                <p className="text-sm text-foreground/60">{item.description}</p>
              </div>
              <Button variant="outline" onClick={() => saveImage(item.key)} disabled={loading}>
                Save Image
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden border border-border/60 bg-background h-72">
                  <img
                    src={formImages[item.key] || item.fallback}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif,.avif"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (!url) return;
                      setFormImages((prev) => ({ ...prev, [item.key]: url }));
                      updateUploadName(item.key, file.name);
                    }}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  {uploadNames[item.key] && (
                    <p className="text-xs text-foreground/60 mt-2">Selected: {uploadNames[item.key]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setFormImages((prev) => ({ ...prev, [item.key]: '' }))}
                >
                  Remove Image
                </Button>
                <p className="text-sm text-foreground/60">
                  Use this image for the form panel. Leave blank to revert to the default image.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
