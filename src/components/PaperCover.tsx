interface PaperCoverProps {
  categorySlug: string;
  year: number;
  month: number;
  setId: number;
  title?: string;
  className?: string;
}

const CATEGORY_STYLES: Record<string, { label: string; accent: string; bg: string; border: string; darkBg: string; darkBorder: string }> = {
  cet4: { label: 'CET-4', accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', darkBg: '#1e293b', darkBorder: '#334155' },
  cet6: { label: 'CET-6', accent: '#059669', bg: '#ecfdf5', border: '#a7f3d0', darkBg: '#1a2e2a', darkBorder: '#334155' },
  kaoyan: { label: '考研', accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', darkBg: '#2e1a1a', darkBorder: '#334155' },
};

const PaperCover = ({ categorySlug, year, month, setId, title, className = '' }: PaperCoverProps) => {
  const style = CATEGORY_STYLES[categorySlug] || CATEGORY_STYLES.cet4;
  const halfYear = month >= 7 ? '下' : '上';
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: isDark ? style.darkBg : style.bg,
        borderColor: isDark ? style.darkBorder : style.border,
      }}
    >
      {/* 顶部色条 */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: style.accent }} />

      {/* 装饰线 */}
      <div className="absolute inset-4 border opacity-30" style={{ borderColor: style.accent }} />
      <div className="absolute inset-6 border opacity-15" style={{ borderColor: style.accent }} />

      <div className="absolute inset-0 flex flex-col items-center justify-between p-5 pt-6">
        <div className="text-center w-full">
          <p
            className="text-[8px] font-bold uppercase tracking-[0.35em] mb-2"
            style={{ color: style.accent }}
          >
            {style.label}
          </p>
          <p
            className="font-['Instrument_Serif'] text-3xl italic leading-none"
            style={{ color: style.accent }}
          >
            {year}
          </p>
          <p className="text-[9px] font-bold mt-1 tracking-widest" style={{ color: style.accent, opacity: 0.7 }}>
            {month}月 · {halfYear}半年
          </p>
        </div>

        <div className="text-center w-full">
          <div
            className="inline-block text-[10px] font-bold px-3 py-1 mb-2 tracking-wider"
            style={{ backgroundColor: style.accent, color: '#fff' }}
          >
            第 {setId} 套
          </div>
          {title && (
            <p
              className="text-[8px] leading-snug line-clamp-2 px-1"
              style={{ color: style.accent, opacity: 0.6 }}
            >
              {title}
            </p>
          )}
        </div>
      </div>

      {/* 右下角装饰 */}
      <div
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full opacity-10"
        style={{ backgroundColor: style.accent }}
      />
    </div>
  );
};

export default PaperCover;
