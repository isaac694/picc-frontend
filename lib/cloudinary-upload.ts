/**
 * Cloudinary upload helpers (browser / client components).
 *
 * Uses unsigned uploads via an upload preset — safe for the client when the preset
 * is restricted in the Cloudinary dashboard (folder, format, size, etc.).
 *
 * Setup:
 * 1. Cloudinary Dashboard → Settings → Upload → Upload presets
 * 2. Add preset → Signing mode: **Unsigned**
 * 3. Set folder / allowed formats as needed
 * 4. In `.env.local`:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
 *
 * Deleting assets requires API secret signing — use a backend route, not this file.
 */

const DEFAULT_CLOUD_NAME = 'hovqgu5o';
const DEFAULT_UPLOAD_PRESET = 'PICC_Documment';

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export type CloudinaryUploadResult = {
  url: string;
  public_id: string;
  format?: string;
  bytes?: number;
  created_at?: string;
  width?: number;
  height?: number;
};

export type ImageUploadOptions = {
  maxSizeMB?: number;
  allowedTypes?: string[];
  onProgress?: (percent: number) => void;
};

export type FileUploadOptions = {
  onProgress?: (percent: number) => void;
};

const cloudName = () =>
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()) ||
  DEFAULT_CLOUD_NAME;

const uploadPreset = () =>
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim()) ||
  DEFAULT_UPLOAD_PRESET;

const apiBase = () => `https://api.cloudinary.com/v1_1/${cloudName()}`;

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

function fileSizeMb(file: File) {
  return file.size / (1024 * 1024);
}

function parseCloudinaryErrorMessage(body: unknown, status: number) {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  return `Upload failed with status ${status}`;
}

function toUploadResult(data: Record<string, unknown>): CloudinaryUploadResult {
  const secureUrl = typeof data.secure_url === 'string' ? data.secure_url : '';
  if (!secureUrl) {
    const message =
      data.error && typeof data.error === 'object' && 'message' in data.error
        ? String((data.error as { message?: string }).message)
        : 'Upload failed — no URL returned';
    throw new Error(message);
  }

  return {
    url: secureUrl,
    public_id: String(data.public_id ?? ''),
    format: typeof data.format === 'string' ? data.format : undefined,
    bytes: typeof data.bytes === 'number' ? data.bytes : undefined,
    created_at: typeof data.created_at === 'string' ? data.created_at : undefined,
    ...(typeof data.width === 'number' ? { width: data.width } : {}),
    ...(typeof data.height === 'number' ? { height: data.height } : {}),
  };
}

function buildFormData(
  file: File,
  folder?: string,
  extraFields?: Record<string, string>,
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset());
  if (folder) formData.append('folder', folder);
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }
  return formData;
}

function uploadEndpoint(resourceType: CloudinaryResourceType) {
  return resourceType === 'auto'
    ? `${apiBase()}/auto/upload`
    : `${apiBase()}/${resourceType}/upload`;
}

function postUploadWithProgress(
  file: File,
  resourceType: CloudinaryResourceType,
  folder?: string,
  extraFields?: Record<string, string>,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  const formData = buildFormData(file, folder, extraFields);
  const endpoint = uploadEndpoint(resourceType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        reject(new Error('Upload failed — invalid response from Cloudinary.'));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const message = parseCloudinaryErrorMessage(data, xhr.status);
        if (message.toLowerCase().includes('upload preset')) {
          reject(
            new Error(
              'Upload preset not found or not unsigned. Create an unsigned upload preset in the Cloudinary dashboard.',
            ),
          );
          return;
        }
        reject(new Error(message));
        return;
      }

      try {
        onProgress?.(100);
        resolve(toUploadResult(data));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Upload failed.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Failed to upload file. Check your network connection and try again.'));
    };

    xhr.send(formData);
  });
}

