import jwt from 'jsonwebtoken';
import {
  ADMIN_PAGE,
  canAccessAdminPage,
  getAdminUserAccessRights,
  type AdminUser,
} from '@/lib/admin-pages';
import { API_BASE_URL, API_FALLBACK_BASE_URL } from '@/lib/api';

type MeResponse = Record<string, unknown>;

function parseAdminUser(payload: unknown): AdminUser | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as MeResponse;
  const raw = root.user ?? root;
  if (!raw || typeof raw !== 'object') return null;
  const user = raw as AdminUser;
  return {
    ...user,
    accessRights: getAdminUserAccessRights(user),
  };
}

function roleAllowsAdminUpload(role: string | null | undefined) {
  const normalized = String(role ?? '').toUpperCase();
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
}

function hasAdminUploadAccess(user: AdminUser | null, extraPages: string[] = []) {
  if (!user) return false;
  if (canAccessAdminPage(user, ADMIN_PAGE.PAGE_IMAGES)) return true;
  if (extraPages.some((page) => canAccessAdminPage(user, page))) return true;
  if (roleAllowsAdminUpload(user.role)) return true;
  if (user.isSystem || user.assignedRole?.isSystem) return true;
  return false;
}

function roleFromVerifiedToken(token: string): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    return payload.role ? String(payload.role) : null;
  } catch {
    return null;
  }
}

/** Dev fallback when JWT_SECRET is not configured on the Next.js app (token still issued by backend login). */
function roleFromUnverifiedToken(token: string): string | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as {
      role?: string;
    };
    return payload.role ? String(payload.role) : null;
  } catch {
    return null;
  }
}

function expandApiBases(bases: string[]) {
  const out = new Set<string>();
  for (const base of bases) {
    const normalized = base.replace(/\/+$/, '');
    out.add(normalized);
    try {
      const parsed = new URL(normalized);
      if (parsed.hostname === 'localhost') {
        out.add(`${parsed.protocol}//127.0.0.1:${parsed.port || '5000'}`);
      }
    } catch {
      // ignore invalid base URLs
    }
  }
  return [...out];
}

async function fetchAdminUser(token: string): Promise<AdminUser | null> {
  const bases = expandApiBases(
    [API_BASE_URL, API_FALLBACK_BASE_URL].filter(
      (base, index, arr): base is string => Boolean(base) && arr.indexOf(base) === index,
    ),
  );

  for (const base of bases) {
    const url = `${base.replace(/\/+$/, '')}/api/auth/me`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) continue;
      return parseAdminUser(await response.json());
    } catch {
      // try next base URL
    }
  }

  return null;
}

/** Validates Bearer token and homepage-images admin access (same rules as the admin layout). */
export async function verifyAdminUploadToken(request: Request, extraPages: string[] = []): Promise<boolean> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return false;

  const user = await fetchAdminUser(token);
  if (hasAdminUploadAccess(user, extraPages)) return true;

  const jwtRole = roleFromVerifiedToken(token) ?? roleFromUnverifiedToken(token);
  if (roleAllowsAdminUpload(jwtRole)) return true;

  return false;
}
