'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import {
  ADMIN_PAGE,
  ADMIN_PAGE_OPTIONS,
  MINISTRY_ADMIN_OPTIONS,
  ministryAdminAccessKey,
  type AdminPageKey,
  type MinistryAdminKey,
} from '@/lib/admin-pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { Eye, EyeOff } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  adminAccessAll: boolean;
  adminPageAccess: string[];
  createdAt: string;
  updatedAt: string;
};

const isUserRole = (value: string): value is UserRow['role'] =>
  value === 'USER' || value === 'ADMIN' || value === 'SUPER_ADMIN';

const toLocal = (iso: string) => {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleString();
};

const ministryKeysFromAccess = (access: string[]) =>
  MINISTRY_ADMIN_OPTIONS
    .filter((ministry) => access.includes(ministryAdminAccessKey(ministry.key)))
    .map((ministry) => ministry.key);

const pageKeysFromAccess = (access: string[]) =>
  access.filter((key) => !key.startsWith('MINISTRY:') && key !== ADMIN_PAGE.MINISTRIES) as AdminPageKey[];

const buildAdminPageAccess = (pageKeys: AdminPageKey[], ministryKeys: MinistryAdminKey[]) => [
  ...pageKeys,
  ...ministryKeys.map((key) => ministryAdminAccessKey(key)),
];

