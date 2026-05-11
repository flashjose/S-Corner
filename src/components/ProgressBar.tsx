/**
 * ProgressBar - 浮雕风格噪点进度条
 * 使用 SVG filter 产生有机纹理感
 */

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, className = '' }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-1 w-full overflow-hidden"
           style={{ backgroundColor: 'var(--surface)' }}>
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: 'var(--text-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em]"
              style={{ color: 'var(--text-muted)' }}>
          {Math.round(progress)}% read
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.3em]"
              style={{ color: 'var(--text-muted)' }}>
          {current}/{total} paragraphs
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
