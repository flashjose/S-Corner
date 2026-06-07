import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamPaperDetail } from '@/hooks/useExam';
import { useAddVocabulary } from '@/hooks/useVocabulary';
import PdfCanvas, { captureLookupMark, type LookupMark } from '@/components/PdfCanvas';
import ErrorState from '@/components/ErrorState';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Download, CheckCircle, X, Languages, BookOpen } from 'lucide-react';
import { translateApi, dictionaryApi, examApi } from '@/services/api';
import DictEntry from '@/components/DictEntry';
import ListeningPlayerBar, { LISTENING_PLAYER_HEIGHT } from '@/components/ListeningPlayerBar';
import type { DictionaryResult } from '@/types/exam';
import {
  zoomToRenderScale,
  computeFitWidthZoom,
  isMobilePdfLayout,
  MOBILE_DEFAULT_ZOOM,
  PDF_ZOOM_OPTIONS_MOBILE,
  PDF_ZOOM_OPTIONS_DESKTOP,
} from '@/utils/pdfZoom';
import { resolveListeningAudioUrl } from '@/utils/listeningAudio';
import { pickChineseForVocab, pickDictHeadlineZh } from '@/utils/dictDisplay';
import { useAuthStore } from '@/stores/authStore';

/* ── 答案解析 ── */
function parseAnswers(raw: string): { num: string; answer: string }[] {
  try {
    const data = JSON.parse(raw);
    if (typeof data === 'string') {
      return data.split('\n').filter(Boolean).map((line) => {
        const m = line.match(/^(\d+)[.\s、:：]+(.+)$/);
        return m ? { num: m[1], answer: m[2].trim() } : { num: '?', answer: line.trim() };
      });
    }
    if (Array.isArray(data)) {
      return data.map((item, i) => {
        if (typeof item === 'string') {
          const m = item.match(/^(\d+)[.\s、:：]+(.+)$/);
          return m ? { num: m[1], answer: m[2].trim() } : { num: String(i + 1), answer: item.trim() };
        }
        if (typeof item === 'object' && item !== null) {
          return { num: String(item.num ?? i + 1), answer: String(item.answer ?? JSON.stringify(item)) };
        }
        return { num: String(i + 1), answer: String(item) };
      });
    }
    if (typeof data === 'object') {
      return Object.entries(data)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, ans]) => ({ num, answer: String(ans) }));
    }
  } catch {
    // plain text
  }
  return raw.split('\n').filter(Boolean).map((line) => {
    const m = line.match(/^(\d+)[.\s、:：]+(.+)$/);
    return m ? { num: m[1], answer: m[2].trim() } : { num: '?', answer: line.trim() };
  });
}

