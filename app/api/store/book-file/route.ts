import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { PROJECT_BOOKS_DIR, PROJECT_BOOKS_UPLOAD_PREFIX } from '@/lib/project-uploads';

export const runtime = 'nodejs';

const MAX_BYTES = 40 * 1024 * 1024;

function localBookPath(downloadUrl: string) {
  if (!downloadUrl.startsWith(PROJECT_BOOKS_UPLOAD_PREFIX)) return null;
  const filename = path.basename(downloadUrl);
  if (!/^[a-z0-9.-]+\.pdf$/i.test(filename)) return null;
  const filePath = path.resolve(PROJECT_BOOKS_DIR, filename);
  if (!filePath.startsWith(path.resolve(PROJECT_BOOKS_DIR))) return null;
  return filePath;
}

async function readBookBytes(downloadUrl: string) {
  const localPath = localBookPath(downloadUrl);
  if (localPath) {
    const bytes = await readFile(localPath);
    if (bytes.byteLength > MAX_BYTES) return null;
    return bytes;
  }

  let url: URL;
  try {
    url = new URL(downloadUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
  const response = await fetch(url, { redirect: 'error', cache: 'no-store' });
  if (!response.ok) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return null;
  return bytes;
}

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const purchaseId = new URL(request.url).searchParams.get('purchaseId')?.trim() || '';
  if (!authorization.startsWith('Bearer ') || !purchaseId) {
    return NextResponse.json({ error: 'Sign in to read this book.' }, { status: 401 });
  }

  const access = await fetch(`${API_BASE_URL}/api/store/library/${encodeURIComponent(purchaseId)}/read`, {
    headers: { Authorization: authorization },
    cache: 'no-store',
  });
  const accessData = (await access.json().catch(() => null)) as { downloadUrl?: string; error?: string } | null;
  if (!access.ok) {
    return NextResponse.json({ error: accessData?.error || 'This book is not available.' }, { status: access.status });
  }

  const downloadUrl = String(accessData?.downloadUrl || '').trim();
  const bytes = downloadUrl ? await readBookBytes(downloadUrl).catch(() => null) : null;
  if (!bytes) {
    return NextResponse.json({ error: 'This book file could not be opened.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="book.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
