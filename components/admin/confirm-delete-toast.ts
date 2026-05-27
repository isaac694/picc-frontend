'use client';

import type { ReactNode } from 'react';
import { toast } from 'sonner';

type ConfirmDeleteToastOptions = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function confirmDeleteToast({
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmDeleteToastOptions) {
  const toastId = toast(title, {
    description,
    duration: Infinity,
    action: {
      label: confirmLabel,
      onClick: () => {
        toast.dismiss(toastId);
        void onConfirm();
      },
    },
    cancel: {
      label: cancelLabel,
      onClick: () => toast.dismiss(toastId),
    },
  });

  return toastId;
}
