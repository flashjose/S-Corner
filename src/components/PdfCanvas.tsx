import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Inline the worker using a data URI to avoid .mjs MIME type issues with CDNs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

/** Normalized rect (0–1) relative to page dimensions — stable across zoom */
interface LookupMarkRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LookupMark {
  id: string;
  pageIndex: number;
  rects: LookupMarkRect[];
}

interface PdfCanvasProps {
  url: string;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  lookupMarks?: LookupMark[];
  onReady?: (numPages: number) => void;
  onPageDimensions?: (width: number, height: number) => void;
  onPageChange?: (page: number) => void;
  onWordSelect?: (text: string, pageIndex: number, range: Range) => void;
}

function buildWavyPath(x: number, y: number, w: number, amplitude = 2, wavelength = 8): string {
  if (w <= 0) return '';
  const baseline = y;
  let d = `M ${x} ${baseline}`;
  let cx = x;
  while (cx < x + w) {
    const seg = Math.min(wavelength, x + w - cx);
    d += ` q ${seg / 2} ${-amplitude} ${seg} 0`;
    cx += seg;
  }
  return d;
}

function drawLookupOverlay(pageEl: HTMLElement, marks: LookupMark[]) {
  const pageIndex = Number(pageEl.dataset.pageIndex);
  const pageW = pageEl.clientWidth;
  const pageH = pageEl.clientHeight;
  if (!pageW || !pageH) return;

  pageEl.querySelector('.lookup-overlay')?.remove();

  const pageMarks = marks.filter((m) => m.pageIndex === pageIndex);
  if (!pageMarks.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lookup-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden;';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(pageW));
  svg.setAttribute('height', String(pageH));
  svg.style.display = 'block';

  for (const mark of pageMarks) {
    for (const r of mark.rects) {
      const px = r.x * pageW;
      const py = (r.y + r.h) * pageH - 2;
      const pw = r.w * pageW;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', buildWavyPath(px, py, pw));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#2563eb');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
  }

  overlay.appendChild(svg);
  pageEl.appendChild(overlay);
}

function redrawAllLookupOverlays(container: HTMLElement, marks: LookupMark[]) {
  container.querySelectorAll('[data-rendered="true"]').forEach((slot) => {
    drawLookupOverlay(slot as HTMLElement, marks);
  });
}

const RENDER_BUFFER = 2;

export default function PdfCanvas({
  url,
  scale = 1.5,
  className,
  style,
  lookupMarks = [],
  onReady,
  onPageDimensions,
  onPageChange,
  onWordSelect,
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [debouncedScale, setDebouncedScale] = useState(scale);
  const scaleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstScaleRef = useRef(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 4 });

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pageHeightsRef = useRef<number[]>([]);
  const pageWidthsRef = useRef<number[]>([]);
  const pageDimensionsReportedRef = useRef(false);
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const renderingRef = useRef<Set<number>>(new Set());

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onPageDimensionsRef = useRef(onPageDimensions);
  onPageDimensionsRef.current = onPageDimensions;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const onWordSelectRef = useRef(onWordSelect);
  onWordSelectRef.current = onWordSelect;
  const lookupMarksRef = useRef(lookupMarks);
  lookupMarksRef.current = lookupMarks;
  const selectionTimerRef = useRef<number | null>(null);
  const lastProcessedTextRef = useRef('');

  const tryProcessSelection = useCallback(() => {
    if (!onWordSelectRef.current) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const container = containerRef.current;
    if (!container || !container.contains(ancestor)) return;

    const parentEl = ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement;
    const pageEl = parentEl?.closest('[data-page-index]') as HTMLElement | null;
    const textLayer = pageEl?.querySelector('.textLayer');
    if (!pageEl || !textLayer) return;

    const checkNode = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
    if (!checkNode || !textLayer.contains(checkNode)) return;

    const pageIndex = Number(pageEl.dataset.pageIndex ?? 0);
    const text = sel.toString().trim();
    if (text.length < 1 || text.length > 200) return;
    if (text === lastProcessedTextRef.current) return;
    lastProcessedTextRef.current = text;
    window.setTimeout(() => { lastProcessedTextRef.current = ''; }, 800);

    onWordSelectRef.current(text, pageIndex, range.cloneRange());
    sel.removeAllRanges();
  }, []);

  const scheduleSelectionProcess = useCallback(
    (delay: number) => {
      if (selectionTimerRef.current !== null) {
        window.clearTimeout(selectionTimerRef.current);
      }
      selectionTimerRef.current = window.setTimeout(() => {
        tryProcessSelection();
        selectionTimerRef.current = null;
      }, delay);
    },
    [tryProcessSelection],
  );

  useEffect(() => {
    if (scaleDebounceRef.current) clearTimeout(scaleDebounceRef.current);
    if (isFirstScaleRef.current) {
      isFirstScaleRef.current = false;
      setDebouncedScale(scale);
      return;
    }
    scaleDebounceRef.current = setTimeout(() => setDebouncedScale(scale), 80);
    return () => {
      if (scaleDebounceRef.current) clearTimeout(scaleDebounceRef.current);
    };
  }, [scale]);

  useEffect(() => {
    isFirstScaleRef.current = true;
  }, [url]);

  const renderPage = useCallback(async (pageIndex: number, pdf: pdfjsLib.PDFDocumentProxy, currentScale: number) => {
    if (renderedPagesRef.current.has(pageIndex) || renderingRef.current.has(pageIndex)) return;
    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector(`[data-page-index="${pageIndex}"]`) as HTMLElement | null;
    if (!slot || slot.dataset.rendered === 'true') return;

    renderingRef.current.add(pageIndex);

    try {
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: currentScale });

      slot.innerHTML = '';
      slot.style.position = 'relative';
      slot.style.height = `${viewport.height}px`;
      slot.style.width = `${viewport.width}px`;
      pageHeightsRef.current[pageIndex] = viewport.height;
      pageWidthsRef.current[pageIndex] = viewport.width;

      const canvas = document.createElement('canvas');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.display = 'block';
      slot.appendChild(canvas);

      const ctx = canvas.getContext('2d')!;
      if (dpr !== 1) ctx.scale(dpr, dpr);

      const textDiv = document.createElement('div');
      textDiv.className = 'textLayer';
      textDiv.style.cssText = `position:absolute;left:0;top:0;width:${viewport.width}px;height:${viewport.height}px;overflow:hidden;opacity:0.25;line-height:1.0;`;
      slot.appendChild(textDiv);

      await page.render({ canvasContext: ctx, viewport }).promise;
      const textContent = await page.getTextContent();
      const renderTask = pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textDiv,
        viewport,
      }) as { promise: Promise<void> };
      await renderTask.promise;

      slot.dataset.rendered = 'true';
      renderedPagesRef.current.add(pageIndex);
      drawLookupOverlay(slot, lookupMarksRef.current);
    } finally {
      renderingRef.current.delete(pageIndex);
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setError(null);
    setLoading(true);
    renderedPagesRef.current.clear();
    pageHeightsRef.current = [];
    pageWidthsRef.current = [];
    pageDimensionsReportedRef.current = false;

    pdfjsLib.getDocument(url).promise.then(
      async (pdf) => {
        if (cancelled) { pdf.destroy(); return; }
        if (pdfDocRef.current) pdfDocRef.current.destroy();
        pdfDocRef.current = pdf;

        if (!pageDimensionsReportedRef.current) {
          try {
            const page = await pdf.getPage(1);
            const intrinsic = page.getViewport({ scale: 1 });
            pageDimensionsReportedRef.current = true;
            onPageDimensionsRef.current?.(intrinsic.width, intrinsic.height);
          } catch {
            // fallback: common A4 width in pt
            onPageDimensionsRef.current?.(595, 842);
          }
        }

        setNumPages(pdf.numPages);
        onReadyRef.current?.(pdf.numPages);
        setLoading(false);
      },
      (err) => {
        if (!cancelled) {
          setError(err.message || 'PDF 加载失败');
          setLoading(false);
        }
      },
    );

    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    renderedPagesRef.current.clear();
    const container = containerRef.current;
    if (container) {
      container.querySelectorAll('[data-page-index]').forEach((el) => {
        (el as HTMLElement).innerHTML = '';
        (el as HTMLElement).dataset.rendered = 'false';
      });
    }
  }, [debouncedScale]);

  useEffect(() => {
    const pdf = pdfDocRef.current;
    if (!pdf || numPages === 0) return;
    const { start, end } = visibleRange;
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < numPages) renderPage(i, pdf, debouncedScale);
    }
  }, [numPages, debouncedScale, visibleRange, renderPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    redrawAllLookupOverlays(container, lookupMarks);
  }, [lookupMarks, debouncedScale, visibleRange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    scrollRootRef.current = container.parentElement;

    const updateVisible = () => {
      const slots = container.querySelectorAll('[data-page-index]');
      const root = scrollRootRef.current;
      if (!root) return;

      const rootRect = root.getBoundingClientRect();
      let firstVisible = numPages - 1;
      let lastVisible = 0;

      slots.forEach((slot) => {
        const rect = slot.getBoundingClientRect();
        const pageIndex = Number((slot as HTMLElement).dataset.pageIndex);
        if (rect.bottom >= rootRect.top && rect.top <= rootRect.bottom) {
          firstVisible = Math.min(firstVisible, pageIndex);
          lastVisible = Math.max(lastVisible, pageIndex);
        }
      });

      setVisibleRange({
        start: Math.max(0, firstVisible - RENDER_BUFFER),
        end: Math.min(numPages - 1, lastVisible + RENDER_BUFFER),
      });

      const midPage = Math.round((firstVisible + lastVisible) / 2);
      if (!Number.isNaN(midPage)) onPageChangeRef.current?.(midPage + 1);
    };

    const root = scrollRootRef.current;
    root?.addEventListener('scroll', updateVisible, { passive: true });
    updateVisible();
    return () => root?.removeEventListener('scroll', updateVisible);
  }, [numPages, loading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    const onMouseUp = () => scheduleSelectionProcess(10);
    const onTouchEnd = () => scheduleSelectionProcess(350);
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') scheduleSelectionProcess(350);
    };

    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('pointerup', onPointerUp);

    return () => {
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('pointerup', onPointerUp);
      if (selectionTimerRef.current !== null) {
        window.clearTimeout(selectionTimerRef.current);
      }
    };
  }, [loading, numPages, scheduleSelectionProcess]);

  if (error) {
    return (
      <div className={className} style={style}>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>PDF 加载失败：{error}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .pdf-page-slot { position: relative; margin: 0 auto 8px; overflow: hidden; background-color: var(--pdf-bg); max-width: 100%; }
        .textLayer {
          position: absolute; text-align: initial; inset: 0; overflow: hidden; opacity: 0.25; line-height: 1;
          -webkit-user-select: text; user-select: text;
          -webkit-touch-callout: default;
          touch-action: pan-x pan-y;
        }
        .textLayer :is(span, br) {
          color: transparent; position: absolute; white-space: pre; cursor: text;
          transform-origin: 0% 0%;
          -webkit-user-select: text; user-select: text;
        }
        .textLayer span::selection { background: rgba(37, 99, 235, 0.35); color: transparent; }
      `}</style>
      {loading && (
        <p className="text-[10px] text-center py-8 animate-pulse" style={{ color: 'var(--text-muted)' }}>加载 PDF...</p>
      )}
      <div
        ref={containerRef}
        className={`${className ?? ''} pdf-canvas-root`.trim()}
        style={{ ...style, display: loading ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {Array.from({ length: numPages }, (_, i) => {
          const w = pageWidthsRef.current[i];
          const h = pageHeightsRef.current[i];
          return (
          <div
            key={i}
            className="pdf-page-slot"
            data-page-index={i}
            data-rendered="false"
            style={
              w && h
                ? { width: `${w}px`, height: `${h}px` }
                : { width: '100%', aspectRatio: '595 / 842', minHeight: 120 }
            }
          />
          );
        })}
      </div>
    </>
  );
}

/** Capture selection rects normalized to page size (zoom-independent) */
export function captureLookupMark(range: Range, pageEl: HTMLElement): LookupMark {
  const pageRect = pageEl.getBoundingClientRect();
  const pageIndex = Number(pageEl.dataset.pageIndex ?? 0);
  const rects: LookupMarkRect[] = [];

  Array.from(range.getClientRects()).forEach((r) => {
    if (r.width < 1 || r.height < 1) return;
    rects.push({
      x: (r.left - pageRect.left) / pageRect.width,
      y: (r.top - pageRect.top) / pageRect.height,
      w: r.width / pageRect.width,
      h: r.height / pageRect.height,
    });
  });

  return { id: `${pageIndex}-${Date.now()}`, pageIndex, rects };
}
