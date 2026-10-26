import path from 'path';
import {
  PROJECT_BOOKS_UPLOAD_PREFIX,
  PROJECT_PAGE_IMAGES_UPLOAD_PREFIX,
} from '@/lib/project-page-images-upload';

export { PROJECT_BOOKS_UPLOAD_PREFIX, PROJECT_PAGE_IMAGES_UPLOAD_PREFIX };

export const PROJECT_PAGE_IMAGES_DIR = path.join(
  process.cwd(),
  'public',
  'uploads',
  'page-images',
);

export const PROJECT_BOOKS_DIR = path.join(
  process.cwd(),
  'public',
  'uploads',
  'books',
);

export function sanitizePdfFilename() {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
}

export function sanitizeUploadFilename(originalName: string) {
  const ext = path.extname(originalName || '').toLowerCase();
  const safeExt = /^\.(jpe?g|png|gif|webp|avif|heic|heif)$/.test(ext) ? ext : '.jpg';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}
