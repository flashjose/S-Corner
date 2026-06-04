import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useExamCategories } from '@/hooks/useExam';
import { useAppStore } from '@/stores/appStore';
import InkReveal from '@/components/InkReveal';
import ErrorState from '@/components/ErrorState';
import type { ExamCategory } from '@/types/exam';
import { useState, useEffect } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  kaoyan: '',
  cet6: '',
  tem: '',
  cet4: '',
};

const HomePage = () => {
  const { data: categories = [], isLoading, isError, refetch } = useExamCategories();
  const theme = useAppStore((s) => s.theme);
  const heroImage = theme === 'dark' ? '/imgs/dark-sparrows.png' : '/imgs/sparrows.png';
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setIsCoarsePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-x-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* ─── Hero Section ─── */}
      <section className="relative h-[100dvh] min-h-[480px] w-full flex flex-col items-center justify-center">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
          draggable={false}
        />
        <InkReveal />

        <div className="relative z-20 text-center px-6 pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-['Instrument_Serif'] text-[14vw] sm:text-[12vw] md:text-[10vw] leading-[0.8] italic"
            style={{ color: 'var(--text-primary)' }}
          >
            S-Corner
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 md:mt-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] max-w-md mx-auto px-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            英语真题在线 · 按试卷排版设计
          </motion.p>

          {isCoarsePointer && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 text-[9px] font-bold uppercase tracking-[0.25em] md:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              触摸滑动 · 揭晓画面
            </motion.p>
          )}
        </div>
      </section>

      {/* ─── Category Grid ─── */}
      <section className="px-4 sm:px-6 md:px-10 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-12 md:mb-16 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            选择考试类型 · Choose Your Exam
          </motion.p>

          {isError ? (
            <ErrorState message="无法加载考试分类" onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="text-center py-20 animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
              加载中...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
              暂无考试分类
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {categories.map((cat: ExamCategory, index: number) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.6 }}
              >
                <Link
                  to={`/${cat.slug}`}
                  className="group block p-6 sm:p-8 md:p-12 border transition-all duration-300 hover:border-[var(--border-hover)] active:border-[var(--border-hover)] active:scale-[0.99] relative overflow-hidden"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <div className="absolute inset-0 opacity-[0.03]" style={{ filter: 'url(#noiseTexture)' }}>
                    <div className="w-full h-full" style={{ backgroundColor: 'var(--text-primary)' }} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4 md:mb-6">
                      <span className="text-2xl sm:text-3xl">{CATEGORY_ICONS[cat.slug]}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 group-hover:opacity-70 group-active:opacity-70 transition-opacity"
                            style={{ color: 'var(--text-muted)' }}>
                        →
                      </span>
                    </div>

                    <h2 className="font-['Instrument_Serif'] text-xl sm:text-2xl md:text-3xl italic mb-2 md:mb-3 group-hover:opacity-80 group-active:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-primary)' }}>
                      {cat.name}
                    </h2>

                    <p className="text-sm leading-relaxed"
                       style={{ color: 'var(--text-secondary)' }}>
                      {cat.description || '历年真题试卷，一站式训练平台'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 md:mt-16 text-center px-2"
          >
            <p className="text-sm leading-relaxed mb-6"
               style={{ color: 'var(--text-secondary)' }}>
              <strong className="cursor-pointer hover:opacity-70 active:opacity-70 transition-opacity">取词查词</strong>
              {' · '}
              <strong className="cursor-pointer hover:opacity-70 active:opacity-70 transition-opacity">句子翻译</strong>
              {' · '}
              <strong className="cursor-pointer hover:opacity-70 active:opacity-70 transition-opacity">查词自动波浪线标记</strong>
            </p>
            <p className="text-xs"
               style={{ color: 'var(--text-muted)' }}>
              电脑、平板、手机都可以使用
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
