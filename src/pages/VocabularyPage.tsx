import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVocabulary, useDeleteVocabulary } from '@/hooks/useVocabulary';
import type { VocabularyItem } from '@/types/vocabulary';
import type { DictionaryResult } from '@/types/exam';
import { dictionaryApi, translateApi } from '@/services/api';
import DictEntry from '@/components/DictEntry';
import { pickDictHeadlineZh } from '@/utils/dictDisplay';
import ErrorState from '@/components/ErrorState';
import { useAuthStore } from '@/stores/authStore';
import { Search, Trash2, BookOpen, ChevronDown } from 'lucide-react';

const dictCache = new Map<string, DictionaryResult>();

interface VocabularyCardProps {
  item: VocabularyItem;
  index: number;
  onDelete: (id: string) => void;
}

function VocabularyCard({ item, index, onDelete }: VocabularyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dict, setDict] = useState<DictionaryResult | null>(null);
  const [dictZh, setDictZh] = useState('');
  const [dictLoading, setDictLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadDictionary = async () => {
    const cached = dictCache.get(item.word);
    if (cached) {
      setDict(cached);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setDictLoading(true);
    try {
      const dictRes = await dictionaryApi.lookup(item.word, true);
      dictCache.set(item.word, dictRes);
      setDict(dictRes);
      const headline = pickDictHeadlineZh(dictRes);
      setDictZh(headline);
      if (!headline) {
        translateApi.translate(item.word, 'en', 'zh-CN')
          .then((r) => setDictZh(r.translated || ''))
          .catch(() => {});
      }
    } finally {
      setDictLoading(false);
      loadingRef.current = false;
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDictionary();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="p-5 border border-transparent hover:border-[var(--border-hover)] transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={handleToggle}
          className="flex-1 min-w-0 text-left cursor-pointer"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-['Instrument_Serif'] text-lg italic" style={{ color: 'var(--text-primary)' }}>
              {item.word}
            </span>
            {item.pronunciation && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {item.pronunciation}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`ml-auto transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-muted)' }}
            />
          </div>

          {item.definition && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {item.definition}
            </p>
          )}

          {item.chineseDefinition && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {item.chineseDefinition}
            </p>
          )}

          {item.example && (
            <p className="text-xs italic leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>
              &ldquo;{item.example}&rdquo;
            </p>
          )}
        </button>

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 hover:text-red-400"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.3em] mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                词典释义
              </p>
              {dictLoading ? (
                <p className="text-[10px] animate-pulse" style={{ color: 'var(--text-muted)' }}>查询中...</p>
              ) : dict ? (
                <DictEntry dict={dict} zh={dictZh} />
              ) : (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>未找到释义</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const VocabularyPage = () => {
  const [search, setSearch] = useState('');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const hydrated = useAuthStore((s) => s.hydrated);

  const params: Record<string, string> = {};
  if (search) params.search = search;

  const { data, isLoading, isError, refetch } = useVocabulary(params, isAuthenticated);
  const deleteVocab = useDeleteVocabulary();
  const vocabularies: VocabularyItem[] = data?.vocabularies || [];

  if (hydrated && !isAuthenticated) {
    return (
      <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
           style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20 text-center">
          <BookOpen size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h1 className="font-['Instrument_Serif'] text-4xl md:text-5xl italic mb-4"
              style={{ color: 'var(--text-primary)' }}>
            Vocabulary
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            登录后即可同步与管理你的生词本
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            登录 / 注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">
        <div className="mb-10">
          <h1 className="font-['Instrument_Serif'] text-4xl md:text-5xl italic mb-4"
              style={{ color: 'var(--text-primary)' }}>
            Vocabulary
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
             style={{ color: 'var(--text-muted)' }}>
            生词本 · {data?.total || 0} words collected
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search words..."
              className="w-full pl-6 text-sm bg-transparent border-b focus:border-[var(--border-hover)] outline-none py-2 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState message="无法加载生词本" onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-5 border"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="h-5 w-32 mb-2" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-full mb-1" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-3/4 mb-1" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-1/2" style={{ backgroundColor: 'var(--surface)' }} />
              </div>
            ))}
          </div>
        ) : vocabularies.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
               style={{ color: 'var(--text-muted)' }}>
              {search ? 'No words match your search' : 'No vocabulary yet'}
            </p>
            <p className="text-sm mt-2"
               style={{ color: 'var(--text-muted)' }}>
              Highlight words while reading to add them here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {vocabularies.map((item, index) => (
              <VocabularyCard
                key={item.id}
                item={item}
                index={index}
                onDelete={(id) => deleteVocab.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
