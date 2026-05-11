import { motion } from 'framer-motion';
import { useStats } from '@/hooks/useStats';
import { BookOpen, Clock, Bookmark, Layers } from 'lucide-react';

const StatsPage = () => {
  const { data: stats, isLoading } = useStats();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: 'var(--bg)' }}>
        <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]"
             style={{ color: 'var(--text-muted)' }}>
          Loading stats...
        </div>
      </div>
    );
  }

  // Generate heatmap data for last 90 days
  const heatmapDays = 90;
  const today = new Date();
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = heatmapDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    heatmapData.push({
      date: key,
      count: stats?.activityByDate?.[key] ? Math.ceil(stats.activityByDate[key] / 60) : 0,
    });
  }
  const maxHeat = Math.max(...heatmapData.map((d) => d.count), 1);

  const getHeatColor = (count: number, intensity: number) => {
    if (count === 0) return 'var(--surface)';
    if (intensity < 0.25) return 'var(--border-hover)';
    if (intensity < 0.5) return 'var(--text-muted)';
    if (intensity < 0.75) return 'var(--text-secondary)';
    return 'var(--text-primary)';
  };

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-['Instrument_Serif'] text-4xl md:text-5xl italic mb-4"
              style={{ color: 'var(--text-primary)' }}>
            Statistics
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
             style={{ color: 'var(--text-muted)' }}>
            学习统计 · Your reading journey
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {([
            { label: 'Articles', value: stats?.publishedArticles || 0, icon: BookOpen },
            { label: 'Read Time', value: formatTime(stats?.totalTimeSpent || 0), icon: Clock },
            { label: 'Vocabulary', value: stats?.totalVocabulary || 0, icon: Bookmark },
            { label: 'Annotations', value: stats?.totalAnnotations || 0, icon: Layers },
          ]).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 border"
              style={{ borderColor: 'var(--border)' }}
            >
              <stat.icon size={16} className="mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-['Instrument_Serif'] text-2xl italic mb-1"
                 style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em]"
                 style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Activity heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
             style={{ color: 'var(--text-muted)' }}>
            Reading Activity (Last 90 Days)
          </p>
          <div className="flex flex-wrap gap-[3px]">
            {heatmapData.map((day) => {
              const intensity = day.count / maxHeat;

              return (
                <div
                  key={day.date}
                  className="w-3 h-3 cursor-default"
                  title={`${day.date}: ${day.count} min`}
                  style={{
                    backgroundColor: getHeatColor(day.count, intensity),
                    filter: day.count > 0 ? 'url(#noiseTexture)' : undefined,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[8px] uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>Less</span>
            {['var(--surface)', 'var(--border-hover)', 'var(--text-muted)', 'var(--text-secondary)', 'var(--text-primary)'].map(
              (bg, i) => (
                <div key={i} className="w-3 h-3" style={{ backgroundColor: bg }} />
              )
            )}
            <span className="text-[8px] uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>More</span>
          </div>
        </motion.div>

        {/* Vocabulary mastery distribution */}
        {stats?.vocabularyMastery?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
               style={{ color: 'var(--text-muted)' }}>
              Vocabulary Mastery
            </p>
            <div className="space-y-3">
              {['New', 'Learning', 'Familiar', 'Known', 'Mastered'].map((label, level) => {
                const entry = stats.vocabularyMastery.find((v: any) => v.level === level);
                const count = entry?.count || 0;
                const total = stats.totalVocabulary || 1;
                const pct = (count / total) * 100;

                return (
                  <div key={level} className="flex items-center gap-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest w-16"
                          style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                    <div className="flex-1 h-1.5 overflow-hidden"
                         style={{ backgroundColor: 'var(--surface)' }}>
                      <motion.div
                        className="h-full"
                        style={{ backgroundColor: 'var(--text-primary)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * level }}
                      />
                    </div>
                    <span className="text-[9px] w-8 text-right"
                          style={{ color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
