'use client';

import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  websiteAdInitials,
  websiteAdThumbnailSource,
  type WebsiteAd,
} from '@/lib/website-ads';

type WebsiteAdThumbnailProps = {
  ad: Pick<WebsiteAd, 'name' | 'url' | 'imageUrl'>;
  className?: string;
  priority?: boolean;
  /** cover = cropped hero; contain = full image (public popup); intrinsic = admin cards */
  variant?: 'cover' | 'contain' | 'intrinsic';
};

export default function WebsiteAdThumbnail({
  ad,
  className,
  priority = false,
  variant = 'cover',
}: WebsiteAdThumbnailProps) {
  const src = websiteAdThumbnailSource(ad);
  const initials = websiteAdInitials(ad.name);

  if (src && (variant === 'intrinsic' || variant === 'contain')) {
    const imgClass =
      variant === 'contain'
        ? 'mx-auto block h-auto max-h-[min(62vh,480px)] w-full object-contain'
        : 'mx-auto block h-auto max-h-36 w-full object-contain';

    return (
      <div
        className={cn(
          'overflow-hidden',
          variant === 'contain' ? 'bg-muted/30 px-3 py-3 sm:px-4 sm:py-4' : 'bg-muted/30',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={ad.name || 'Ad preview'}
          className={imgClass}
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>
    );
  }

  if (src) {
    const useNativeImage = /^https?:\/\//i.test(src) && !src.includes('/uploads');

    return (
      <div className={cn('relative overflow-hidden bg-muted', className)}>
        {useNativeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={ad.name || 'Ad preview'}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <Image
            src={src}
            alt={ad.name || 'Ad preview'}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>
    );
  }

  const placeholderShell = cn(
    'relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-sky-900',
    className,
    variant === 'intrinsic' && 'min-h-28 py-5',
  );

  return (
    <div className={placeholderShell}>
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 px-4 text-center text-primary-foreground',
          variant === 'cover' && 'h-full gap-3 px-6',
        )}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm',
            variant === 'intrinsic' ? 'h-10 w-10' : 'h-14 w-14 rounded-2xl',
          )}
        >
          <Megaphone className={variant === 'intrinsic' ? 'h-4 w-4' : 'h-6 w-6'} aria-hidden />
        </span>
        {variant === 'cover' ? (
          <>
            <span className="text-3xl font-semibold tracking-tight">{initials}</span>
            {ad.name ? (
              <p className="line-clamp-2 max-w-[90%] text-sm font-medium text-primary-foreground/90">{ad.name}</p>
            ) : null}
          </>
        ) : (
          <span className="text-lg font-semibold tracking-tight">{initials}</span>
        )}
      </div>
    </div>
  );
}
