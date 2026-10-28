'use client';

import { useEffect, useRef, useState } from 'react';

type ProtectedBookReaderProps = {
  purchaseId: string;
  title: string;
  token: string;
};

export default function ProtectedBookReader({ purchaseId, title, token }: ProtectedBookReaderProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [shielded, setShielded] = useState(false);

  useEffect(() => {
    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const command = event.ctrlKey || event.metaKey;
      if (key === 'printscreen' || (command && ['s', 'p', 'u', 'c'].includes(key))) {
        event.preventDefault();
        setShielded(true);
        window.setTimeout(() => setShielded(false), 1500);
      }
    };
    const blockMenu = (event: Event) => event.preventDefault();
    const hide = () => setShielded(true);
    const show = () => setShielded(document.visibilityState === 'hidden');

    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('visibilitychange', show);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    return () => {
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('visibilitychange', show);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pages = pagesRef.current;
    if (!pages) return undefined;

    const openBook = async () => {
      setLoading(true);
      setError('');
      pages.replaceChildren();
      const response = await fetch(`/api/store/book-file?purchaseId=${encodeURIComponent(purchaseId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'This book could not be opened.');
      }
      const data = new Uint8Array(await response.arrayBuffer());
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data }).promise;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'mx-auto mb-4 block max-w-full bg-white shadow-sm';
        canvas.setAttribute('draggable', 'false');
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) pages.appendChild(canvas);
      }
    };

    openBook()
      .catch((openError: unknown) => {
        if (!cancelled) setError(openError instanceof Error ? openError.message : 'This book could not be opened.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [purchaseId, token]);

  return (
    <div className="protected-book relative mt-8 select-none" onDragStart={(event) => event.preventDefault()}>
      <style>{`
        @media print {
          .protected-book, .protected-book * { display: none !important; }
        }
      `}</style>
      <p className="mb-4 text-sm text-slate-600">Read {title} here. Downloading and printing are turned off.</p>
      {loading ? <p className="text-sm text-slate-500">Opening book...</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div ref={pagesRef} className="relative overflow-hidden bg-slate-100 p-3" />
      {shielded ? <div className="absolute inset-0 bg-slate-950" aria-hidden="true" /> : null}
    </div>
  );
}
