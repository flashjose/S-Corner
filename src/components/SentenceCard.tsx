/**
 * 句子卡片组件
 * 用于展示单个句子及其解析
 */

import { motion } from 'framer-motion';
import { Sentence } from '../types/sentence';

interface SentenceCardProps {
  sentence: Sentence;
  onWordClick?: (word: string) => void;
  onAnalyze?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  onWordClick,
  onAnalyze,
  onFavorite,
  isFavorited = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto p-8 md:p-12 border hover:border-neutral-400 transition-colors"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
    >
      {/* 分类和难度标签 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}>
            {sentence.category}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}>
            {sentence.difficulty}
          </span>
        </div>
        <button
          onClick={onFavorite}
          className={`text-[12px] font-bold uppercase tracking-widest transition-colors ${
            isFavorited ? 'text-red-500' : 'opacity-40 hover:opacity-70'
          }`}
        >
          ♡ {sentence.favorites || 0}
        </button>
      </div>

      {/* 英文句子 - 可点词 */}
      <div className="mb-8">
        <p className="text-lg md:text-xl leading-relaxed italic font-['Instrument_Serif'] mb-4"
           style={{ color: 'var(--text-primary)' }}>
          {sentence.text.split(/\s+/).map((word, index) => (
            <span
              key={index}
              onClick={() => onWordClick?.(word.replace(/[.,;:!?]/g, ''))}
              className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>

      {/* 中文翻译 */}
      <div className="mb-8 pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {sentence.chineseTranslation}
        </p>
      </div>

      {/* 来源信息 */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]"
           style={{ color: 'var(--text-muted)' }}>
          from <span style={{ color: 'var(--text-secondary)' }}>{sentence.source}</span>
          {sentence.sourceAuthor && <span style={{ color: 'var(--text-secondary)' }}> • {sentence.sourceAuthor}</span>}
        </p>
      </div>

      {/* 语法分析 */}
      {sentence.grammaticalAnalysis && (
        <div className="mb-6 p-4 border"
             style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
             style={{ color: 'var(--text-secondary)' }}>
            Grammar Analysis
          </p>
          <p className="text-sm leading-relaxed"
             style={{ color: 'var(--text-primary)' }}>
            {sentence.grammaticalAnalysis}
          </p>
        </div>
      )}

      {/* 修辞手法 */}
      {sentence.rhetoricalDevices && sentence.rhetoricalDevices.length > 0 && (
        <div className="mb-6 p-4 border"
             style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
             style={{ color: 'var(--text-secondary)' }}>
            Rhetorical Devices
          </p>
          <div className="flex flex-wrap gap-2">
            {sentence.rhetoricalDevices.map((device, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                {device}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 表达提示 */}
      {sentence.expressionTips && (
        <div className="mb-6 p-4 border border-blue-200"
             style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-blue-700">
            💡 Expression Tips
          </p>
          <p className="text-sm leading-relaxed"
             style={{ color: 'var(--text-primary)' }}>
            {sentence.expressionTips}
          </p>
        </div>
      )}

      {/* AI分析按钮 */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onAnalyze}
          className="text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 transition-colors"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg)',
          }}
        >
          Deep AI Analysis
        </button>
      </div>
    </motion.div>
  );
};

/**
 * 句子列表组件
 */
interface SentenceListProps {
  sentences: Sentence[];
  onSentenceClick?: (sentence: Sentence) => void;
}

export const SentenceList: React.FC<SentenceListProps> = ({ sentences, onSentenceClick }) => {
  return (
    <div className="space-y-6">
      {sentences.map((sentence, index) => (
        <motion.div
          key={sentence.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSentenceClick?.(sentence)}
          className="p-6 border border-neutral-200 hover:border-neutral-400 cursor-pointer transition-all hover:shadow-md"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-1">
                {sentence.category}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-1">
                {sentence.difficulty}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {sentence.views} views • {sentence.favorites} favorites
            </p>
          </div>
          <p className="text-base text-neutral-900 italic font-['Instrument_Serif'] mb-3 line-clamp-2">
            {sentence.text}
          </p>
          <p className="text-sm text-neutral-600">
            {sentence.chineseTranslation}
          </p>
          <p className="text-[10px] text-neutral-400 mt-3">
            {sentence.source} {sentence.sourceAuthor && `• ${sentence.sourceAuthor}`}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
