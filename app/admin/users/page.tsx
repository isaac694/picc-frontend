'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { apiFetch } from '@/lib/api';
import { ADMIN_ACCESS_RIGHT } from '@/lib/admin-pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  roleId?: string | null;
  assignedRole?: {
    id?: string | null;
    name?: string | null;
  } | null;
  adminAccessAll: boolean;
  isApproved?: boolean;
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

const resolveUserRoleId = (user: Pick<UserRow, 'roleId' | 'assignedRole'>) =>
  String(user.roleId || user.assignedRole?.id || '').trim();

const resolveUserRoleName = (user: UserRow) =>
  String(user.assignedRole?.name || user.role || '').trim();

const normalizeUserRows = (value: unknown): UserRow[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { users?: unknown[] })?.users)
      ? (value as { users: unknown[] }).users
      : Array.isArray((value as { data?: unknown[] })?.data)
        ? (value as { data: unknown[] }).data
        : [];

  return source
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const user = item as Record<string, unknown>;
      const id = String(user.id ?? user._id ?? '').trim();
      if (!id) return null;

      const assignedRoleRaw = user.assignedRole;
      const assignedRole =
        assignedRoleRaw && typeof assignedRoleRaw === 'object'
          ? {
              id: String((assignedRoleRaw as { id?: unknown }).id ?? '').trim() || null,
              name: String((assignedRoleRaw as { name?: unknown }).name ?? '').trim() || null,
            }
          : null;
      const roleValue = String(user.role ?? '').trim();

      return {
        id,
        email: String(user.email ?? '').trim(),
        name: String(user.name ?? '').trim(),
        role: isUserRole(roleValue) ? roleValue : 'ADMIN',
        roleId: String(user.roleId ?? assignedRole?.id ?? '').trim() || null,
        assignedRole,
        adminAccessAll: Boolean(user.adminAccessAll),
        isApproved: user.isApproved !== false,
        createdAt: String(user.createdAt ?? ''),
        updatedAt: String(user.updatedAt ?? ''),
      };
    })
    .filter((user): user is UserRow => Boolean(user));
};

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
  const editRoleOptions = useMemo(() => {
    if (!editingUser) return roles;
    const currentId = resolveUserRoleId(editingUser);
    if (!currentId || roles.some((role) => role.id === currentId)) return roles;
    return [
      {
        id: currentId,
        name: resolveUserRoleName(editingUser) || 'Current role',
      },
      ...roles,
    ];
  }, [roles, editingUser]);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
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
      setUsers(normalizeUserRows(data));
    } catch {
      setStatus('Unable to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!token || !(canCreateUsers || canEditUsers)) return;

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
      setEditForm((current) => ({
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
    if (!token || !(canCreateUsers || canEditUsers)) return;
    if (!createDialogOpen && !editingId) return;
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canCreateUsers, canEditUsers, createDialogOpen, editingId]);

  useEffect(() => {
    if (!editingUser) return;
    setShowEditPassword(false);
    setEditForm({
      name: editingUser.name,
      email: editingUser.email,
      password: '',
      roleId: resolveUserRoleId(editingUser),
    });
  }, [editingUser]);

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

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.roleId) {
      setStatus('Name, email, and role are required.');
      adminErrorToast('Name, email, and role are required.');
      return;
    }

    setUpdateLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editingUser.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
        roleId: editForm.roleId,
        adminAccessAll: false,
        isApproved: true,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const response = await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
            Create and edit admin users, then assign them a role.
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
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/40">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{resolveUserRoleName(u) || u.role}</td>
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

      <Dialog
        open={Boolean(editingUser) && canEditUsers}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update this user and assign a role. Leave the password blank to keep the current one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Name</Label>
              <Input
                id="edit-user-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Updated User"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-password">New Password (optional)</Label>
              <div className="relative">
                <Input
                  id="edit-user-password"
                  type={showEditPassword ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  className="pr-12"
                  placeholder="Leave blank to keep current password"
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
              <Label htmlFor="edit-user-role">Role</Label>
              <select
                id="edit-user-role"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={editForm.roleId}
                onChange={(e) => setEditForm((p) => ({ ...p, roleId: e.target.value }))}
                disabled={rolesLoading}
              >
                <option value="">{rolesLoading ? 'Loading roles...' : 'Select role'}</option>
                {editRoleOptions.map((role) => (
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
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={updateLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
