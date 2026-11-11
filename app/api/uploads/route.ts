import { mkdir, writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { ADMIN_PAGE } from '@/lib/admin-pages';
import {
  PROJECT_PAGE_IMAGES_DIR,
  PROJECT_PAGE_IMAGES_UPLOAD_PREFIX,
  sanitizeUploadFilename,
} from '@/lib/project-uploads';
import { isStorageConfigured, uploadBookPdf } from '@/lib/s3-storage';
import { verifyAdminUploadToken } from '@/lib/verify-admin-upload';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_BOOK_PDF_BYTES = 40 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

function isImageFile(file: File) {
  if (file.type && IMAGE_TYPES.has(file.type)) return true;
  return /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(file.name);
}

function isPdfFile(file: File) {
  if (file.type === 'application/pdf') return true;
  return /\.pdf$/i.test(file.name);
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ') || authorization.trim().length < 16) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
  }

  const purpose = String(formData.get('purpose') || 'page-images').trim();
  const extraPages = purpose === 'store-book' ? [ADMIN_PAGE.STORE_PAGE] : [];
  if (!(await verifyAdminUploadToken(request, extraPages))) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (purpose !== 'page-images' && purpose !== 'store-book') {
    return NextResponse.json({ error: 'Unsupported upload purpose.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }

  if (purpose === 'store-book') {
    if (!isPdfFile(file)) {
      return NextResponse.json({ error: 'Upload a PDF file for the soft copy.' }, { status: 400 });
    }
    if (file.size > MAX_BOOK_PDF_BYTES) {
      return NextResponse.json({ error: 'The PDF must be 40MB or smaller.' }, { status: 400 });
    }
    // Soft copies go privately to the Supabase Storage bucket; the URL returned is saved on the book.
    if (!isStorageConfigured()) {
      return NextResponse.json({ error: 'File storage is not set up on the server (S3 settings missing).' }, { status: 500 });
    }
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      // A real PDF starts with "%PDF"; this stops a renamed file being stored as a book.
      if (bytes.subarray(0, 5).toString('latin1').indexOf('%PDF') === -1) {
        return NextResponse.json({ error: 'That file is not a valid PDF.' }, { status: 400 });
      }
      const url = await uploadBookPdf(bytes);
      return NextResponse.json({ url, storage: 's3' });
    } catch (error) {
      console.error('Book PDF upload to storage failed', error);
      return NextResponse.json({ error: 'Could not save the PDF to storage. Try again.' }, { status: 502 });
    }
  }

  if (!isImageFile(file)) {
    return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        error:
          'Your image file size is too big. Please compress it first before re-uploading. Only pictures less than 1MB are allowed.',
      },
      { status: 400 },
    );
  }

  try {
    await mkdir(PROJECT_PAGE_IMAGES_DIR, { recursive: true });
    const filename = sanitizeUploadFilename(file.name);
    const bytes = await file.arrayBuffer();
    await writeFile(`${PROJECT_PAGE_IMAGES_DIR}/${filename}`, Buffer.from(bytes));

    const url = `${PROJECT_PAGE_IMAGES_UPLOAD_PREFIX}${filename}`;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
