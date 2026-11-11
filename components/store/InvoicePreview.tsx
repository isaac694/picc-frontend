'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { invoiceHtml, type StoreInvoice } from '@/lib/store-invoice';

// An A4 page at 96 dpi.
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/**
 * Shows a document exactly as it prints, shrunk to fit the space it is given, so a phone sees the
 * whole page rather than a sideways-scrolling strip. `render` builds the page's HTML for an origin.
 */
export function DocumentPreview({ render, title, className }: { render: (origin: string) => string; title: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(PAGE_HEIGHT);
  // Only ever rendered after the document has loaded in the browser, so window is there.
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(Math.min(1, box.clientWidth / PAGE_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const html = useMemo(() => (origin ? render(origin) : ''), [render, origin]);

  // Long documents run past one page; size the frame to its content.
  const measure = () => {
    const page = frameRef.current?.contentDocument?.querySelector('.page') as HTMLElement | null;
    if (page) setHeight(Math.max(PAGE_HEIGHT, page.scrollHeight));
  };

  return (
    <div ref={boxRef} className={className}>
      <div style={{ height: height * scale }} className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/10">
        {html ? (
          <iframe
            ref={frameRef}
            title={title}
            srcDoc={html}
            onLoad={measure}
            style={{ width: PAGE_WIDTH, height, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function InvoicePreview({ invoice, className }: { invoice: StoreInvoice; className?: string }) {
  const render = useMemo(() => (origin: string) => invoiceHtml(invoice, origin), [invoice]);
  return <DocumentPreview render={render} title={`Invoice ${invoice.invoiceNumber}`} className={className} />;
}