async function postUpload(
  file: File,
  resourceType: CloudinaryResourceType,
  folder?: string,
  extraFields?: Record<string, string>,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  if (typeof XMLHttpRequest !== 'undefined') {
    return postUploadWithProgress(file, resourceType, folder, extraFields, onProgress);
  }

  const formData = buildFormData(file, folder, extraFields);
  const endpoint = uploadEndpoint(resourceType);

  let response: Response;
  try {
    response = await fetch(endpoint, { method: 'POST', body: formData });
  } catch {
    throw new Error('Failed to upload file. Check your network connection and try again.');
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message = parseCloudinaryErrorMessage(data, response.status);
    if (message.toLowerCase().includes('upload preset')) {
      throw new Error(
        'Upload preset not found or not unsigned. Create an unsigned upload preset in the Cloudinary dashboard.',
      );
    }
    throw new Error(message);
  }

  onProgress?.(100);
  return toUploadResult(data);
}

/** Folder paths under the PICC Cloudinary account */
export const CLOUDINARY_FOLDERS = {
  GENERAL: 'picc',
  WEBSITE_ADS: 'picc/website-ads',
  BANNERS: 'picc/banners',
  NEWS: 'picc/news',
  EVENTS: 'picc/events',
  MEDIA: 'picc/media',
  PAGE_IMAGES: 'picc/page-images',
  HR_DOCUMENTS: 'picc/hr/documents',
  HR_LEADERSHIP: 'picc/hr/leadership',
  SCHOOL: 'picc/school',
  MINISTRY: 'picc/ministry',
  STORE: 'picc/store',
  SERMONS: 'picc/sermons',
  USER_AVATARS: 'picc/avatars',
  DOCUMENTS: 'picc/documents',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/**
 * Upload an image with type and size validation.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryFolder = CLOUDINARY_FOLDERS.GENERAL,
  options: ImageUploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const {
    maxSizeMB = 20,
    allowedTypes = [...DEFAULT_IMAGE_TYPES],
    onProgress,
  } = options;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (fileSizeMb(file) > maxSizeMB) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  try {
    return await postUpload(file, 'image', folder, undefined, onProgress);
  } catch (error) {
    if (error instanceof Error && error.message.includes('File size')) throw error;
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
  }
}

/**
 * Upload any supported file (images, video, raw documents) with resource type `auto` by default.
 */
export async function uploadFileToCloudinary(
  file: File,
  folder: CloudinaryFolder = CLOUDINARY_FOLDERS.GENERAL,
  resourceType: CloudinaryResourceType = 'auto',
  options: FileUploadOptions = {},
): Promise<CloudinaryUploadResult> {
  try {
    const extra =
      resourceType !== 'auto' ? { resource_type: resourceType } : undefined;
    return await postUpload(file, resourceType, folder, extra, options.onProgress);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('upload preset')) throw error;
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
  }
}

/**
 * Upload several images in parallel.
 */
export async function uploadMultipleImagesToCloudinary(
  files: File[],
  folder: CloudinaryFolder = CLOUDINARY_FOLDERS.GENERAL,
  options: ImageUploadOptions = {},
): Promise<CloudinaryUploadResult[]> {
  try {
    return await Promise.all(files.map((file) => uploadImageToCloudinary(file, folder, options)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload one or more images: ${message}`);
  }
}

export function uploadWebsiteAdBanner(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.WEBSITE_ADS, { maxSizeMB: 5, onProgress });
}

export function uploadBannerImage(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.BANNERS, { maxSizeMB: 5, onProgress });
}

export function uploadNewsImage(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.NEWS, { maxSizeMB: 10, onProgress });
}

export function uploadEventImage(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.EVENTS, { maxSizeMB: 10, onProgress });
}

export function uploadPageImage(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.PAGE_IMAGES, { maxSizeMB: 10, onProgress });
}

export function uploadUserAvatar(file: File, onProgress?: (percent: number) => void) {
  return uploadImageToCloudinary(file, CLOUDINARY_FOLDERS.USER_AVATARS, { maxSizeMB: 5, onProgress });
}

export function uploadHrDocument(file: File, onProgress?: (percent: number) => void) {
  return uploadFileToCloudinary(file, CLOUDINARY_FOLDERS.HR_DOCUMENTS, 'raw', { onProgress });
}
