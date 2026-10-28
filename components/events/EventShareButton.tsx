'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, QrCode, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { publicEventPath } from '@/lib/public-event';

type EventShareButtonProps = {
  eventId: string;
  title: string;
  tone?: 'hero' | 'light';
};

export default function EventShareButton({ eventId, title, tone = 'light' }: EventShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    const path = publicEventPath(eventId);
    if (!path) return;
    setPageUrl(`${window.location.origin}${path}`);
    setCanNativeShare(typeof navigator.share === 'function');
  }, [eventId]);

  useEffect(() => {
    if (!open || !pageUrl) return;
    let cancelled = false;
    setQr('');
    import('qrcode')
      .then((mod) => {
        const api = typeof mod.default?.toDataURL === 'function' ? mod.default : mod;
        return api.toDataURL(pageUrl, {
          width: 320,
          margin: 2,
          color: { dark: '#10233f', light: '#ffffff' },
        });
      })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => {
        if (!cancelled) setQr('');
      });
    return () => {
      cancelled = true;
    };
  }, [open, pageUrl]);

  const copyLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
    } catch {
      const input = document.createElement('textarea');
      input.value = pageUrl;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      setCopied(document.execCommand('copy'));
      input.remove();
    }
    window.setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!pageUrl || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title, text: title, url: pageUrl });
    } catch {
      // The share sheet was closed.
    }
  };

  const downloadQr = () => {
    if (!qr) return;
    const slug = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
    const link = document.createElement('a');
    link.href = qr;
    link.download = `${slug}-qr.png`;
    link.click();
  };

  const whatsappHref = pageUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${title}\n${pageUrl}`)}`
    : '';

  return (
    <>
      {tone === 'hero' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      ) : (
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this event</DialogTitle>
            <DialogDescription>
              Copy the page link, send it on WhatsApp, or let someone scan the QR code to open this event.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-border bg-white p-3">
              {qr ? (
                // The QR image is a generated data URL, which next/image does not accept.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR code for ${title}`} className="h-full w-full" />
              ) : (
                <QrCode className="h-10 w-10 text-foreground/30" />
              )}
            </div>
            <p className="w-full break-all rounded-xl bg-muted px-3 py-2 text-center text-xs text-foreground/70">{pageUrl || 'Preparing link...'}</p>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button type="button" className="rounded-full" onClick={copyLink} disabled={!pageUrl}>
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              {whatsappHref ? (
                <Button type="button" variant="outline" className="rounded-full" asChild>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              {canNativeShare ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={nativeShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="rounded-full" onClick={downloadQr} disabled={!qr}>
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
