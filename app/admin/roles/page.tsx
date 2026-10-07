'use client';

import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ADMIN_ACCESS_RIGHT, ADMIN_ACCESS_RIGHT_OPTIONS } from '@/lib/admin-pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { confirmDeleteToast } from '@/components/admin/confirm-delete-toast';

type RoleRow = {
  id: string;
  name: string;
  description: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isSystem?: boolean;
  accessRights?: string[];
};

type RoleFormState = {
  name: string;
  description: string;
};

type AccessRightOption = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};

type AccessRightGroup = {
  key: string;
  name: string;
  description: string;
  assigned: AccessRightOption[];
  unassigned: AccessRightOption[];
};

const EMPTY_FORM: RoleFormState = {
  name: '',
  description: '',
};

const extractRightName = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const right = value as Record<string, unknown>;
  const name = right.name ?? right.key ?? right.code;
  return typeof name === 'string' ? name : null;
};

const normalizeRightList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [])
    .map(extractRightName)
    .filter((right): right is string => Boolean(right));

const normalizeAccessRightOption = (value: unknown): AccessRightOption | null => {
  if (!value || typeof value !== 'object') return null;

  const right = value as Record<string, unknown>;
  const name = String(right.name ?? right.key ?? right.code ?? '').trim();
  const id = String(right.id ?? right._id ?? name).trim();
  if (!name) return null;

  return {
    id,
    name,
    description: String(right.description ?? '').trim(),
    sortOrder: typeof right.sortOrder === 'number' ? right.sortOrder : 0,
  };
};

const normalizeAccessGroupsResponse = (value: unknown): AccessRightGroup[] => {
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  const groups = Array.isArray(record.groups) ? record.groups : [];

  return groups
    .map((groupValue) => {
      if (!groupValue || typeof groupValue !== 'object') return null;

      const groupRecord = groupValue as Record<string, unknown>;
      const group = (groupRecord.group || {}) as Record<string, unknown>;
      const assigned = (Array.isArray(groupRecord.assignedAccessRights) ? groupRecord.assignedAccessRights : [])
        .map(normalizeAccessRightOption)
        .filter((right): right is AccessRightOption => Boolean(right))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const unassigned = (Array.isArray(groupRecord.unassignedAccessRights) ? groupRecord.unassignedAccessRights : [])
        .map(normalizeAccessRightOption)
        .filter((right): right is AccessRightOption => Boolean(right))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        key: String(group.key ?? groupRecord.key ?? groupRecord.groupKey ?? '').trim(),
        name: String(group.name ?? groupRecord.name ?? groupRecord.groupName ?? 'Access Rights').trim(),
        description: String(group.description ?? groupRecord.description ?? '').trim(),
        assigned,
        unassigned,
      };
    })
    .filter((group): group is AccessRightGroup => Boolean(group));
};

const fallbackAccessGroups = (): AccessRightGroup[] =>
  ADMIN_ACCESS_RIGHT_OPTIONS.map((group) => ({
    key: group.entity,
    name: group.label,
    description: group.description,
    assigned: [],
    unassigned: group.rights.map((right, index) => ({
      id: right.name,
      name: right.name,
      description: right.description,
      sortOrder: index,
    })),
  }));

const isAssignedRight = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  return [
    record.assigned,
    record.isAssigned,
    record.granted,
    record.isGranted,
    record.checked,
    record.selected,
    record.hasAccess,
  ].some(Boolean);
};

const extractRightCandidate = (value: unknown) => {
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  return record.accessRight ?? record.right ?? record.permission ?? value;
};

const normalizeRole = (value: unknown): RoleRow | null => {
  if (!value || typeof value !== 'object') return null;

  const role = value as Record<string, unknown>;
  const id = String(role.id ?? role._id ?? '').trim();
  const name = String(role.name ?? '').trim();

  if (!id || !name) return null;

  const rawUserCount = role.userCount ?? role.usersCount ?? role.membersCount;
  const userCount = typeof rawUserCount === 'number' ? rawUserCount : undefined;

  return {
    id,
    name,
    description: String(role.description ?? '').trim(),
    userCount,
    createdAt: typeof role.createdAt === 'string' ? role.createdAt : undefined,
    updatedAt: typeof role.updatedAt === 'string' ? role.updatedAt : undefined,
    isSystem: Boolean(role.isSystem ?? role.system),
    accessRights: normalizeRightList(role.accessRightNames ?? role.permissions ?? role.accessRights ?? role.rights),
  };
};

