'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface Sermon {
  id: number;
  title: string;
  date: string;
  image: string;
  views: string;
  youtubeUrl: string;
  audioSrc: string;
}

const DEFAULT_SERMON: Omit<Sermon, 'id'> = {
  title: '',
  date: '',
  image: '',
  views: '0',
  youtubeUrl: '',
  audioSrc: '',
};

export default function AdminSermonsPage() {
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
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [headerImage, setHeaderImage] = useState('');
  const [draftSermon, setDraftSermon] = useState(DEFAULT_SERMON);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});

  const normalizeRemoteUrl = (value: string) => {
    if (!value) return '';
    return value.startsWith('http') ? value : apiUrl(value);
  };

  const updateUploadName = (key: string, name: string) => {
    setUploadNames((prev) => ({ ...prev, [key]: name }));
  };

  const uploadFile = async (file: File) => {
    if (!token) return null;
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
        setStatus('File upload failed.');
        return null;
      }

      const data = await response.json();
      return apiUrl(data.url);
    } catch (error) {
      setStatus('File upload failed.');
      return null;
    }
  };

  const fetchSermons = async () => {
    try {
      const response = await apiFetch('/api/sermons');
      if (response.ok) {
        const data = await response.json();
        // Handle different possible response formats
        let sermonsArray: Sermon[] = [];
        if (Array.isArray(data)) {
          sermonsArray = data;
        } else if (data && Array.isArray(data.sermons)) {
          sermonsArray = data.sermons;
        } else if (data && typeof data === 'object') {
          // If it's an object but not an array, assume it's a single sermon
          sermonsArray = [data as Sermon];
        }
        setSermons(sermonsArray);
      } else {
        setSermons([]);
      }
    } catch (error) {
      setStatus('Failed to fetch sermons.');
      setSermons([]);
    }
  };

  const fetchHeaderImage = async () => {
    try {
      const response = await apiFetch('/api/site-content/sermons-header-image');
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          setHeaderImage(normalizeRemoteUrl(data.imageUrl));
        }
      }
    } catch (error) {
      // Header image will remain empty
    }
  };

  const saveHeaderImage = async () => {
    if (!token || !headerImage) return;

    try {
      const response = await apiFetch('/api/site-content/sermons-header-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: headerImage }),
      });

      if (response.ok) {
        setStatus('Header image updated successfully.');
      } else {
        setStatus('Failed to update header image.');
      }
    } catch (error) {
      setStatus('Failed to update header image.');
    }
  };

  const handleAddSermon = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/sermons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draftSermon),
      });

      if (response.ok) {
        setStatus('Sermon added successfully.');
        setDraftSermon(DEFAULT_SERMON);
        fetchSermons();
      } else {
        setStatus('Failed to add sermon.');
      }
    } catch (error) {
      setStatus('Failed to add sermon.');
    }
  };

  const handleUpdateSermon = async (id: number) => {
    if (!token) return;

    try {
      const response = await apiFetch(`/api/sermons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draftSermon),
      });

      if (response.ok) {
        setStatus('Sermon updated successfully.');
        setDraftSermon(DEFAULT_SERMON);
        setEditingId(null);
        fetchSermons();
      } else {
        setStatus('Failed to update sermon.');
      }
    } catch (error) {
      setStatus('Failed to update sermon.');
    }
  };

  const handleDeleteSermon = async (id: number) => {
    if (!token) return;

    try {
      const response = await apiFetch(`/api/sermons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStatus('Sermon deleted successfully.');
        fetchSermons();
      } else {
        setStatus('Failed to delete sermon.');
      }
    } catch (error) {
      setStatus('Failed to delete sermon.');
    }
  };

  const startEditing = (sermon: Sermon) => {
    setDraftSermon({
      title: sermon.title || '',
      date: sermon.date || '',
      image: sermon.image || '',
      views: sermon.views || '0',
      youtubeUrl: sermon.youtubeUrl || '',
      audioSrc: sermon.audioSrc || '',
    });
    setEditingId(sermon.id);
  };

  const cancelEditing = () => {
    setDraftSermon(DEFAULT_SERMON);
    setEditingId(null);
  };

  useEffect(() => {
    if (token) {
      fetchSermons();
      fetchHeaderImage();
    }
  }, [token]);

  if (!token) {
    return <AdminLoginCard {...{ email, password, loginError, setEmail, setPassword, handleLogin }} />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin - Sermons</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {status && (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            {status}
          </div>
        )}

        {/* Header Image Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sermons Page Header Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="header-upload">Upload Header Image</Label>
              <Input
                id="header-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateUploadName('header', file.name);
                    const url = await uploadFile(file);
                    if (url) {
                      setHeaderImage(url);
                      updateUploadName('header', '');
                    }
                  }
                }}
              />
              {uploadNames.header && (
                <p className="text-sm text-muted-foreground mt-1">Uploading: {uploadNames.header}</p>
              )}
            </div>
            <Button onClick={saveHeaderImage} disabled={!headerImage}>
              Save Header Image
            </Button>
          </CardContent>
        </Card>

        {/* Add/Edit Sermon Section */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Sermon' : 'Add New Sermon'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draftSermon.title}
                  onChange={(e) => setDraftSermon(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Sermon title"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={draftSermon.date}
                  onChange={(e) => setDraftSermon(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="e.g., 10 April, 2025"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                value={draftSermon.youtubeUrl}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <Label htmlFor="views">Views</Label>
              <Input
                id="views"
                value={draftSermon.views}
                onChange={(e) => setDraftSermon(prev => ({ ...prev, views: e.target.value }))}
                placeholder="e.g., 1,232"
              />
            </div>

            <div>
              <Label htmlFor="image-upload">Upload Sermon Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateUploadName('image', file.name);
                    const url = await uploadFile(file);
                    if (url) {
                      setDraftSermon(prev => ({ ...prev, image: url }));
                      updateUploadName('image', '');
                    }
                  }
                }}
              />
              {uploadNames.image && (
                <p className="text-sm text-muted-foreground mt-1">Uploading: {uploadNames.image}</p>
              )}
            </div>

            <div>
              <Label htmlFor="audio-upload">Upload Audio File</Label>
              <Input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateUploadName('audio', file.name);
                    const url = await uploadFile(file);
                    if (url) {
                      setDraftSermon(prev => ({ ...prev, audioSrc: url }));
                      updateUploadName('audio', '');
                    }
                  }
                }}
              />
              {uploadNames.audio && (
                <p className="text-sm text-muted-foreground mt-1">Uploading: {uploadNames.audio}</p>
              )}
            </div>

            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={() => handleUpdateSermon(editingId)}>
                    Update Sermon
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddSermon} disabled={!draftSermon.title || !draftSermon.youtubeUrl}>
                  Add Sermon
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Sermons */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Sermons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(sermons || []).filter(sermon => sermon && typeof sermon === 'object' && sermon.id).map((sermon) => (
                <div key={sermon.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{sermon.title || 'Untitled'}</h3>
                    <p className="text-sm text-muted-foreground">{sermon.date || 'No date'} • {sermon.views || '0'} views</p>
                    <p className="text-sm text-muted-foreground">YouTube: {sermon.youtubeUrl || 'No URL'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEditing(sermon)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSermon(sermon.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {(sermons || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No sermons found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}