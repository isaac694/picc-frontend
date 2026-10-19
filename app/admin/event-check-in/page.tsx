'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { TicketVerification, type EventTicketLookup } from '@/components/events/TicketVerification';

type BarcodeHit = { rawValue?: string };

function readTicketCode(value: string) {
  const match = value.toUpperCase().match(/PICC-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  return match?.[0] || '';
}

export default function AdminEventCheckInPage() {
  const { token } = useAdminAuth();
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<EventTicketLookup | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const lookup = async (nextCode: string) => {
    const normalized = readTicketCode(nextCode) || nextCode.trim().toUpperCase();
    if (!normalized) return;
    setCode(normalized);
    setLoading(true);
    setError('');
    setTicket(null);
    try {
      const response = await apiFetch(`/api/event-tickets/${encodeURIComponent(normalized)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Ticket not found.');
        return;
      }
      setTicket(data.ticket as EventTicketLookup);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    if (!token || !ticket) return;
    setCheckingIn(true);
    setError('');
    try {
      const response = await apiFetch('/api/admin/event-tickets/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: ticket.ticketCode }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || 'Could not check in this ticket.');
        if (data?.ticket) setTicket(data.ticket as EventTicketLookup);
        return;
      }
      setTicket(data.ticket as EventTicketLookup);
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => {
    if (!scanning) return;
    let stop = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    const start = async () => {
      const Detector = (window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<BarcodeHit[]> };
      }).BarcodeDetector;
      if (!Detector || !video) {
        setScanError('This browser cannot scan QR codes. Type the ticket code instead.');
        setScanning(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ['qr_code'] });
        const tick = async () => {
          if (stop) return;
          try {
            const hits = await detector.detect(video);
            const found = readTicketCode(hits[0]?.rawValue || '');
            if (found) {
              setScanning(false);
              void lookup(found);
              return;
            }
          } catch {
            // Keep scanning until the camera frame is ready.
          }
          if (!stop) window.setTimeout(() => { void tick(); }, 250);
        };
        void tick();
      } catch {
        setScanError('Camera access was blocked. Type the ticket code instead.');
        setScanning(false);
      }
    };

    void start();
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [scanning]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(code);
        }}
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="PICC-XXXX-XXXX"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono tracking-widest text-foreground"
          aria-label="Ticket code"
        />
        <button type="submit" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          {loading ? 'Looking up...' : 'Look up'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setScanError('');
          setScanning((current) => !current);
        }}
        className="rounded-full border border-border px-5 py-2 text-sm"
      >
        {scanning ? 'Stop camera' : 'Scan QR code'}
      </button>
      {scanning ? <video ref={videoRef} className="w-full rounded-2xl bg-black" muted playsInline /> : null}
      {scanError ? <p className="text-sm text-red-600">{scanError}</p> : null}
      {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {ticket ? (
        <TicketVerification ticket={ticket} canCheckIn checkingIn={checkingIn} onCheckIn={checkIn} />
      ) : null}
    </div>
  );
}
