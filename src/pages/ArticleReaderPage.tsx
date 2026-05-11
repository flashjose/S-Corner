import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useArticle } from '@/hooks/useArticles';
import { useAnnotations, useCreateAnnotation } from '@/hooks/useAnnotations';
import { useProgress, useUpdateProgress } from '@/hooks/useProgress';
import { useAddVocabulary } from '@/hooks/useVocabulary';
import { dictionaryApi } from '@/services/api';
import ProgressBar from '@/components/ProgressBar';
import type { DictionaryResult, Paragraph, Annotation } from '@/types/article';
import { useAppStore } from '@/stores/appStore';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';

const ArticleReaderPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(id!);
  const { data: annotations = [] } = useAnnotations(id!);
  const { data: progress } = useProgress(id!);
  const updateProgress = useUpdateProgress();
  const createAnnotation = useCreateAnnotation();
  const addVocab = useAddVocabulary();
  const fontSize = useAppStore((s) => s.fontSize);

  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
    paragraphId?: string;
  } | null>(null);
  const [dictResult, setDictResult] = useState<DictionaryResult | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [note, setNote] = useState('');
  const [activeGrammar, setActiveGrammar] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());

  // Font size classes
  const fontSizeClass = {
    sm: 'text-base',
    base: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[fontSize];

  // Track reading time on unmount
  useEffect(() => {
    return () => {
      if (!id || !article) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 5) {
        const totalParagraphs = article.paragraphs?.length || 0;
        updateProgress.mutate({
          articleId: id,
          data: {
            timeSpent: elapsed,
            totalParagraphs,
          },
        });
      }
    };
  }, [id, article]);

  // Handle text selection for word lookup
  const handleMouseUp = useCallback(
    (paragraphId: string, _e: React.MouseEvent) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 1 || text.length > 50) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        paragraphId,
      });

      // Look up dictionary
      setDictLoading(true);
      setDictResult(null);
      dictionaryApi
        .lookup(text.split(/\s+/)[0]) // lookup first word
        .then((res) => setDictResult(res))
        .catch(() => setDictResult(null))
        .finally(() => setDictLoading(false));

      sel.removeAllRanges();
    },
    []
  );

  // Close popup
  const closePopup = () => {
    setSelection(null);
    setDictResult(null);
    setNote('');
  };

  // Add to vocabulary
  const handleAddToVocab = () => {
    if (!dictResult || !dictResult.meanings.length) return;
    const meaning = dictResult.meanings[0];
    addVocab.mutate({
      word: dictResult.word,
      phonetic: dictResult.phonetic,
      definition: meaning.definitions[0]?.definition || '',
      chineseDefinition: '',
      example: meaning.definitions[0]?.example,
      sourceArticleId: id,
    });
    closePopup();
  };

  // Save annotation
  const handleSaveAnnotation = () => {
    if (!selection) return;
    createAnnotation.mutate({
      articleId: id,
      paragraphId: selection.paragraphId,
      startOffset: 0,
      endOffset: selection.text.length,
      selectedText: selection.text,
      translation: dictResult?.meanings[0]?.definitions[0]?.definition,
      note: note || undefined,
    });
    closePopup();
  };

  // Update progress on scroll
  const handleScroll = useCallback(() => {
    if (!id || !article?.paragraphs) return;
    const paragraphs = article.paragraphs;
    let lastVisible = 0;

    paragraphs.forEach((_: Paragraph, i: number) => {
      const el = document.getElementById(`para-${i}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          lastVisible = i;
        }
      }
    });

    if (lastVisible > 0) {
      updateProgress.mutate({
        articleId: id,
        data: {
          lastParagraph: lastVisible,
          totalParagraphs: paragraphs.length,
        },
      });
    }
  }, [id, article]);

  useEffect(() => {
    const throttled = throttle(handleScroll, 2000);
    window.addEventListener('scroll', throttled);
    return () => window.removeEventListener('scroll', throttled);
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]"
             style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
           style={{ color: 'var(--text-muted)' }}>
          Article not found
        </p>
        <Link to="/articles" className="text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}>
          ← Back to articles
        </Link>
      </div>
    );
  }

  const paragraphs: Paragraph[] = article.paragraphs || [];
  const currentParagraph = progress?.lastParagraph || 0;
  const readTime = Math.ceil((progress?.timeSpent || 0) / 60);

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <nav className="fixed top-0 w-full backdrop-blur-sm z-40 border-b"
           style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link
            to="/articles"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Articles
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => useAppStore.getState().setFontSize('sm')}
              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 transition-colors ${fontSize === 'sm' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : ''}`}
              style={fontSize !== 'sm' ? { color: 'var(--text-muted)' } : undefined}
            >
              A
            </button>
            <button
              onClick={() => useAppStore.getState().setFontSize('base')}
              className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 transition-colors ${fontSize === 'base' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : ''}`}
              style={fontSize !== 'base' ? { color: 'var(--text-muted)' } : undefined}
            >
              A
            </button>
            <button
              onClick={() => useAppStore.getState().setFontSize('lg')}
              className={`text-[13px] font-bold uppercase tracking-widest px-2 py-1 transition-colors ${fontSize === 'lg' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : ''}`}
              style={fontSize !== 'lg' ? { color: 'var(--text-muted)' } : undefined}
            >
              A
            </button>
          </div>
        </div>
        <ProgressBar current={currentParagraph + 1} total={paragraphs.length} className="px-6 md:px-10 max-w-3xl mx-auto pb-2" />
      </nav>

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-6 md:px-10 pt-36 pb-32">
        {/* Article header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
              {article.category}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
              {article.difficulty}
            </span>
            {article.isFromRss && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                RSS
              </span>
            )}
          </div>

          <h1 className="font-['Instrument_Serif'] text-3xl md:text-4xl lg:text-5xl italic leading-tight mb-4"
              style={{ color: 'var(--text-primary)' }}>
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em]"
               style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} />
              {article.source}
              {article.author && ` · ${article.author}`}
            </span>
            {readTime > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {readTime} min read
              </span>
            )}
          </div>
        </header>

        {/* Paragraphs */}
        <div className="space-y-8">
          {paragraphs.map((para: Paragraph, index: number) => {
            const paraAnnotations = annotations.filter(
              (a: Annotation) => a.paragraphId === para.id
            );

            return (
              <motion.div
                key={para.id}
                id={`para-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="border-b pb-8 last:border-0"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* English text */}
                <p
                  className={`${fontSizeClass} leading-relaxed italic font-['Instrument_Serif'] mb-4 cursor-text`}
                  style={{ color: 'var(--text-primary)' }}
                  onMouseUp={(e) => handleMouseUp(para.id, e)}
                >
                  <HighlightedText text={para.originalText} annotations={paraAnnotations} />
                </p>

                {/* Chinese translation */}
                {para.chineseTranslation && (
                  <p className="text-sm leading-relaxed mb-4"
                     style={{ color: 'var(--text-secondary)' }}>
                    {para.chineseTranslation}
                  </p>
                )}

                {/* Grammar / tips toggles */}
                <div className="flex gap-3 flex-wrap">
                  {para.grammaticalAnalysis && (
                    <button
                      onClick={() =>
                        setActiveGrammar(
                          activeGrammar === `grammar-${para.id}` ? null : `grammar-${para.id}`
                        )
                      }
                      className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 transition-colors border hover:border-[var(--border-hover)]"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    >
                      {activeGrammar === `grammar-${para.id}` ? 'Hide' : 'Grammar'}
                    </button>
                  )}
                  {para.expressionTips && (
                    <button
                      onClick={() =>
                        setActiveGrammar(
                          activeGrammar === `tips-${para.id}` ? null : `tips-${para.id}`
                        )
                      }
                      className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 transition-colors border hover:border-[var(--border-hover)]"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    >
                      {activeGrammar === `tips-${para.id}` ? 'Hide' : 'Tips'}
                    </button>
                  )}
                </div>

                {/* Grammar analysis panel */}
                <AnimatePresence>
                  {activeGrammar === `grammar-${para.id}` && para.grammaticalAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 border overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2"
                         style={{ color: 'var(--text-secondary)' }}>
                        Grammar Analysis
                      </p>
                      <p className="text-sm leading-relaxed"
                         style={{ color: 'var(--text-primary)' }}>
                        {para.grammaticalAnalysis}
                      </p>
                    </motion.div>
                  )}
                  {activeGrammar === `tips-${para.id}` && para.expressionTips && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 border overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2"
                         style={{ color: 'var(--text-secondary)' }}>
                           Expression Tips
                      </p>
                      <p className="text-sm leading-relaxed"
                         style={{ color: 'var(--text-primary)' }}>
                        {para.expressionTips}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </article>

      {/* Selection Popup */}
      <AnimatePresence>
        {selection && (
          <SelectionPopup
            selection={selection}
            dictResult={dictResult}
            dictLoading={dictLoading}
            note={note}
            onNoteChange={setNote}
            onAddToVocab={handleAddToVocab}
            onSaveAnnotation={handleSaveAnnotation}
            onClose={closePopup}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/** Renders text with inline annotation highlights */
const HighlightedText = ({ text, annotations }: { text: string; annotations: Annotation[] }) => {
  if (!annotations.length) return <>{text}</>;

  // Simple: highlight if selectedText appears in the paragraph
  let remaining = text;
  const parts: React.ReactNode[] = [];

  annotations.forEach((ann, i) => {
    const idx = remaining.toLowerCase().indexOf(ann.selectedText.toLowerCase());
    if (idx === -1) return;

    if (idx > 0) {
      parts.push(<span key={`pre-${i}`}>{remaining.slice(0, idx)}</span>);
    }

    parts.push(
      <span
        key={`ann-${ann.id}`}
        className="px-0.5 relative group cursor-help"
        title={ann.translation || ann.note || ann.selectedText}
        style={{ filter: 'url(#emboss-1)', backgroundColor: 'rgba(var(--text-muted-rgb, 160,160,160), 0.3)' }}
      >
        {remaining.slice(idx, idx + ann.selectedText.length)}
        {(ann.translation || ann.note) && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg)' }}>
            {ann.translation || ann.note}
          </span>
        )}
      </span>
    );

    remaining = remaining.slice(idx + ann.selectedText.length);
  });

  if (remaining) {
    parts.push(<span key="end">{remaining}</span>);
  }

  return <>{parts}</>;
};

/** Selection popup for word lookup */
const SelectionPopup = ({
  selection,
  dictResult,
  dictLoading,
  note,
  onNoteChange,
  onAddToVocab,
  onSaveAnnotation,
  onClose,
}: {
  selection: { text: string; x: number; y: number };
  dictResult: DictionaryResult | null;
  dictLoading: boolean;
  note: string;
  onNoteChange: (n: string) => void;
  onAddToVocab: () => void;
  onSaveAnnotation: () => void;
  onClose: () => void;
}) => {
  // Position popup, keeping within viewport
  const popupWidth = 320;
  const left = Math.max(16, Math.min(selection.x - popupWidth / 2, window.innerWidth - popupWidth - 16));
  const top = selection.y > 400 ? selection.y - 300 : selection.y + 30;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-80 border shadow-sm"
        style={{ left, top, filter: 'url(#organicEdge)', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        {/* Selected word */}
        <div className="px-5 py-3 border-b"
             style={{ borderColor: 'var(--border)' }}>
          <p className="font-['Instrument_Serif'] text-lg italic"
             style={{ color: 'var(--text-primary)' }}>
            {selection.text}
          </p>
          {dictResult?.phonetic && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dictResult.phonetic}</p>
          )}
        </div>

        {/* Dictionary result */}
        <div className="px-5 py-3 max-h-48 overflow-y-auto">
          {dictLoading ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]"
               style={{ color: 'var(--text-muted)' }}>
              Looking up...
            </p>
          ) : dictResult?.meanings?.length ? (
            dictResult.meanings.map((m, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1"
                   style={{ color: 'var(--text-muted)' }}>
                  {m.partOfSpeech}
                </p>
                {m.definitions.map((d, j) => (
                  <div key={j} className="mb-2 last:mb-0">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{d.definition}</p>
                    {d.example && (
                      <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>"{d.example}"</p>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : dictResult ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No definition found.</p>
          ) : null}
        </div>

        {/* Note input */}
        <div className="px-5 py-3 border-t"
             style={{ borderColor: 'var(--border)' }}>
          <input
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add a note..."
            className="w-full text-xs bg-transparent border-b focus:border-[var(--border-hover)] outline-none py-1 px-0 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t flex gap-2"
             style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onAddToVocab}
            disabled={!dictResult?.meanings?.length}
            className="flex-1 text-[9px] font-bold uppercase tracking-widest py-2 transition-colors disabled:opacity-40"
            style={{ color: 'var(--bg)', backgroundColor: 'var(--text-primary)' }}
          >
            + Vocabulary
          </button>
          <button
            onClick={onSaveAnnotation}
            className="flex-1 text-[9px] font-bold uppercase tracking-widest py-2 transition-colors border hover:border-[var(--border-hover)]"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          >
            Highlight
          </button>
          <button
            onClick={onClose}
            className="text-[9px] font-bold uppercase tracking-widest px-3 py-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      </motion.div>
    </>
  );
};

/** Simple throttle utility */
function throttle<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

export default ArticleReaderPage;
