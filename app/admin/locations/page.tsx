'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Edit, Plus } from 'lucide-react';

type Branch = {
  id: string;
  region: string;
  name: string;
  pastor: string;
  location: string;
  phone: string;
  email: string;
};

const regions = [
  { id: 'lilongwe', label: 'Lilongwe' },
  { id: 'central', label: 'Other Central' },
  { id: 'southern', label: 'Southern Region' },
  { id: 'northern', label: 'Northern Region' },
  { id: 'international', label: 'International' },
] as const;

const defaultBranches: Branch[] = [
  {
    id: '1',
    region: 'lilongwe',
    name: 'PICC Headquarters',
    pastor: 'Apostle Grace Malenga',
    location: 'Area 49, New Gulliver',
    phone: '+265 992 433 333',
    email: 'apostle@picc.org.mw',
  },
  {
    id: '2',
    region: 'lilongwe',
    name: 'Old Town Mega Church',
    pastor: 'Pastor John Mwale',
    location: 'Malangalanga, Lilongwe',
    phone: '+265 882 433 333',
    email: 'john@picc.org.mw',
  },
  {
    id: '3',
    region: 'lilongwe',
    name: 'Hope Tabernacle Mega Church',
    pastor: 'Prophetess Doris Banda',
    location: 'Airwing 4ways, Lilongwe',
    phone: '+265 999 111 222',
    email: 'doris@picc.org.mw',
  },
];

const IMAGE_ITEMS = [
  { key: 'locations-header-bg', label: 'Header Background', fallback: '/images/locations-header.png' },
] as const;

const normalizeImageUrl = (value?: string | null) => {
  if (!value) return '';
  return value.startsWith('http') ? value : apiUrl(value);
};

