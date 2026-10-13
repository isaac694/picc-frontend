import {
  CLOUDINARY_FOLDERS,
  uploadFileToCloudinary,
  uploadImageToCloudinary,
  type CloudinaryResourceType,
} from '@/lib/cloudinary-upload';

export type MediaUploadPurpose =
  | 'website-ads'
  | 'news'
  | 'school'
  | 'events'
  | 'ministry'
  | 'page-images'
  | 'media'
  | 'store'
  | 'sermons'
  | 'hr-leadership'
  | 'general';

type PurposeConfig = {
  folder: (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
  maxSizeMB: number;
  imageOnly?: boolean;
  resourceType?: CloudinaryResourceType;
};

const PURPOSE_CONFIG: Record<MediaUploadPurpose, PurposeConfig> = {
  'website-ads': { folder: CLOUDINARY_FOLDERS.WEBSITE_ADS, maxSizeMB: 5, imageOnly: true },
  news: { folder: CLOUDINARY_FOLDERS.NEWS, maxSizeMB: 10, imageOnly: true },
  school: { folder: CLOUDINARY_FOLDERS.SCHOOL, maxSizeMB: 10, imageOnly: true },
  events: { folder: CLOUDINARY_FOLDERS.EVENTS, maxSizeMB: 10, imageOnly: true },
  ministry: { folder: CLOUDINARY_FOLDERS.MINISTRY, maxSizeMB: 1, imageOnly: true },
  'page-images': { folder: CLOUDINARY_FOLDERS.PAGE_IMAGES, maxSizeMB: 10, imageOnly: true },
  media: { folder: CLOUDINARY_FOLDERS.MEDIA, maxSizeMB: 50, resourceType: 'auto' },
  store: { folder: CLOUDINARY_FOLDERS.STORE, maxSizeMB: 10, imageOnly: true },
  sermons: { folder: CLOUDINARY_FOLDERS.SERMONS, maxSizeMB: 100, resourceType: 'auto' },
  'hr-leadership': { folder: CLOUDINARY_FOLDERS.HR_LEADERSHIP, maxSizeMB: 5, imageOnly: true },
  general: { folder: CLOUDINARY_FOLDERS.GENERAL, maxSizeMB: 10, imageOnly: true },
};

export type MediaUploadOptions = {
  onProgress?: (percent: number) => void;
  /** Override default max size for this purpose */
  maxSizeMB?: number;
};

function resolveResourceType(file: File, fallback: CloudinaryResourceType): CloudinaryResourceType {
  if (fallback !== 'auto') return fallback;
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) return 'video';
  return 'raw';
}

/**
 * Upload a file to Cloudinary and return the public HTTPS URL for API payloads.
 */
export async function uploadMediaFile(
  file: File,
  purpose: MediaUploadPurpose,
  options: MediaUploadOptions = {},
): Promise<string> {
  const config = PURPOSE_CONFIG[purpose];
  const maxSizeMB = options.maxSizeMB ?? config.maxSizeMB;

  if (config.imageOnly && !file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.');
  }

  const onProgress = options.onProgress;

  if (config.imageOnly) {
    const result = await uploadImageToCloudinary(file, config.folder, {
      maxSizeMB,
      onProgress,
    });
    return result.url;
  }

  const resourceType = resolveResourceType(file, config.resourceType ?? 'auto');
  const result = await uploadFileToCloudinary(file, config.folder, resourceType, { onProgress });
  return result.url;
}

export type MediaUploadWithKind = {
  url: string;
  kind: 'audio' | 'video';
};

export async function uploadMediaFileWithKind(
  file: File,
  purpose: MediaUploadPurpose = 'media',
  options: MediaUploadOptions = {},
): Promise<MediaUploadWithKind> {
  const url = await uploadMediaFile(file, purpose, options);
  const kind = file.type.startsWith('audio/') ? 'audio' : 'video';
  return { url, kind };
}