export default function AdminUsersPage() {
  const {
    token,
    user: me,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as UserRow['role'],
    adminAccessAll: false,
    adminPageAccess: [] as AdminPageKey[],
    adminMinistryAccess: [] as MinistryAdminKey[],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingUser = useMemo(() => users.find((u) => u.id === editingId) || null, [users, editingId]);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as UserRow['role'],
    adminAccessAll: false,
    adminPageAccess: [] as AdminPageKey[],
    adminMinistryAccess: [] as MinistryAdminKey[],
  });

  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setStatus('');
    try {
      const response = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setStatus(err.error || 'Unable to load users.');
        setUsers([]);
        return;
      }
      const data = await response.json();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setStatus('Unable to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !isSuperAdmin) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isSuperAdmin]);

  useEffect(() => {
    if (!editingUser) return;
    setEditForm({
      name: editingUser.name,
      email: editingUser.email,
      password: '',
      role: editingUser.role,
      adminAccessAll: Boolean(editingUser.adminAccessAll),
      adminPageAccess: pageKeysFromAccess(editingUser.adminPageAccess || []),
      adminMinistryAccess: ministryKeysFromAccess(editingUser.adminPageAccess || []),
    });
  }, [editingUser]);

  const toggleCreatePage = (key: AdminPageKey) => {
    setCreateForm((prev) => {
      const next = new Set(prev.adminPageAccess);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, adminPageAccess: Array.from(next) };
    });
  };

  const toggleEditPage = (key: AdminPageKey) => {
    setEditForm((prev) => {
      const next = new Set(prev.adminPageAccess);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, adminPageAccess: Array.from(next) };
    });
  };

  const toggleCreateMinistry = (key: MinistryAdminKey) => {
    setCreateForm((prev) => {
      const next = new Set(prev.adminMinistryAccess);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, adminMinistryAccess: Array.from(next) };
    });
  };

  const toggleEditMinistry = (key: MinistryAdminKey) => {
    setEditForm((prev) => {
      const next = new Set(prev.adminMinistryAccess);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, adminMinistryAccess: Array.from(next) };
    });
  };

  const handleCreate = async () => {
    if (!token) return;
    setStatus('');

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setStatus('Name, email, and password are required.');
      return;
    }

    try {
      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
          adminAccessAll: createForm.role === 'ADMIN' ? createForm.adminAccessAll : true,
          adminPageAccess:
            createForm.role === 'ADMIN' && !createForm.adminAccessAll
              ? buildAdminPageAccess(createForm.adminPageAccess, createForm.adminMinistryAccess)
              : [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(data.error || 'Unable to create user.');
        return;
      }

      setStatus('User created.');
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN',
        adminAccessAll: false,
        adminPageAccess: [],
        adminMinistryAccess: [],
      });
      await fetchUsers();
    } catch {
      setStatus('Unable to create user.');
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingUser) return;
    setStatus('');

    try {
      const response = await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          password: editForm.password.trim() ? editForm.password : undefined,
          role: editForm.role,
          adminAccessAll: editForm.role === 'ADMIN' ? editForm.adminAccessAll : true,
          adminPageAccess:
            editForm.role === 'ADMIN' && !editForm.adminAccessAll
              ? buildAdminPageAccess(editForm.adminPageAccess, editForm.adminMinistryAccess)
              : [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(data.error || 'Unable to update user.');
        return;
      }

      setStatus('User updated.');
      setEditingId(null);
      await fetchUsers();
    } catch {
      setStatus('Unable to update user.');
    }
  };
  const handleDelete = async (id: string) => {
    if (!token) return;
    setStatus('');

    try {
      const response = await apiFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(data.error || 'Unable to delete user.');
        return;
      }

      setStatus('User deleted.');
      await fetchUsers();
    } catch {
      setStatus('Unable to delete user.');
    }
  };

  const requestDeleteUser = (user: UserRow) => {
    confirmDeleteToast({
      title: 'Delete this user?',
      description: user.email || user.name || 'This user will be permanently removed.',
      onConfirm: () => handleDelete(user.id),
    });
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

  if (!isSuperAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        <p className="text-red-500">Super admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
          <h1 className="text-3xl font-semibold">User Management</h1>
          <p className="text-foreground/70 mt-2">
            Create admins and control which admin pages and ministries they can access.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>

      {status && (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          {status}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Add User</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showCreatePassword ? 'text' : 'password'}
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword((prev) => !prev)}
                aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-foreground/60 hover:text-foreground"
              >
                {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-foreground/60">For now, the super admin sets the initial password here.</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={createForm.role}
              onChange={(e) => {
                const role = e.target.value;
                if (isUserRole(role)) {
                  setCreateForm((p) => ({ ...p, role }));
                }
              }}
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">User</option>
            </select>
          </div>
        </div>

        {createForm.role === 'ADMIN' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={createForm.adminAccessAll}
                onCheckedChange={(v) => setCreateForm((p) => ({ ...p, adminAccessAll: Boolean(v) }))}
              />
              <span className="text-sm">Allow access to all admin pages</span>
            </div>

            {!createForm.adminAccessAll && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ADMIN_PAGE_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm rounded-lg border border-border/60 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={createForm.adminPageAccess.includes(opt.key)}
                        onChange={() => toggleCreatePage(opt.key)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Ministries</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {MINISTRY_ADMIN_OPTIONS.map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2 text-sm rounded-lg border border-border/60 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={createForm.adminMinistryAccess.includes(opt.key)}
                          onChange={() => toggleCreateMinistry(opt.key)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <Button onClick={handleCreate}>Create User</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/70 border-b border-border/60">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Access</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/40">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4">
                    {u.role === 'ADMIN'
                      ? u.adminAccessAll
                        ? 'All pages'
                        : `${pageKeysFromAccess(u.adminPageAccess || []).length} pages, ${ministryKeysFromAccess(u.adminPageAccess || []).length} ministries`
                      : u.role === 'SUPER_ADMIN'
                        ? 'All pages'
                        : '-'}
                  </td>
                  <td className="py-2 pr-4">{toLocal(u.createdAt)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(u.id)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => requestDeleteUser(u)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingUser && (
          <div className="mt-6 rounded-xl border border-border/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">Edit User</h3>
              <Button variant="ghost" onClick={() => setEditingId(null)}>Close</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>New Password (optional)</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((prev) => !prev)}
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-foreground/60 hover:text-foreground"
                  >
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={editForm.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    if (isUserRole(role)) {
                      setEditForm((p) => ({ ...p, role }));
                    }
                  }}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="USER">User</option>
                </select>
              </div>
            </div>

            {editForm.role === 'ADMIN' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={editForm.adminAccessAll}
                    onCheckedChange={(v) => setEditForm((p) => ({ ...p, adminAccessAll: Boolean(v) }))}
                  />
                  <span className="text-sm">Allow access to all admin pages</span>
                </div>

                {!editForm.adminAccessAll && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ADMIN_PAGE_OPTIONS.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm rounded-lg border border-border/60 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={editForm.adminPageAccess.includes(opt.key)}
                            onChange={() => toggleEditPage(opt.key)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Ministries</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MINISTRY_ADMIN_OPTIONS.map((opt) => (
                          <label key={opt.key} className="flex items-center gap-2 text-sm rounded-lg border border-border/60 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={editForm.adminMinistryAccess.includes(opt.key)}
                              onChange={() => toggleEditMinistry(opt.key)}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleUpdate}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
