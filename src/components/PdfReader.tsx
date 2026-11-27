'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function PdfPage({
  doc,
  pageNumber,
  width,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  onVisible: (n: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState(1.414);
  const [near, setNear] = useState(pageNumber <= 2);

  useEffect(() => {
    let cancelled = false;
    doc.getPage(pageNumber).then((page) => {
      const vp = page.getViewport({ scale: 1 });
      if (!cancelled) setAspect(vp.height / vp.width);
    });
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const lazy = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '800px 0px' },
    );
    const current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(pageNumber);
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    lazy.observe(el);
    current.observe(el);
    return () => {
      lazy.disconnect();
      current.disconnect();
    };
  }, [pageNumber, onVisible]);

  useEffect(() => {
    if (!near || !width || !canvasRef.current) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    doc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      task = page.render({ canvasContext: ctx, viewport });
      task.promise.catch(() => undefined);
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, width, near]);

  return (
    <div
      ref={wrapRef}
      id={`page-${pageNumber}`}
      className="mx-auto overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-ink-900/10 dark:ring-gold-500/20"
      style={{ width, height: width * aspect }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-label={`Leaflet page ${pageNumber}`} />
    </div>
  );
}

export default function PdfReader({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const ro = new ResizeObserver(() => setStickyTop(header.getBoundingClientRect().height));
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        loaded = await pdfjs.getDocument(src).promise;
        if (cancelled) loaded.destroy();
        else setDoc(loaded);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = Math.floor(containerWidth * zoom);
  const numPages = doc?.numPages ?? 0;

  return (
    <div>
      <div
        style={{ top: stickyTop }}
        className="sticky z-10 -mx-4 mb-4 flex items-center gap-2 border-b border-gold-500/30 bg-ink-100/95 px-4 py-2 backdrop-blur dark:bg-ink-950/95">
        <button
          className="btn-secondary px-3 py-1.5"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="w-12 text-center text-sm tabular-nums text-ink-600 dark:text-ink-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="btn-secondary px-3 py-1.5"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
        >
          +
        </button>
        {numPages > 0 && (
          <span className="ml-1 text-sm tabular-nums text-ink-600 dark:text-ink-300">
            Page {current} / {numPages}
          </span>
        )}
        <a href={src} download className="btn-primary ml-auto px-3 py-1.5 text-sm">
          Download PDF
        </a>
      </div>

      <div ref={containerRef} className="w-full">
        {error ? (
          <div className="card text-center">
            <p className="mb-3">Couldn&apos;t display the leaflet here.</p>
            <a href={src} target="_blank" rel="noopener" className="btn-primary">
              Open the PDF
            </a>
          </div>
        ) : !doc ? (
          <p className="py-16 text-center serif-italic text-ink-500 dark:text-ink-400">Loading leaflet…</p>
        ) : (
          <div className={`space-y-4 ${zoom > 1 ? '-mx-4 overflow-x-auto px-4' : ''}`}>
            {pageWidth > 0 &&
              Array.from({ length: numPages }, (_, i) => (
                <PdfPage key={i + 1} doc={doc} pageNumber={i + 1} width={pageWidth} onVisible={setCurrent} />
              ))}
          </div>
        )}
      </div>

      {doc && (
        <p className="mt-6 text-center text-sm">
          <a href={src} target="_blank" rel="noopener" className="text-gold-700 underline dark:text-gold-300">
            Open in a new tab
          </a>
        </p>
      )}
    </div>
  );
}
