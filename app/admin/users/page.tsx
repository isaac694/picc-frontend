'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import {
  ADMIN_ACCESS_RIGHT,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { Eye, EyeOff, Plus } from 'lucide-react';

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

type RoleOption = {
  id: string;
  name: string;
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

const normalizeRoleOptions = (value: unknown): RoleOption[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { roles?: unknown[] })?.roles)
      ? (value as { roles: unknown[] }).roles
      : Array.isArray((value as { data?: unknown[] })?.data)
        ? (value as { data: unknown[] }).data
        : [];

  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = item as Record<string, unknown>;
      const id = String(role.id ?? role._id ?? '').trim();
      const name = String(role.name ?? '').trim();
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((role): role is RoleOption => Boolean(role));
};

export default function AdminUsersPage() {
  const {
    token,
    email,
    password,
    loginError,
    setEmail,
    setPassword,
    handleLogin,
    can,
  } = useAdminAuth();

  const [status, setStatus] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
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

  const canListUsers = can(ADMIN_ACCESS_RIGHT.USER_LIST);
  const canCreateUsers = can(ADMIN_ACCESS_RIGHT.USER_CREATE);
  const canEditUsers = can(ADMIN_ACCESS_RIGHT.USER_EDIT);
  const canDeleteUsers = can(ADMIN_ACCESS_RIGHT.USER_DELETE);

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

  const fetchRoles = async () => {
    if (!token || !canCreateUsers) return;

    setRolesLoading(true);

    try {
      const response = await apiFetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || data.message || 'Unable to load roles.';
        setStatus(message);
        adminErrorToast(message);
        setRoles([]);
        return;
      }

      const normalized = normalizeRoleOptions(data);
      setRoles(normalized);
      setCreateForm((current) => ({
        ...current,
        roleId: current.roleId || normalized[0]?.id || '',
      }));
    } catch {
      setStatus('Unable to load roles.');
      adminErrorToast('Unable to load roles.');
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !canListUsers) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canListUsers]);

  useEffect(() => {
    if (!token || !canCreateUsers || !createDialogOpen) return;
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canCreateUsers, createDialogOpen]);

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

  const toggleEditPage = (key: AdminPageKey) => {
    setEditForm((prev) => {
      const next = new Set(prev.adminPageAccess);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, adminPageAccess: Array.from(next) };
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

    if (!canCreateUsers) {
      setStatus('You do not have permission to create users.');
      adminErrorToast('You do not have permission to create users.');
      return;
    }

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim() || !createForm.roleId) {
      setStatus('Name, email, password, and role are required.');
      adminErrorToast('Name, email, password, and role are required.');
      return;
    }

    setCreateLoading(true);

    try {
      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: createForm.email.trim(),
          name: createForm.name.trim(),
          password: createForm.password,
          role: 'ADMIN',
          roleId: createForm.roleId,
          adminAccessAll: false,
          isApproved: true,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || data.message || 'Unable to create user.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || 'User created.';
      setStatus(message);
      adminSuccessToast(message);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        roleId: roles[0]?.id || '',
      });
      setCreateDialogOpen(false);
      await fetchUsers();
    } catch {
      setStatus('Unable to create user.');
      adminErrorToast('Unable to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingUser) return;
    setStatus('');

    if (!canEditUsers) {
      setStatus('You do not have permission to edit users.');
      adminErrorToast('You do not have permission to edit users.');
      return;
    }

    setUpdateLoading(true);

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
        const message = data.error || data.message || 'Unable to update user.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || 'User updated.';
      setStatus(message);
      adminSuccessToast(message);
      setEditingId(null);
      await fetchUsers();
    } catch {
      setStatus('Unable to update user.');
      adminErrorToast('Unable to update user.');
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!token) return;
    setStatus('');

    if (!canDeleteUsers) {
      setStatus('You do not have permission to delete users.');
      adminErrorToast('You do not have permission to delete users.');
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || data.message || 'Unable to delete user.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || 'User deleted.';
      setStatus(message);
      adminSuccessToast(message);
      await fetchUsers();
    } catch {
      setStatus('Unable to delete user.');
      adminErrorToast('Unable to delete user.');
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

  if (!canListUsers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70 mb-2">Admin</p>
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
        </div>
        <p className="text-red-500">You do not have permission to view users.</p>
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
        <div className="flex items-center gap-3">
          {canCreateUsers ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          ) : null}
        </div>
      </div>

      {status && (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          {status}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button variant="outline" onClick={fetchUsers} loading={loading}>
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
                      {canEditUsers ? (
                        <Button variant="outline" size="sm" onClick={() => setEditingId(u.id)}>
                          Edit
                        </Button>
                      ) : null}
                      {canDeleteUsers ? (
                        <Button variant="destructive" size="sm" onClick={() => requestDeleteUser(u)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingUser && canEditUsers && (
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
              <Button onClick={handleUpdate} loading={updateLoading}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create an approved admin user and assign a role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-name">Name</Label>
              <Input
                id="create-user-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Admin User"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-password">Password</Label>
              <div className="relative">
                <Input
                  id="create-user-password"
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="pr-12"
                  placeholder="password123"
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-role">Role</Label>
              <select
                id="create-user-role"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={createForm.roleId}
                onChange={(e) => setCreateForm((p) => ({ ...p, roleId: e.target.value }))}
                disabled={rolesLoading}
              >
                <option value="">{rolesLoading ? 'Loading roles...' : 'Select role'}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                The request sends role as ADMIN, with adminAccessAll false and isApproved true.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={createLoading}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
