'use client';

import { toast } from 'sonner';

type ApiMessageOptions = {
  fallback?: string;
};

export async function readApiMessage(response: Response, options: ApiMessageOptions = {}) {
  const fallback = options.fallback || response.statusText || 'Request failed.';

  try {
    const data = await response.clone().json();
    return (
      data?.message ||
      data?.error ||
      data?.detail ||
      data?.details ||
      fallback
    );
  } catch {
    try {
      const text = await response.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

export function adminSuccessToast(message: string) {
  toast.success(message, {
    duration: 4000,
  });
}

export function adminErrorToast(message: string) {
  toast.error(message, {
    duration: 6000,
  });
}

export async function adminToastFromResponse(
  response: Response,
  messages: {
    success: string;
    error: string;
  }
) {
  if (response.ok) {
    adminSuccessToast(messages.success);
    return messages.success;
  }

  const message = await readApiMessage(response, { fallback: messages.error });
  adminErrorToast(message);
  return message;
}