const PaperViewer = () => {
  const { categorySlug, paperSlug, '*': wildcard } = useParams<{ categorySlug: string; paperSlug: string; '*': string }>();
  const fullSlug = wildcard ? `${paperSlug}/${wildcard}` : `${paperSlug}`;
  const { data: paper, isLoading, isError, refetch } = useExamPaperDetail(`${categorySlug}/${fullSlug}`);
  const paperId = paper?.id || '';

  const [lookupMarks, setLookupMarks] = useState<LookupMark[]>([]);
  const dictCacheRef = useRef<Map<string, DictionaryResult>>(new Map());
  const [zoom, setZoom] = useState(100);
  const [isMobileLayout, setIsMobileLayout] = useState(isMobilePdfLayout);
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const pageWidthRef = useRef(595);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  const addVocab = useAddVocabulary();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  /* ── 查词 / 翻译 popup ── */
  type LookupResult = {
    text: string;
    dict: DictionaryResult | null;
    zh: string;
  };
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [savedToVocab, setSavedToVocab] = useState(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const lastSentElapsedRef = useRef(0);
  const totalPagesRef = useRef(0);
  const currentPageRef = useRef(1);
  const handlePdfReady = useCallback((numPages: number) => {
    totalPagesRef.current = numPages;
  }, []);

  const handlePageChange = useCallback((page: number) => {
    currentPageRef.current = page;
  }, []);

  useEffect(() => {
    lastSentElapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setLookupMarks([]);
    pageWidthRef.current = 595;
    setZoom(isMobilePdfLayout() ? MOBILE_DEFAULT_ZOOM : 100);
  }, [paperId]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileLayout(mq.matches);
    update();
    // 兼容旧浏览器：优先 addEventListener，回退 addListener
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } else {
      // @ts-ignore — Safari < 14 / 旧 WebView
      mq.addListener(update);
      // @ts-ignore
      return () => mq.removeListener(update);
    }
  }, []);

  const applyFitWidthZoom = useCallback(() => {
    const cw = pdfScrollRef.current?.clientWidth ?? window.innerWidth;
    const padding = isMobileLayout ? 12 : 24;
    setZoom(computeFitWidthZoom(pageWidthRef.current, cw, padding));
  }, [isMobileLayout]);

  const handlePageDimensions = useCallback((width: number) => {
    pageWidthRef.current = width;
  }, []);

  const zoomOptions = isMobileLayout ? PDF_ZOOM_OPTIONS_MOBILE : PDF_ZOOM_OPTIONS_DESKTOP;
  const renderScale = zoomToRenderScale(zoom);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      if (!paperId) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const delta = elapsed - lastSentElapsedRef.current;
      if (delta <= 0) return;
      lastSentElapsedRef.current = elapsed;
      examApi.updateProgress(paperId, {
        currentPage: currentPageRef.current,
        totalPages: totalPagesRef.current,
        timeSpent: delta,
      }).catch(() => {});
    }, 30000);
    return () => {
      clearInterval(timer);
      if (!paperId) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const delta = elapsed - lastSentElapsedRef.current;
      if (delta > 0) {
        examApi.updateProgress(paperId, {
          currentPage: currentPageRef.current,
          totalPages: totalPagesRef.current,
          timeSpent: delta,
        }).catch(() => {});
      }
    };
  }, [paperId, isAuthenticated]);

  /* ── 答案列表 ── */
  const answerList = useMemo(() => {
    if (!paper?.answers) return [];
    return parseAnswers(paper.answers);
  }, [paper?.answers]);

  /* ── 查词 / 翻译 ── */
  const [lookupPos, setLookupPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const runLookup = useCallback(async (range: Range, pageIndex: number) => {
    const text = range.toString().trim();
    if (!text) return;

    const pageEl = document.querySelector(
      `[data-page-index="${pageIndex}"][data-rendered="true"]`,
    ) as HTMLElement | null;
    if (pageEl) {
      const mark = captureLookupMark(range, pageEl);
      if (mark.rects.length) setLookupMarks((prev) => [...prev, mark]);
    }

    const rect = range.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobileLayout = vw < 768;
    const popupW = isMobileLayout ? vw - 16 : 384;
    const popupH = isMobileLayout ? Math.min(vh * 0.45, 360) : 400;

    if (isMobileLayout) {
      setLookupPos({ x: -1, y: -1 });
    } else {
      let x = rect.left + rect.width / 2 - popupW / 2;
      let y = rect.top - popupH - 12;
      if (y < 8) y = rect.bottom + 12;
      if (x < 8) x = 8;
      if (x + popupW > vw - 8) x = vw - popupW - 8;
      setLookupPos({ x, y });
    }

    const word = text.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '');
    const isSingleWord = word.length >= 2 && word.length <= 30 && text.split(/\s+/).length === 1;

    setLookupLoading(true);
    setLookupResult({ text: isSingleWord ? word : text, dict: null, zh: '' });
    setSavedToVocab(false);

    try {
      if (isSingleWord) {
        const cacheKey = `${word}:zh`;
        const cached = dictCacheRef.current.get(cacheKey);
        const dictRes = cached ?? await dictionaryApi.lookup(word, true);
        if (!cached) dictCacheRef.current.set(cacheKey, dictRes);

        const headlineZh = pickDictHeadlineZh(dictRes);
        setLookupResult({ text: word, dict: dictRes, zh: headlineZh });
        setLookupLoading(false);

        if (!headlineZh) {
          translateApi.translate(word, 'en', 'zh-CN').then((zhRes) => {
            setLookupResult((prev) =>
              prev?.text === word ? { ...prev, zh: zhRes.translated || '' } : prev,
            );
          }).catch(() => {});
        }

        if (dictRes?.meanings?.length > 0 && isAuthenticated) {
          const meaning = dictRes.meanings[0];
          const firstDef = meaning.definitions[0];
          addVocab.mutate({
            word: dictRes.word,
            pronunciation: dictRes.phonetic || '',
            definition: firstDef?.definition || '',
            chineseDefinition: pickChineseForVocab(dictRes),
            example: firstDef?.example || '',
          }, {
            onSuccess: () => setSavedToVocab(true),
            onError: () => {},
          });
        }
      } else {
        const zhRes = await translateApi.translate(text, 'en', 'zh-CN');
        setLookupResult({ text, dict: null, zh: zhRes.translated || '翻译失败' });
        setLookupLoading(false);
      }
    } catch {
      setLookupResult({ text, dict: null, zh: '翻译失败' });
      setLookupLoading(false);
    }
  }, [addVocab, isAuthenticated]);

  const handleSentenceTranslate = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const parentEl = ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement;
    const pageEl = parentEl?.closest('[data-page-index]') as HTMLElement | null;
    const pageIndex = Number(pageEl?.dataset.pageIndex ?? 0);
    runLookup(range, pageIndex);
    sel.removeAllRanges();
  }, [runLookup]);

  const handleWordSelect = useCallback((_text: string, pageIndex: number, range: Range) => {
    runLookup(range, pageIndex);
  }, [runLookup]);

  /* ── 快捷键 ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'x') { e.preventDefault(); handleSentenceTranslate(); }
      }
      if (e.key === 'Escape') {
        setLookupResult(null);
        setShowAnswers(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSentenceTranslate]);

  const handleFullscreen = () => {
    const el = viewerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handleDownload = () => {
    if (!paper?.pdfUrl) return;
    const a = document.createElement('a');
    a.href = paper.pdfUrl;
    a.download = `${paper.title || 'paper'}.pdf`;
    a.click();
  };

  const resolvedAudioUrl = useMemo(
    () => resolveListeningAudioUrl(categorySlug, fullSlug, paper?.audioUrl),
    [categorySlug, fullSlug, paper?.audioUrl],
  );
  const hasListening = !!resolvedAudioUrl && (categorySlug === 'cet4' || categorySlug === 'cet6' || categorySlug === 'tem');
  const listeningBarOffset = hasListening ? LISTENING_PLAYER_HEIGHT : 0;

  /* ── Loading / Not Found ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <ErrorState message="无法加载试卷" onRetry={() => refetch()} backTo={`/${categorySlug}`} backLabel="返回列表" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Paper not found</p>
        <Link to={`/${categorySlug}`} className="text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div ref={viewerRef} className="paper-viewer-root h-screen flex flex-col font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', height: '100dvh' }}>

      {/* ─── Top Bar ─── */}
      <div className="flex-shrink-0 border-b px-3 md:px-4 py-2 flex items-center justify-between gap-2 md:gap-4"
           style={{ borderColor: 'var(--border)', backgroundColor: 'var(--nav-bg)' }}>
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <Link to={`/${categorySlug}`}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">返回</span>
          </Link>
          <h1 className="text-[10px] md:text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {paper.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button onClick={handleSentenceTranslate}
            className="text-[9px] font-bold uppercase tracking-widest px-2 md:px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            title="翻译选中内容">
            <Languages size={12} className="inline md:mr-1" />
            <span className="hidden md:inline">翻译 (Ctrl+X)</span>
          </button>
          <button onClick={handleFullscreen}
            className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <Maximize size={12} className="inline mr-1" />
            全屏
          </button>
          <button onClick={handleDownload} disabled={!paper.pdfUrl}
            className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <Download size={12} className="inline mr-1" />
            下载
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
      {/* ─── Main: PDF 全宽 ─── */}
      <div
        ref={pdfScrollRef}
        className="flex-1 overflow-auto relative pdf-scroll-viewport"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: listeningBarOffset,
        }}
      >
        {/* 缩放条 */}
        <div className="sticky top-0 z-20 flex items-center justify-center gap-2 md:gap-4 py-1.5 md:py-2 px-2 md:px-4"
             style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setZoom((z) => Math.max(zoomOptions[0], z - (isMobileLayout ? 10 : 25)))}
            className="hover:opacity-70 p-1"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="缩小"
          >
            <ZoomOut size={16} />
          </button>
          {isMobileLayout && (
            <button
              onClick={applyFitWidthZoom}
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              适应
            </button>
          )}
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border bg-transparent max-w-[4.5rem] md:max-w-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {zoomOptions.map((v) => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
          <button
            onClick={() => setZoom((z) => Math.min(zoomOptions[zoomOptions.length - 1], z + (isMobileLayout ? 10 : 25)))}
            className="hover:opacity-70 p-1"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* PDF 内容 — 移动端允许横向滑动查看页外区域 */}
        <div className={`py-3 md:py-8 px-2 md:px-4 ${isMobileLayout ? 'pdf-scroll-content' : 'flex flex-col items-center w-full'}`}>
          {paper.pdfUrl ? (
            <div
              className={isMobileLayout ? 'pdf-scroll-inner' : 'w-full max-w-full md:border md:shadow-lg'}
              style={isMobileLayout ? undefined : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <PdfCanvas
                url={paper.pdfUrl}
                scale={renderScale}
                className={isMobileLayout ? 'pdf-canvas-pan' : 'w-full'}
                lookupMarks={lookupMarks}
                onReady={handlePdfReady}
                onPageDimensions={handlePageDimensions}
                onPageChange={handlePageChange}
                onWordSelect={handleWordSelect}
              />
            </div>
          ) : (
            <div className="border shadow-lg flex flex-col items-center justify-center"
              style={{ borderColor: 'var(--border)', width: '800px', minHeight: '1100px', backgroundColor: 'var(--card-bg)' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-secondary)' }}>
                {paper.title}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                PDF 文件暂未上传
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ─── 悬浮「查答案」按钮 ─── */}
      <motion.button
        onClick={() => setShowAnswers(v => !v)}
        className={`fixed z-40 flex items-center gap-2 shadow-lg transition-colors ${
          isMobileLayout
            ? 'answer-fab'
            : ''
        } ${showAnswers && isMobileLayout ? 'sidebar-open' : ''}`}
        style={isMobileLayout ? {
          right: 16,
          bottom: 16 + listeningBarOffset,
          backgroundColor: showAnswers ? 'var(--text-primary)' : 'var(--card-bg)',
          color: showAnswers ? 'var(--bg)' : 'var(--text-primary)',
          border: `1px solid ${showAnswers ? 'var(--text-primary)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '10px 18px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
        } : {
          right: showAnswers ? 340 : 20,
          bottom: 20 + listeningBarOffset,
          backgroundColor: showAnswers ? 'var(--text-primary)' : 'var(--card-bg)',
          color: showAnswers ? 'var(--bg)' : 'var(--text-primary)',
          border: `1px solid ${showAnswers ? 'var(--text-primary)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '10px 18px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        layout={!isMobileLayout}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <CheckCircle size={15} />
        查答案
      </motion.button>

      {/* ─── 答案侧栏 ─── */}
      <AnimatePresence>
        {showAnswers && (
          <>
            {/* 移动端遮罩 */}
            {isMobileLayout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-20"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                onClick={() => setShowAnswers(false)}
              />
            )}
            <motion.div
              initial={isMobileLayout ? { y: '100%' } : { x: 340 }}
              animate={isMobileLayout ? { y: 0 } : { x: 0 }}
              exit={isMobileLayout ? { y: '100%' } : { x: 340 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed z-30 border-l flex flex-col ${
                isMobileLayout
                  ? 'answer-sidebar left-0 right-0 bottom-0 rounded-t-xl border-t border-l-0'
                  : 'right-0 top-0 bottom-0'
              }`}
              style={isMobileLayout
                ? { maxHeight: '75vh', borderColor: 'var(--border)', backgroundColor: 'var(--surface)', borderWidth: '1px 0 0 0' }
                : { width: 340, borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }
              }
            >
            {/* 侧栏头部 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
                 style={{ borderColor: 'var(--border)' }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-primary)' }}>
                查答案
              </span>
              <button onClick={() => setShowAnswers(false)} className="hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* 题号列表 */}
            <div className="flex-1 overflow-auto p-4">
              {answerList.length > 0 ? (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    {answerList.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAnswer(activeAnswer === idx ? null : idx)}
                        className="relative text-center py-2 border transition-all"
                        style={{
                          borderColor: activeAnswer === idx ? 'var(--text-primary)' : 'var(--border)',
                          backgroundColor: activeAnswer === idx ? 'var(--text-primary)' : 'transparent',
                          color: activeAnswer === idx ? 'var(--bg)' : 'var(--text-primary)',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {item.num}
                      </button>
                    ))}
                  </div>

                  {/* 答案详情 */}
                  <AnimatePresence>
                    {activeAnswer !== null && answerList[activeAnswer] && (
                      <motion.div
                        key={activeAnswer}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="mt-4 p-3 border"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                            第 {answerList[activeAnswer].num} 题
                          </span>
                          <button onClick={() => setActiveAnswer(null)} className="hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {answerList[activeAnswer].answer}
                        </p>

                        {/* 上一题 / 下一题 */}
                        <div className="flex justify-between mt-3">
                          <button
                            disabled={activeAnswer === 0}
                            onClick={() => setActiveAnswer(i => i !== null ? i - 1 : null)}
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border hover:border-[var(--border-hover)] transition-colors disabled:opacity-30"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                          >
                            ← 上一题
                          </button>
                          <button
                            disabled={activeAnswer >= answerList.length - 1}
                            onClick={() => setActiveAnswer(i => i !== null ? i + 1 : null)}
                            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border hover:border-[var(--border-hover)] transition-colors disabled:opacity-30"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                          >
                            下一题 →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 全部答案一览 */}
                  <button
                    onClick={() => setShowAllAnswers(v => !v)}
                    className="mt-4 w-full text-[9px] font-bold uppercase tracking-widest py-2 border hover:border-[var(--border-hover)] transition-colors"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    {showAllAnswers ? '收起全部答案' : '查看全部答案'}
                  </button>
                  <AnimatePresence>
                    {showAllAnswers && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="grid grid-cols-5 gap-1">
                          {answerList.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col items-center py-1.5 border"
                              style={{ borderColor: 'var(--border)', fontSize: 10 }}
                            >
                              <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>{item.num}</span>
                              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.answer}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <p className="text-[10px] text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  答案暂未上传
                </p>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── 查词 / 翻译弹窗 ─── */}
      <AnimatePresence>
        {lookupResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed z-50 border shadow-xl overflow-hidden flex flex-col ${
              lookupPos.x < 0
                ? 'bottom-0 left-0 right-0 w-full max-h-[50vh] rounded-t-xl'
                : 'w-96 max-h-[60vh] rounded-lg'
            }`}
            style={
              lookupPos.x < 0
                ? { backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }
                : {
                    left: lookupPos.x,
                    top: lookupPos.y,
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    borderRadius: 8,
                  }
            }
          >
            {/* 头部 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
                 style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                {lookupResult.dict ? '词典' : '翻译'}
              </span>
              {savedToVocab && lookupResult.dict && (
                <span className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                  <BookOpen size={10} /> 已加入生词本
                </span>
              )}
              {!isAuthenticated && lookupResult.dict && !lookupLoading && (
                <Link to="/login" className="text-[9px] underline opacity-70 hover:opacity-100" style={{ color: 'var(--text-muted)' }}>
                  登录保存生词
                </Link>
              )}
              <button onClick={() => setLookupResult(null)} className="hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            {/* 内容（可滚动） */}
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: lookupPos.x < 0 ? 'calc(50vh - 48px)' : 'calc(100vh - 120px)' }}>
              {lookupLoading ? (
                <p className="text-[10px] animate-pulse" style={{ color: 'var(--text-muted)' }}>查询中...</p>
              ) : lookupResult.dict ? (
                <DictEntry dict={lookupResult.dict} zh={lookupResult.zh} />
              ) : (
                <div>
                  <p className="text-[12px] mb-3 leading-relaxed font-['Instrument_Serif'] italic"
                     style={{ color: 'var(--text-muted)' }}>
                    {lookupResult.text}
                  </p>
                  <div className="p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>中文释义</span>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{lookupResult.zh}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasListening && (
        <div
          className="fixed bottom-0 left-0 z-50 transition-[right] duration-300"
          style={{ right: (!isMobileLayout && showAnswers) ? 340 : 0 }}
        >
          <ListeningPlayerBar
            audioUrl={resolvedAudioUrl}
            audioTimeline={paper.audioTimeline}
            transcript={paper.transcript}
          />
        </div>
      )}
    </div>
  );
};

export default PaperViewer;
