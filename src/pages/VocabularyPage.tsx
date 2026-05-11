import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVocabulary, useDeleteVocabulary, useUpdateVocabulary } from '@/hooks/useVocabulary';
import type { VocabularyItem } from '@/types/vocabulary';
import { Search, Trash2, BookOpen } from 'lucide-react';

const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Known', 'Mastered'];
const MASTERY_STYLES = [
  { backgroundColor: 'var(--text-primary)' },
  { backgroundColor: '#525252' },
  { backgroundColor: '#737373' },
  { backgroundColor: '#a3a3a3' },
  { backgroundColor: 'var(--surface)' },
];

const VocabularyPage = () => {
  const [search, setSearch] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<number | null>(null);

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (masteryFilter !== null) params.masteryLevel = String(masteryFilter);

  const { data, isLoading } = useVocabulary(params);
  const deleteVocab = useDeleteVocabulary();
  const updateVocab = useUpdateVocabulary();
  const vocabularies: VocabularyItem[] = data?.vocabularies || [];

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">
        {/* Header */}
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

        {/* Search & filters */}
        <div className="mb-8 space-y-4">
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

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2"
               style={{ color: 'var(--text-muted)' }}>
              Mastery Level
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMasteryFilter(null)}
                className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors ${
                  masteryFilter === null
                    ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                    : 'border hover:border-[var(--border-hover)]'
                }`}
                style={masteryFilter !== null ? { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
              >
                All
              </button>
              {MASTERY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setMasteryFilter(i)}
                  className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors ${
                    masteryFilter === i
                      ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'border hover:border-[var(--border-hover)]'
                  }`}
                  style={masteryFilter !== i ? { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vocabulary list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-5 border"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="h-5 w-32 mb-2" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-48 mb-1" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-64" style={{ backgroundColor: 'var(--surface)' }} />
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
            {vocabularies.map((item: VocabularyItem, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="p-5 border border-transparent hover:border-[var(--border-hover)] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-['Instrument_Serif'] text-lg italic"
                            style={{ color: 'var(--text-primary)' }}>
                        {item.word}
                      </span>
                      {item.pronunciation && (
                        <span className="text-[11px]"
                              style={{ color: 'var(--text-muted)' }}>{item.pronunciation}</span>
                      )}
                      {/* Mastery indicator */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={i <= item.masteryLevel ? MASTERY_STYLES[item.masteryLevel] : { backgroundColor: 'var(--surface)' }}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed mb-1"
                       style={{ color: 'var(--text-primary)' }}>
                      {item.definition}
                    </p>
                    <p className="text-sm leading-relaxed"
                       style={{ color: 'var(--text-secondary)' }}>
                      {item.chineseDefinition}
                    </p>

                    {item.example && (
                      <p className="text-xs italic mt-2"
                         style={{ color: 'var(--text-muted)' }}>
                        "{item.example}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Mastery buttons */}
                    {[0, 1, 2, 3, 4].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          updateVocab.mutate({ id: item.id, data: { masteryLevel: level } })
                        }
                        className="w-4 h-4 rounded-full border transition-colors"
                        style={item.masteryLevel === level
                          ? { ...MASTERY_STYLES[level], borderColor: 'var(--border-hover)' }
                          : { borderColor: 'var(--border)' }
                        }
                        title={MASTERY_LABELS[level]}
                      />
                    ))}
                    <button
                      onClick={() => deleteVocab.mutate(item.id)}
                      className="ml-2 hover:text-red-400 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
