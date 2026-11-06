'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { codeFromScan } from '@/lib/book-labels';

type DetectedCode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> };
type FrameReader = (video: HTMLVideoElement) => Promise<string | null>;

const SCAN_INTERVAL_MS = 200;
const MAX_FRAME_WIDTH = 800;

/** The browser's own reader handles QR codes and barcodes. Browsers without one, such as Safari on iPhone, get a QR-only reader. */
async function createFrameReader(): Promise<{ read: FrameReader; qrOnly: boolean }> {
  const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
  if (Detector) {
    const detector = new Detector({ formats: ['qr_code', 'code_128'] });
    return { read: async (video) => (await detector.detect(video))[0]?.rawValue || null, qrOnly: false };
  }
  const jsQR = (await import('jsqr')).default;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return {
    qrOnly: true,
    read: async (video) => {
      if (!context || !video.videoWidth) return null;
      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(frame.data, frame.width, frame.height)?.data || null;
    },
  };
}

/** Camera view that reads one book label, then hands its code to `onCode`. */
export default function BookCameraScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [message, setMessage] = useState('Starting camera…');

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopped = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('This browser cannot open the camera here. Type the book title or code instead.');
        return;
      }
      try {
        const { read, qrOnly } = await createFrameReader();
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = media;
        await video.play();
        setMessage(qrOnly ? 'Point the camera at the QR code on the label.' : 'Point the camera at the label.');
        const tick = async () => {
          if (stopped) return;
          try {
            const value = await read(video);
            if (value && !stopped) {
              onCodeRef.current(codeFromScan(value));
              return;
            }
          } catch {
            // Keep trying on the next frame.
          }
          timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
        };
        void tick();
      } catch {
        if (!stopped) setMessage('The camera could not start. Allow camera access, or type the book title or code.');
      }
    };
    void start();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-black p-2">
      <video ref={videoRef} className="aspect-video w-full rounded bg-black object-cover" muted playsInline />
      <div className="flex items-center justify-between gap-2 text-xs text-white/80">
        <span role="status">{message}</span>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>Close camera</Button>
      </div>
    </div>
  );
}
