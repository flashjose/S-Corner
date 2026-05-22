import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useExamPapers } from '@/hooks/useExam';
import PaperCover from '@/components/PaperCover';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function PaperCoverImage({ paper, categorySlug }: { paper: any; categorySlug: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasCustomCover = paper.coverImage && !imgFailed;

  return (
    <div className="aspect-[3/4] overflow-hidden relative" style={{ backgroundColor: 'var(--surface)' }}>
      {hasCustomCover ? (
        <img
          src={paper.coverImage}
          alt={paper.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <PaperCover
          categorySlug={categorySlug}
          year={paper.year}
          month={paper.month}
          setId={paper.setId}
          title={paper.shortTitle || paper.title}
          className="group-hover:scale-105 transition-transform duration-300"
        />
      )}
    </div>
  );
}

const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data, isLoading } = useExamPapers(categorySlug!);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const showMaxYears = 4;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: 'var(--bg)' }}>
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]"
             style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4"
           style={{ backgroundColor: 'var(--bg)' }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
           style={{ color: 'var(--text-muted)' }}>
          Category not found
        </p>
        <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}>
          ← Back to home
        </Link>
      </div>
    );
  }

  const { category, sections, totalPapers } = data;
  const visibleSections = expandedYears.has('all')
    ? sections
    : sections.slice(0, showMaxYears);
  const hasMore = sections.length > showMaxYears;

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">

        {/* Header */}
        <div className="mb-10">
          <Link to="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={12} />
            返回
          </Link>

          <h1 className="font-['Instrument_Serif'] text-4xl md:text-5xl italic mb-3"
              style={{ color: 'var(--text-primary)' }}>
            {category.name}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
             style={{ color: 'var(--text-muted)' }}>
            2016 - 2025年，历年{totalPapers}套真题试卷
          </p>
        </div>

        {/* Paper sections by year */}
        {visibleSections.map((section: any, sIndex: number) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIndex * 0.08 }}
            className="mb-8"
          >
            <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4"
                style={{ color: 'var(--text-secondary)' }}>
              {section.title}
            </h2>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {section.papers.map((paper: any, pIndex: number) => {
                const progressPct = paper.progress
                  ? Math.round((paper.progress.currentPage / Math.max(paper.progress.totalPages, 1)) * 100)
                  : 0;
                const isNew = paper.year >= 2025;

                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIndex * 0.08 + pIndex * 0.05 }}
                  >
                    <Link
                      to={`/${categorySlug}/${paper.slug}`}
                      className="group block border transition-all duration-300 hover:border-[var(--border-hover)] relative overflow-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="relative">
                        <PaperCoverImage paper={paper} categorySlug={categorySlug!} />
                        {isNew && (
                          <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 z-10"
                                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg)' }}>
                            新
                          </span>
                        )}
                      </div>

                      {/* 标题和进度 */}
                      <div className="p-3">
                        <p className="text-[10px] font-medium leading-tight mb-2 line-clamp-2"
                           style={{ color: 'var(--text-primary)' }}>
                          {paper.shortTitle || paper.title}
                        </p>
                        <div className="h-0.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                          <div className="h-full transition-all duration-300"
                               style={{
                                 width: `${progressPct}%`,
                                 backgroundColor: progressPct > 0 ? 'var(--text-primary)' : 'transparent',
                               }} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {sIndex < visibleSections.length - 1 && (
              <div className="mt-8" style={{ borderBottom: '1px solid var(--border)' }} />
            )}
          </motion.div>
        ))}

        {/* 展开更多 */}
        {hasMore && !expandedYears.has('all') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <button
              onClick={() => setExpandedYears(prev => new Set(prev).add('all'))}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-70 transition-opacity cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronDown size={14} />
              展开更多年份
            </button>
            <p className="text-[9px] mt-3" style={{ color: 'var(--text-muted)' }}>
              真题逐年难易程度等已变化，建议使用近些年的真题学习和训练
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
