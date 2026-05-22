import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamPaperDetail } from '@/hooks/useExam';
import { useAddVocabulary } from '@/hooks/useVocabulary';
import PdfCanvas from '@/components/PdfCanvas';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Download, CheckCircle, X, Languages, BookOpen } from 'lucide-react';
import { translateApi, dictionaryApi } from '@/services/api';
import type { DictionaryResult } from '@/types/exam';

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
  const { data: paper, isLoading } = useExamPaperDetail(`${categorySlug}/${fullSlug}`);

  const [zoom, setZoom] = useState(100);
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const addVocab = useAddVocabulary();

  /* ── 查词 / 翻译 popup ── */
  type LookupResult = {
    text: string;
    dict: DictionaryResult | null;
    zh: string;
  };
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [savedToVocab, setSavedToVocab] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  /* ── 学习进度 ── */
  const startTimeRef = useRef(Date.now());
  const totalPagesRef = useRef(0);
  const currentPageRef = useRef(1);
  const paperId = paper?.id || '';

  const handlePdfReady = useCallback((numPages: number) => {
    totalPagesRef.current = numPages;
  }, []);

  const handlePageChange = useCallback((page: number) => {
    currentPageRef.current = page;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!paperId) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      import('@/services/api').then(({ examApi }) => {
        examApi.updateProgress(paperId, {
          currentPage: currentPageRef.current,
          totalPages: totalPagesRef.current,
          timeSpent: elapsed,
        }).catch(() => {});
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [paperId]);

  /* ── 答案列表 ── */
  const answerList = useMemo(() => {
    if (!paper?.answers) return [];
    return parseAnswers(paper.answers);
  }, [paper?.answers]);

  /* ── 查词 / 翻译 ── */
  const [lookupPos, setLookupPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSentenceTranslate = useCallback(async () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return;

    // 计算弹窗位置：跟随选中区域
    const range = sel?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (rect) {
      const popupW = 384; // w-96 = 24rem = 384px
      const popupH = 400;
      let x = rect.left + rect.width / 2 - popupW / 2;
      let y = rect.top - popupH - 12; // 默认在选区上方
      if (y < 8) y = rect.bottom + 12; // 上方不够则放下方
      if (x < 8) x = 8;
      if (x + popupW > window.innerWidth - 8) x = window.innerWidth - popupW - 8;
      setLookupPos({ x, y });
    }

    const word = text.split(/\s+/)[0].replace(/[^a-zA-Z'-]/g, '');
    const isSingleWord = word.length >= 2 && word.length <= 30;

    setLookupLoading(true);
    setLookupResult({ text, dict: null, zh: '' });

    try {
      if (isSingleWord) {
        const dictRes = await dictionaryApi.lookup(word).catch(() => null);
        setLookupResult({ text: word, dict: dictRes, zh: dictRes?.wordZh || '' });
        setSavedToVocab(false);
        // 自动加入生词本
        if (dictRes && dictRes.meanings?.length > 0) {
          const meaning = dictRes.meanings[0];
          const firstDef = meaning.definitions[0];
          addVocab.mutate({
            word: dictRes.word,
            pronunciation: dictRes.phonetic || '',
            definition: firstDef?.definition || '',
            chineseDefinition: dictRes.wordZh || meaning.definitionsZh?.[0] || '',
            example: firstDef?.example || '',
          }, {
            onSuccess: () => setSavedToVocab(true),
            onError: () => {}, // 重复单词忽略
          });
        }
      } else {
        const zhRes = await translateApi.translate(text, 'en', 'zh-CN');
        setLookupResult({ text, dict: null, zh: zhRes.translated || '翻译失败' });
      }
    } catch {
      setLookupResult({ text, dict: null, zh: '翻译失败' });
    } finally {
      setLookupLoading(false);
    }
  }, []);

  /* ── 取词查词（PDF 文字层选中） ── */
  const handleWordSelect = useCallback((_text: string, _rect: DOMRect) => {
    handleSentenceTranslate();
  }, [handleSentenceTranslate]);

  /* ── 快捷键 ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleSentenceTranslate();
      }
      if (e.key === 'Escape') {
        setLookupResult(null);
        setShowAnswers(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSentenceTranslate]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const hasListening = categorySlug === 'cet4' || categorySlug === 'cet6' || categorySlug === 'tem';

  /* ── Loading / Not Found ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
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
    <div ref={viewerRef} className="h-screen flex flex-col font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* ─── Top Bar ─── */}
      <div className="flex-shrink-0 border-b px-4 py-2 flex items-center justify-between gap-4"
           style={{ borderColor: 'var(--border)', backgroundColor: 'var(--nav-bg)' }}>
        <div className="flex items-center gap-4 min-w-0">
          <Link to={`/${categorySlug}`}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} />
            返回
          </Link>
          <h1 className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {paper.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleSentenceTranslate}
            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <Languages size={12} className="inline mr-1" />
            翻译 (Ctrl+X)
          </button>
          <button onClick={handleFullscreen}
            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <Maximize size={12} className="inline mr-1" />
            全屏
          </button>
          <button onClick={handleDownload} disabled={!paper.pdfUrl}
            className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border hover:border-[var(--border-hover)] transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <Download size={12} className="inline mr-1" />
            下载
          </button>
        </div>
      </div>

      {/* ─── Main: PDF 全宽 ─── */}
      <div className="flex-1 overflow-auto relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {/* 缩放条 */}
        <div className="sticky top-0 z-20 flex items-center justify-center gap-4 py-2 px-4"
             style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
            <ZoomOut size={16} />
          </button>
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            {[50, 75, 100, 125, 150, 200, 300, 400].map(v => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
          <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
            <ZoomIn size={16} />
          </button>
        </div>

        {/* PDF 内容 */}
        <div className="flex flex-col items-center py-8 px-4">
          {paper.pdfUrl ? (
            <div className="border shadow-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <PdfCanvas
                url={paper.pdfUrl}
                scale={zoom / 100 * 1.5}
                className="w-full"
                onReady={handlePdfReady}
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

      {/* ─── 悬浮「查答案」按钮 ─── */}
      <motion.button
        onClick={() => setShowAnswers(v => !v)}
        className="fixed z-40 flex items-center gap-2 shadow-lg transition-colors"
        style={{
          right: showAnswers ? 340 : 20,
          bottom: 20,
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
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <CheckCircle size={15} />
        查答案
      </motion.button>

      {/* ─── 答案侧栏 ─── */}
      <AnimatePresence>
        {showAnswers && (
          <motion.div
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-30 border-l flex flex-col"
            style={{ width: 340, borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
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

            {/* 听力区（仅 CET4/CET6/TEM） */}
            {hasListening && (
              <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                {paper.audioUrl ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={toggleAudio}
                        className="w-8 h-8 flex items-center justify-center border rounded-full hover:border-[var(--border-hover)] transition-colors"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <div className="flex-1">
                        <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${audioProgress}%`, backgroundColor: 'var(--text-primary)' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{formatTime(audioProgress * audioDuration / 100)}</span>
                          <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{formatTime(audioDuration)}</span>
                        </div>
                      </div>
                    </div>
                    <audio ref={audioRef} src={paper.audioUrl}
                      onTimeUpdate={() => {
                        if (audioRef.current) setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                      }}
                      onLoadedMetadata={() => { if (audioRef.current) setAudioDuration(audioRef.current.duration); }}
                      onEnded={() => setIsPlaying(false)}
                    />
                  </>
                ) : (
                  <p className="text-[9px] text-center py-1" style={{ color: 'var(--text-muted)' }}>
                    听力音频暂未上传
                  </p>
                )}
                <button onClick={() => setShowTranscript(!showTranscript)}
                  className="text-[9px] font-bold uppercase tracking-widest w-full py-1.5 border hover:border-[var(--border-hover)] transition-colors mt-2"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                  听力原文
                </button>
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden">
                      <div className="text-[10px] leading-relaxed p-2 max-h-32 overflow-auto border"
                           style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        {paper.transcript || '听力原文暂未上传'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 题号列表 */}
            <div className="flex-1 overflow-auto p-4">
              {answerList.length > 0 ? (
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
              ) : (
                <p className="text-[10px] text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  答案暂未上传
                </p>
              )}

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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 查词 / 翻译弹窗 ─── */}
      <AnimatePresence>
        {lookupResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-50 border shadow-xl w-96 max-h-[60vh] overflow-hidden flex flex-col"
            style={{
              left: lookupPos.x,
              top: lookupPos.y,
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 8,
            }}
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
              <button onClick={() => setLookupResult(null)} className="hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            {/* 内容（可滚动） */}
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {lookupLoading ? (
                <p className="text-[10px] animate-pulse" style={{ color: 'var(--text-muted)' }}>查询中...</p>
              ) : lookupResult.dict ? (
                /* ── 词典模式 ── */
                <DictEntry dict={lookupResult.dict} zh={lookupResult.zh} />
              ) : (
                /* ── 纯翻译模式（长句） ── */
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
    </div>
  );
};

/* ── 词典词条组件 ── */
function DictEntry({ dict, zh }: { dict: DictionaryResult; zh: string }) {
  const parts = dict.phonetic ? dict.phonetic.split(',').map(s => s.trim()) : [];

  return (
    <div>
      {/* 单词 + 音标 + 中文 */}
      <div className="mb-4">
        <span className="font-['Instrument_Serif'] text-xl italic" style={{ color: 'var(--text-primary)' }}>
          {dict.word}
        </span>
        {parts.length > 0 && (
          <span className="ml-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {parts[0]}
          </span>
        )}
        {zh && (
          <span className="ml-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {zh}
          </span>
        )}
      </div>

      {/* 各词性释义 */}
      {dict.meanings.map((meaning, mi) => (
        <div key={mi} className="mb-4">
          {/* 词性标签 + 中文概要 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)', borderRadius: 2 }}>
              {meaning.partOfSpeech}
            </span>
            {meaning.definitionsZh?.[0] && (
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {meaning.definitionsZh[0]}
              </span>
            )}
          </div>

          {/* 释义列表（英文 + 中文） */}
          {meaning.definitions.map((def, di) => (
            <div key={di} className="ml-1 mb-3 pl-3 border-l-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {def.definition}
              </p>
              {meaning.definitionsZh?.[di] && (
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {meaning.definitionsZh[di]}
                </p>
              )}
              {def.example && (
                <p className="text-[11px] mt-1 italic" style={{ color: 'var(--text-muted)' }}>
                  "{def.example}"
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

      {dict.meanings.length === 0 && !zh && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>未找到释义</p>
      )}
    </div>
  );
}

export default PaperViewer;
