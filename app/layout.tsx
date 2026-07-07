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
  icons: {
    icon: '/logos/favicon.ico',
    apple: '/logos/favicon.ico',
  },
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
      <head>
        <link rel="icon" href="/logos/picc-logo.png" />
        <link rel="shortcut icon" href="/logos/picc-logo.png" />
        <link rel="apple-touch-icon" href="/logos/picc-logo.png" />
      </head>
      <body>
        <AdminThemeSync />
        {children}
        <Toaster richColors closeButton />
        <ScrollActions />
      </body>
    </html>
  );

}