const normalizeRoleAccessResponse = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    const groupAssignedRights = value.flatMap((group) => {
      if (!group || typeof group !== 'object') return [];
      const record = group as Record<string, unknown>;
      return normalizeRightList(
        record.assignedAccessRights ??
          record.assignedRights ??
          record.assignedPermissions ??
          record.permissionsAssigned ??
          record.assigned ??
          []
      );
    });

    if (groupAssignedRights.length) return groupAssignedRights;

    const flaggedRights = value
      .filter(isAssignedRight)
      .map(extractRightCandidate)
      .map(extractRightName)
      .filter((right): right is string => Boolean(right));

    if (flaggedRights.length) return flaggedRights;

    return normalizeRightList(value);
  }

  if (!value || typeof value !== 'object') return fallback;

  const record = value as Record<string, unknown>;

  const wrapped =
    record.data ??
    record.roleAccessRights ??
    record.accessRightGroups ??
    record.groups;

  if (wrapped && wrapped !== value) {
    const normalized = normalizeRoleAccessResponse(wrapped, []);
    if (normalized.length) return normalized;
  }

  const assignedArrays = [
    record.assignedAccessRights,
    record.assignedRights,
    record.assignedPermissions,
    record.permissionsAssigned,
    record.assigned,
  ];

  for (const source of assignedArrays) {
    const normalized = normalizeRightList(source);
    if (normalized.length) return normalized;
  }

  const maybeMixedArrays = [record.permissions, record.accessRights, record.rights];
  for (const source of maybeMixedArrays) {
    if (!Array.isArray(source)) continue;

    const flaggedRights = source
      .filter(isAssignedRight)
      .map(extractRightCandidate)
      .map(extractRightName)
      .filter((right): right is string => Boolean(right));

    if (flaggedRights.length) return flaggedRights;

    const normalized = normalizeRightList(source);
    if (normalized.length) return normalized;
  }

  if (isAssignedRight(record)) {
    const name = extractRightName(extractRightCandidate(record));
    return name ? [name] : fallback;
  }

  return fallback;
};

const normalizeRolesResponse = (value: unknown): RoleRow[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { roles?: unknown[] })?.roles)
      ? (value as { roles: unknown[] }).roles
      : Array.isArray((value as { data?: unknown[] })?.data)
        ? (value as { data: unknown[] }).data
        : [];

  return source.map(normalizeRole).filter((role): role is RoleRow => Boolean(role));
};

const toLocal = (iso?: string) => {
  if (!iso) return '-';
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleDateString();
};

