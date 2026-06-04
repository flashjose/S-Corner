import type { DictionaryResult } from '@/types/exam';
import { pickDictHeadlineZh } from '@/utils/dictDisplay';

interface DictEntryProps {
  dict: DictionaryResult;
  /** 额外词头中文（缺省时用 dict.wordZh / 义项中文） */
  zh?: string;
}

export default function DictEntry({ dict, zh = '' }: DictEntryProps) {
  const parts = dict.phonetic ? dict.phonetic.split(',').map((s) => s.trim()) : [];
  const headlineZh = zh.trim() || pickDictHeadlineZh(dict);

  return (
    <div>
      <div className="mb-4">
        <span className="font-['Instrument_Serif'] text-xl italic" style={{ color: 'var(--text-primary)' }}>
          {dict.word}
        </span>
        {parts.length > 0 && (
          <span className="ml-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {parts[0]}
          </span>
        )}
        {headlineZh && (
          <span className="ml-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {headlineZh}
          </span>
        )}
      </div>

      {dict.meanings.map((meaning, mi) => (
        <div key={mi} className="mb-4">
          {meaning.partOfSpeech && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)', borderRadius: 2 }}
              >
                {meaning.partOfSpeech}
              </span>
            </div>
          )}

          {meaning.definitions.map((def, di) => {
            const zhLine = meaning.definitionsZh?.[di]?.trim();
            const enLine = def.definition?.trim();
            if (!enLine && !zhLine) return null;

            return (
              <div key={di} className="ml-1 mb-3 pl-3 border-l-2" style={{ borderColor: 'var(--border)' }}>
                {enLine && (
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {enLine}
                  </p>
                )}
                {zhLine && (
                  <p
                    className={`text-[12px] leading-relaxed${enLine ? ' mt-1' : ''}`}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {zhLine}
                  </p>
                )}
                {def.example && (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[11px] italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      &ldquo;{def.example}&rdquo;
                    </p>
                    {def.exampleZh?.trim() && (
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {def.exampleZh.trim()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {dict.meanings.length === 0 && !headlineZh && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>未找到释义</p>
      )}
    </div>
  );
}
