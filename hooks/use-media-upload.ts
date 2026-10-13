'use client';

import { useCallback, useState } from 'react';
import {
  uploadMediaFile,
  uploadMediaFileWithKind,
  type MediaUploadPurpose,
  type MediaUploadWithKind,
} from '@/lib/media-upload';

export function useMediaUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const runUpload = useCallback(async (file: File, purpose: MediaUploadPurpose) => {
    setUploading(true);
    setProgress(0);
    try {
      return await uploadMediaFile(file, purpose, { onProgress: setProgress });
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 500);
    }
  }, []);

  const runUploadWithKind = useCallback(async (file: File, purpose: MediaUploadPurpose = 'media') => {
    setUploading(true);
    setProgress(0);
    try {
      return await uploadMediaFileWithKind(file, purpose, { onProgress: setProgress });
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 500);
    }
  }, []);

  return {
    runUpload,
    runUploadWithKind,
    progress,
    uploading,
    setProgress,
    setUploading,
  };
}

export type { MediaUploadPurpose, MediaUploadWithKind };