export default function AdminRolesPage() {
  const { token, user, can } = useAdminAuth();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessRole, setAccessRole] = useState<RoleRow | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessGroups, setAccessGroups] = useState<AccessRightGroup[]>([]);
  const [assignedRights, setAssignedRights] = useState<Set<string>>(new Set());
  const [originalAssignedRights, setOriginalAssignedRights] = useState<Set<string>>(new Set());

  const canListRoles = can(ADMIN_ACCESS_RIGHT.ROLE_LIST);
  const canCreateRoles = can(ADMIN_ACCESS_RIGHT.ROLE_CREATE);
  const canEditRoles = can(ADMIN_ACCESS_RIGHT.ROLE_EDIT);
  const canDeleteRoles = can(ADMIN_ACCESS_RIGHT.ROLE_DELETE);
  const canManageAccessRights = can(ADMIN_ACCESS_RIGHT.ROLE_ACCESS_RIGHTS_MANAGE);

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return roles;

    return roles.filter((role) =>
      [role.name, role.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    );
  }, [roles, search]);

  const fetchRoles = async () => {
    if (!token) return;

    setLoading(true);
    setStatus('');

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

      setRoles(normalizeRolesResponse(data));
    } catch {
      setStatus('Unable to load roles.');
      adminErrorToast('Unable to load roles.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !canListRoles) return;
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canListRoles]);

  const openCreateDialog = () => {
    if (!canCreateRoles) return;
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleRow) => {
    if (!canEditRoles || role.isSystem) return;
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setStatus('');

    if (editingRole && !canEditRoles) {
      setStatus('You do not have permission to edit roles.');
      adminErrorToast('You do not have permission to edit roles.');
      return;
    }

    if (!editingRole && !canCreateRoles) {
      setStatus('You do not have permission to create roles.');
      adminErrorToast('You do not have permission to create roles.');
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setStatus('Role name is required.');
      adminErrorToast('Role name is required.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(
        editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles',
        {
          method: editingRole ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || data.message || `Unable to ${editingRole ? 'update' : 'create'} role.`;
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || (editingRole ? 'Role updated.' : 'Role created.');
      setStatus(message);
      adminSuccessToast(message);
      setDialogOpen(false);
      setEditingRole(null);
      setForm(EMPTY_FORM);
      await fetchRoles();
    } catch {
      const message = `Unable to ${editingRole ? 'update' : 'create'} role.`;
      setStatus(message);
      adminErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleRow) => {
    if (!token) return;
    setStatus('');

    if (!canDeleteRoles || role.isSystem) {
      setStatus('You do not have permission to delete this role.');
      adminErrorToast('You do not have permission to delete this role.');
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || data.message || 'Unable to delete role.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || 'Role deleted.';
      setStatus(message);
      adminSuccessToast(message);
      await fetchRoles();
    } catch {
      setStatus('Unable to delete role.');
      adminErrorToast('Unable to delete role.');
    }
  };

  const requestDeleteRole = (role: RoleRow) => {
    confirmDeleteToast({
      title: 'Delete this role?',
      description: role.name,
      onConfirm: () => handleDelete(role),
    });
  };

  const openAccessDialog = async (role: RoleRow) => {
    if (!token || !canManageAccessRights) return;

    setAccessRole(role);
    setAccessDialogOpen(true);
    setAccessLoading(true);
    setStatus('');

    try {
      const response = await apiFetch(`/api/admin/roles/${role.id}/access-rights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallbackRights = role.accessRights || [];
        setAccessGroups(fallbackAccessGroups());
        setAssignedRights(new Set(fallbackRights));
        setOriginalAssignedRights(new Set(fallbackRights));
        const message = data.error || data.message || 'Unable to load role access rights.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const groups = normalizeAccessGroupsResponse(data);
      setAccessGroups(groups.length ? groups : fallbackAccessGroups());
      const normalized = normalizeRoleAccessResponse(data, role.accessRights || []);
      setAssignedRights(new Set(normalized));
      setOriginalAssignedRights(new Set(normalized));
    } catch {
      const fallbackRights = role.accessRights || [];
      setAccessGroups(fallbackAccessGroups());
      setAssignedRights(new Set(fallbackRights));
      setOriginalAssignedRights(new Set(fallbackRights));
      setStatus('Unable to load role access rights.');
      adminErrorToast('Unable to load role access rights.');
    } finally {
      setAccessLoading(false);
    }
  };

  const toggleAssignedRight = (right: string, checked: boolean) => {
    setAssignedRights((current) => {
      const next = new Set(current);
      if (checked) next.add(right);
      else next.delete(right);
      return next;
    });
  };

  const toggleRightGroup = (rights: string[], checked: boolean) => {
    setAssignedRights((current) => {
      const next = new Set(current);
      rights.forEach((right) => {
        if (checked) next.add(right);
        else next.delete(right);
      });
      return next;
    });
  };

  const handleSaveAccessRights = async () => {
    if (!token || !accessRole || !canManageAccessRights) return;

    const nextRights = Array.from(assignedRights);
    if (
      nextRights.length === originalAssignedRights.size &&
      nextRights.every((right) => originalAssignedRights.has(right))
    ) {
      setAccessDialogOpen(false);
      return;
    }

    setAccessSaving(true);
    setStatus('');

    try {
      const response = await apiFetch(`/api/admin/roles/${accessRole.id}/access-rights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accessRightIds: nextRights,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error || data.message || 'Unable to update role access rights.';
        setStatus(message);
        adminErrorToast(message);
        return;
      }

      const message = data.message || 'Role access rights updated.';
      setStatus(message);
      adminSuccessToast(message);
      window.dispatchEvent(
        new CustomEvent('admin-access-rights-updated', {
          detail: {
            roleId: accessRole.id,
            accessRights: data?.role?.accessRightNames || nextRights,
          },
        })
      );
      setAccessDialogOpen(false);
      setAccessRole(null);
      await fetchRoles();
    } catch {
      setStatus('Unable to update role access rights.');
      adminErrorToast('Unable to update role access rights.');
    } finally {
      setAccessSaving(false);
    }
  };

  if (!canListRoles) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <p className="mt-2 text-red-500">You do not have permission to view roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define and manage reusable admin roles.
          </p>
        </div>
        {canCreateRoles ? (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        ) : null}
      </div>

      {status ? (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-foreground">
          {status}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search roles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchRoles} loading={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-4 py-3">Role Name</TableHead>
              <TableHead className="px-4 py-3">Description</TableHead>
              <TableHead className="px-4 py-3">Users</TableHead>
              <TableHead className="px-4 py-3">Created</TableHead>
              <TableHead className="px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">No roles found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a role to start organizing admin permissions.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {role.name}
                    {role.isSystem ? <Badge variant="outline">System</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-md px-4 py-3 text-muted-foreground">
                  {role.description || '-'}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {typeof role.userCount === 'number' ? role.userCount : '-'}
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {toLocal(role.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canManageAccessRights ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openAccessDialog(role)}
                        aria-label={`Manage access rights for ${role.name}`}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(role)}
                      disabled={role.isSystem || !canEditRoles}
                      aria-label={`Edit ${role.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => requestDeleteRole(role)}
                      disabled={role.isSystem || !canDeleteRoles}
                      aria-label={`Delete ${role.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update this role name and description.'
                : 'Create a new role that can be assigned by the admin backend.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Ministry Editor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe what this role is for..."
                rows={4}
              />
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <KeyRound className="h-4 w-4" />
                Access rights
              </div>
              Use the key button in the roles table to assign access rights.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {saving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Access Rights{accessRole ? ` - ${accessRole.name}` : ''}</DialogTitle>
            <DialogDescription>
              Grant or revoke the permissions this role should receive.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {accessLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading access rights...</p>
            ) : null}

            {!accessLoading && accessGroups.map((group) => {
              const rights = [...group.assigned, ...group.unassigned].sort((a, b) => a.sortOrder - b.sortOrder);
              const rightNames = rights.map((right) => right.name);
              const allGranted = rightNames.length > 0 && rightNames.every((right) => assignedRights.has(right));

              return (
                <section key={group.key || group.name} className="rounded-2xl border border-border/60 bg-card">
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 p-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      {group.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                      ) : null}
                    </div>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={allGranted}
                        onCheckedChange={(checked) => toggleRightGroup(rightNames, Boolean(checked))}
                      />
                      Grant all
                    </label>
                  </div>

                  <div className="divide-y divide-border/60">
                    {rights.map((right) => (
                      <label
                        key={right.name}
                        className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <Checkbox
                          className="mt-1"
                          checked={assignedRights.has(right.name)}
                          onCheckedChange={(checked) => toggleAssignedRight(right.name, Boolean(checked))}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground">{right.name}</span>
                          {right.id !== right.name ? (
                            <span className="block text-xs text-muted-foreground">{right.id}</span>
                          ) : null}
                          {right.description ? (
                            <span className="mt-1 block text-sm text-muted-foreground">{right.description}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccessRights} loading={accessSaving} disabled={accessLoading}>
              {accessSaving ? 'Saving...' : 'Save Access Rights'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
