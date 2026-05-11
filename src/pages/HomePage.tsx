import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import InkReveal from '@/components/InkReveal';
import { SentenceCard } from '@/components/SentenceCard';
import { getDailySentence } from '@/data/sentenceLibrary';
import { useAppStore } from '@/stores/appStore';

const HomePage = () => {
  // ── 移动端检测：触摸设备直接展示图片，不做遮罩 ──
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches);
  }, []);

  // ── 主题 & 背景图 ──
  const theme = useAppStore((s) => s.theme);
  const heroImage = theme === 'dark' ? '/imgs/sparrows-dark.png' : '/imgs/sparrows.png';

  // ── 每日一句 ──
  const dailySentence = getDailySentence();
  const [favorited, setFavorited] = useState(false);

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-x-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* ─── Hero Section: Sparrow 背景 + 墨迹揭露遮罩 + 标题 ─── */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center">
        {/* z-0: sparrow 背景图 */}
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
          draggable={false}
        />

        {/* z-10: InkReveal 墨迹遮罩覆盖层（disabled 时不渲染，图片直接可见） */}
        <InkReveal disabled={isTouchDevice} />

        {/* z-20: 标题叠加层 */}
        <div className="relative z-20 text-center px-6 pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-['Instrument_Serif'] text-[12vw] md:text-[10vw] leading-[0.8] italic"
            style={{ color: 'var(--text-primary)' }}
          >
            S-Corner
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] max-w-md mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            外刊精读 · 沉浸式英文阅读体验
          </motion.p>
        </div>
      </section>

      {/* ─── 每日一句 Section ─── */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-bold uppercase tracking-[0.4em] mb-12 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            每日一句 · Daily Sentence
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <SentenceCard
              sentence={dailySentence}
              onWordClick={(word) => {
                const keyword = dailySentence.keywords?.find(
                  (k) => k.text.toLowerCase() === word.toLowerCase()
                );
                if (keyword) {
                  alert(
                    `${keyword.text}\n${keyword.pronunciation || ''}\n${keyword.chineseDefinition}\n${keyword.englishDefinition || ''}`
                  );
                }
              }}
              onAnalyze={() => {}}
              onFavorite={() => setFavorited(!favorited)}
              isFavorited={favorited}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
