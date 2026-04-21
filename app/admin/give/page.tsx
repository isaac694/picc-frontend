'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const DEFAULT_GIVING_TYPES = [
  'First Fruit',
  'Sunday Service',
  'Tithe',
  'Project Offering',
  'Thanks Giving',
  "Prophet's Offering",
];

export default function AdminGivePage() {
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
  const [givingTypes, setGivingTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');

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
    } catch (error) {
      setStatus('Failed to fetch giving types.');
      setGivingTypes(DEFAULT_GIVING_TYPES);
    }
  };

  const saveGivingTypes = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/giving-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(givingTypes),
      });

      if (response.ok) {
        setStatus('Giving types updated successfully.');
      } else {
        setStatus('Failed to update giving types.');
      }
    } catch (error) {
      setStatus('Failed to update giving types.');
    }
  };

  const handleAddType = () => {
    if (!newType.trim()) {
      setStatus('Please enter a giving type.');
      return;
    }

    if (givingTypes.includes(newType.trim())) {
      setStatus('This giving type already exists.');
      return;
    }

    setGivingTypes([...givingTypes, newType.trim()]);
    setNewType('');
    setStatus('');
  };

  const handleRemoveType = (type: string) => {
    setGivingTypes(givingTypes.filter((t) => t !== type));
    setStatus('');
  };

  useEffect(() => {
    if (token) {
      fetchGivingTypes();
    }
  }, [token]);

  if (!token) {
    return <AdminLoginCard {...{ email, password, loginError, setEmail, setPassword, handleLogin }} />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin - Give Page</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {status && (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            {status}
          </div>
        )}

        {/* Add New Giving Type */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Giving Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-type">Giving Type Name</Label>
              <Input
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., Building Fund"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddType();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddType} disabled={!newType.trim()}>
              Add Type
            </Button>
          </CardContent>
        </Card>

        {/* Existing Giving Types */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Giving Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {givingTypes.length > 0 ? (
                <>
                  {givingTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-4 border rounded-lg bg-background"
                    >
                      <span className="font-medium text-foreground">{type}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveType(type)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button onClick={saveGivingTypes} className="w-full mt-4" variant="default">
                    Save Changes
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No giving types found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
