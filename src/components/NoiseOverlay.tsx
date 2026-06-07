/**
 * NoiseOverlay - 全局噪点纹理叠加层
 * 暗色模式下降低透明度，使用 soft-light 混合以保持清澈
 */

import { useAppStore } from '@/stores/appStore';

const NoiseOverlay = () => {
  const theme = useAppStore((s) => s.theme);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden noise-overlay-mobile-reduce">
      <svg
        className="h-full w-full"
        style={{
          opacity: theme === 'dark' ? 0.15 : 0.4,
          mixBlendMode: theme === 'dark' ? 'soft-light' : 'overlay',
        }}
      >
        <filter id="heavyNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={theme === 'dark' ? '0.6' : '0.7'}
            numOctaves="4"
            seed="1"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.5" intercept="-0.2" />
            <feFuncG type="linear" slope="1.5" intercept="-0.2" />
            <feFuncB type="linear" slope="1.5" intercept="-0.2" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#heavyNoise)" />
      </svg>
    </div>
  );
};

export default NoiseOverlay;
