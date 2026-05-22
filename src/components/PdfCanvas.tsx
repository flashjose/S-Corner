import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfCanvasProps {
  url: string;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (numPages: number) => void;
  onPageChange?: (page: number) => void;
  onWordSelect?: (word: string, rect: DOMRect, pageIndex: number) => void;
}

export default function PdfCanvas({
  url,
  scale = 1.5,
  className,
  style,
  onReady,
  onPageChange,
  onWordSelect,
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Step 1: Fetch & cache the PDF document (only when url changes)
  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    setError(null);
    setLoading(true);

    pdfjsLib.getDocument(url).promise.then(
      (pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        if (pdfDocRef.current) {
          pdfDocRef.current.destroy();
        }
        pdfDocRef.current = pdf;
        setPdfDoc(pdf);
        onReadyRef.current?.(pdf.numPages);
      },
      (err) => {
        if (!cancelled) {
          setError(err.message || 'PDF 加载失败');
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Step 2: Render all pages whenever pdfDoc or scale changes
  useEffect(() => {
    if (!pdfDoc) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(i);
          if (cancelled) break;

          const viewport = page.getViewport({ scale });
          const pageIndex = i - 1;

          const pageDiv = document.createElement('div');
          pageDiv.className = 'pdf-page';
          pageDiv.dataset.pageIndex = String(pageIndex);
          pageDiv.style.position = 'relative';
          pageDiv.style.width = `${viewport.width}px`;
          pageDiv.style.height = `${viewport.height}px`;
          pageDiv.style.margin = '0 auto 8px';
          pageDiv.style.overflow = 'hidden';
          pageDiv.style.backgroundColor = 'white';

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = 'block';
          const ctx = canvas.getContext('2d')!;
          pageDiv.appendChild(canvas);

          const textDiv = document.createElement('div');
          textDiv.className = 'textLayer';
          textDiv.style.position = 'absolute';
          textDiv.style.left = '0';
          textDiv.style.top = '0';
          textDiv.style.width = `${viewport.width}px`;
          textDiv.style.height = `${viewport.height}px`;
          textDiv.style.overflow = 'hidden';
          textDiv.style.opacity = '0.25';
          textDiv.style.lineHeight = '1.0';
          pageDiv.appendChild(textDiv);

          container.appendChild(pageDiv);

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) break;

          const textContent = await page.getTextContent();
          if (cancelled) break;

          const renderTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textDiv,
            viewport,
          }) as any;
          await renderTask.promise;
          if (cancelled) break;
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'PDF 渲染失败');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, scale]);

  // Track visible page for progress
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onPageChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const pageIndex = Number((visible.target as HTMLElement).dataset.pageIndex);
          if (!Number.isNaN(pageIndex)) onPageChange(pageIndex + 1);
        }
      },
      { root: container.parentElement, threshold: [0.3, 0.5, 0.7] },
    );

    container.querySelectorAll('.pdf-page').forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [loading, onPageChange]);

  // Word selection on mouse up
  const handleMouseUp = useCallback(() => {
    if (!onWordSelect) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const parentEl = ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement;
    const pageEl = parentEl?.closest('.pdf-page') as HTMLElement | null;
    if (!pageEl?.querySelector('.textLayer')?.contains(parentEl)) return;

    const pageIndex = Number(pageEl.dataset.pageIndex ?? 0);
    const text = sel.toString().trim();

    if (text.length < 1 || text.length > 200) return;

    const rect = range.getBoundingClientRect();
    onWordSelect(text, rect, pageIndex);
    sel.removeAllRanges();
  }, [onWordSelect]);

  if (error) {
    return (
      <div className={className} style={style}>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          PDF 加载失败：{error}
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .textLayer {
          position: absolute;
          text-align: initial;
          inset: 0;
          overflow: hidden;
          opacity: 0.25;
          line-height: 1;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        }
        .textLayer :is(span, br) {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer span::selection,
        .textLayer span::-moz-selection {
          background: rgba(0, 100, 200, 0.3);
          color: transparent;
        }
      `}</style>
      {loading && (
        <p className="text-[10px] text-center py-8 animate-pulse" style={{ color: 'var(--text-muted)' }}>
          加载 PDF...
        </p>
      )}
      <div
        ref={containerRef}
        className={className}
        style={{
          ...style,
          display: loading ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}
