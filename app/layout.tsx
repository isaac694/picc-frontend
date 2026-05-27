// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ScrollActions from '@/components/ScrollActions';
import { Toaster } from '@/components/ui/sonner';
import AdminThemeSync from '@/components/admin/AdminThemeSync';

/**
 * Metadata (SEO, title, description, icons, etc.)
 */
export const metadata: Metadata = {
  title: 'Church Website - Welcome to Our Community',
  description:
    'Join our church community for worship, fellowship, and spiritual growth. ' +
    'Sunday services, prayer requests, livestreams, and more.',
  generator: 'v0.app',
  // icons: {
  //   icon: [
  //     {
  //       url: '/icon-light-32x32.png',
  //       media: '(prefers-color-scheme: light)',
  //     },
  //     {
  //       url: '/icon-dark-32x32.png',
  //       media: '(prefers-color-scheme: dark)',
  //     },
  //     {
  //       url: '/icon.svg',
  //       type: 'image/svg+xml',
  //     },
  //   ],
  //   apple: '/apple-icon.png',
  // },
};

/**
 * Viewport settings (theme color, zoom behavior)
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1419' },
  ],
  userScalable: true,
};

/**
 * Root Layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <AdminThemeSync />
        {children}
        <Toaster richColors closeButton />
        <ScrollActions />
      </body>
    </html>
  );

}