export default function LocationsAdminPage() {
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
  const [saving, setSaving] = useState(false);
  const [pageImages, setPageImages] = useState<Record<string, string>>({});
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for editing/adding
  const [formData, setFormData] = useState({
    region: '',
    name: '',
    pastor: '',
    location: '',
    phone: '',
    email: '',
  });

  const updatePageImage = (key: string, value: string) => {
    setPageImages((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (file: File) => {
    if (!token) return null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return normalizeImageUrl(data.url);
    } catch {
      return null;
    }
  };

  const fetchImageContent = async (key: string): Promise<string> => {
    try {
      const response = await apiFetch(`"/api/site-content/${key}"${key}`);
      if (!response.ok) return '';
      const data = await response.json();
      return normalizeImageUrl(data.imageUrl ?? '');
    } catch {
      return '';
    }
  };

  const saveImageContent = async (key: string, imageUrl: string) => {
    if (!token) return;
    try {
      await apiFetch(`/api/site-content/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiFetch('/api/site-content/locations-data');
      if (response.ok) {
        const data = await response.json();
        if (data.body) {
          setBranches(JSON.parse(data.body));
        } else {
          setBranches(defaultBranches);
        }
      } else {
        setBranches(defaultBranches);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches(defaultBranches);
    }
  };

  const saveBranches = async (updatedBranches: Branch[]) => {
    if (!token) return;
    try {
      await apiFetch('/api/site-content/locations-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: JSON.stringify(updatedBranches) }),
      });
      setBranches(updatedBranches);
      setStatus('Locations updated successfully.');
    } catch (error) {
      setStatus('Failed to save locations.');
    }
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setStatus('');
      const entries = await Promise.all(
        IMAGE_ITEMS.map(async (item) => {
          const url = await fetchImageContent(item.key);
          return [item.key, url] as const;
        }),
      );
      setPageImages(Object.fromEntries(entries));
      await fetchBranches();
    };

    load();
  }, [token]);

  const handleSaveImages = async () => {
    if (!token) return;
    setSaving(true);
    setStatus('');
    try {
      await Promise.all(
        IMAGE_ITEMS.map((item) => saveImageContent(item.key, pageImages[item.key] || '')),
      );
      setStatus('Header image updated.');
    } catch {
      setStatus('Unable to save header image.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      region: branch.region,
      name: branch.name,
      pastor: branch.pastor,
      location: branch.location,
      phone: branch.phone,
      email: branch.email,
    });
  };

  const handleAddNewBranch = () => {
    setIsAddingNew(true);
    setFormData({
      region: '',
      name: '',
      pastor: '',
      location: '',
      phone: '',
      email: '',
    });
  };

  const handleSaveBranch = async () => {
    if (!formData.name.trim() || !formData.region) {
      setStatus('Please fill in at least the branch name and region.');
      return;
    }

    const updatedBranches = [...branches];
    if (editingBranch) {
      const index = updatedBranches.findIndex(b => b.id === editingBranch.id);
      if (index !== -1) {
        updatedBranches[index] = { ...editingBranch, ...formData };
      }
    } else {
      const newBranch: Branch = {
        id: Date.now().toString(),
        ...formData,
      };
      updatedBranches.push(newBranch);
    }

    await saveBranches(updatedBranches);
    setEditingBranch(null);
    setIsAddingNew(false);
  };

  const handleDeleteBranch = async (branchId: string) => {
    const updatedBranches = branches.filter(b => b.id !== branchId);
    await saveBranches(updatedBranches);
    setDeleteConfirm(null);
  };

  const handleCancelEdit = () => {
    setEditingBranch(null);
    setIsAddingNew(false);
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
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.35em] text-primary/70 mb-2'>
            Admin
          </p>
          <h1 className='text-3xl md:text-5xl font-semibold text-foreground'>
            Church Locations
          </h1>
          <p className='text-foreground/70 mt-3 max-w-2xl'>
            Manage church locations, update the header image, and edit branch information.
          </p>
        </div>
        <Button variant='outline' onClick={handleLogout}>
          Log out
        </Button>
      </div>

      {status && <p className='text-sm text-foreground/70'>{status}</p>}

      {/* Header Image Section */}
      <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>Header Image</h2>
            <p className='text-sm text-foreground/60'>
              Update the background image shown on the locations page header.
            </p>
          </div>
          <Button variant='outline' onClick={handleSaveImages} disabled={saving}>
            {saving ? 'Saving...' : 'Save Image'}
          </Button>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {IMAGE_ITEMS.map((item) => {
            const currentUrl = pageImages[item.key] || '';
            const previewUrl = currentUrl || item.fallback;
            const selectedName = uploadNames[item.key] || '';

            return (
              <div key={item.key} className='rounded-2xl border border-border/60 bg-background p-4'>
                <div className='flex items-center justify-between gap-3 mb-3'>
                  <div>
                    <p className='text-sm font-semibold text-foreground'>{item.label}</p>
                    <p className='text-[11px] text-foreground/50'>{item.key}</p>
                  </div>
                  <span className='text-[10px] uppercase tracking-[0.2em] text-foreground/40'>
                    {currentUrl ? 'Custom' : 'Default'}
                  </span>
                </div>
                <div
                  className='h-40 rounded-xl border border-border/60 bg-cover bg-center'
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
                <div className='mt-4 space-y-3'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (!url) {
                        setStatus('Image upload failed.');
                        return;
                      }
                      updatePageImage(item.key, url);
                      setUploadNames((prev) => ({ ...prev, [item.key]: file.name }));
                    }}
                    className='block w-full text-sm text-foreground/70 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20'
                  />
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        updatePageImage(item.key, '');
                        setUploadNames((prev) => ({ ...prev, [item.key]: '' }));
                      }}
                    >
                      Use Default
                    </Button>
                  </div>
                  {selectedName && (
                    <p className='text-xs text-foreground/60'>Selected: {selectedName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branches Management Section */}
      <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>Church Branches</h2>
            <p className='text-sm text-foreground/60'>
              Add, edit, or remove church branch locations.
            </p>
          </div>
          <Button onClick={handleAddNewBranch} disabled={isAddingNew || editingBranch !== null}>
            <Plus className='w-4 h-4 mr-2' />
            Add New Branch
          </Button>
        </div>

        {/* Edit/Add Form */}
        {(editingBranch || isAddingNew) && (
          <Card className='p-6 space-y-4'>
            <h3 className='text-lg font-semibold'>
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='region'>Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select region' />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='name'>Branch Name</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder='e.g., PICC Headquarters'
                />
              </div>
              <div>
                <Label htmlFor='pastor'>Pastor</Label>
                <Input
                  id='pastor'
                  value={formData.pastor}
                  onChange={(e) => setFormData(prev => ({ ...prev, pastor: e.target.value }))}
                  placeholder='e.g., Apostle Grace Malenga'
                />
              </div>
              <div>
                <Label htmlFor='location'>Location</Label>
                <Input
                  id='location'
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder='e.g., Area 49, New Gulliver'
                />
              </div>
              <div>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder='e.g., +265 992 433 333'
                />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder='e.g., apostle@picc.org.mw'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button onClick={handleSaveBranch}>
                {editingBranch ? 'Update Branch' : 'Add Branch'}
              </Button>
              <Button variant='outline' onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Branches List */}
        <div className='space-y-4'>
          {branches.length === 0 ? (
            <p className='text-sm text-foreground/60'>No branches yet.</p>
          ) : (
            branches.map((branch) => (
              <Card key={branch.id} className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h4 className='font-semibold'>{branch.name}</h4>
                    <p className='text-sm text-foreground/70'>
                      Region: {regions.find(r => r.id === branch.region)?.label || branch.region}
                    </p>
                    <p className='text-sm text-foreground/70'>Pastor: {branch.pastor}</p>
                    <p className='text-sm text-foreground/70'>Location: {branch.location}</p>
                    <p className='text-sm text-foreground/70'>Phone: {branch.phone}</p>
                    <p className='text-sm text-foreground/70'>Email: {branch.email}</p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditBranch(branch)}
                      disabled={isAddingNew || editingBranch !== null}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setDeleteConfirm(branch.id)}
                      disabled={isAddingNew || editingBranch !== null}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this branch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteBranch(deleteConfirm)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
