/**
 * NoiseOverlay - 全局噪点纹理叠加层
 * 从原始 App.tsx 提取，作为独立组件复用
 */

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
    <svg className="h-full w-full opacity-[0.4] mix-blend-overlay">
      <filter id="heavyNoise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.7"
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
    <div className="absolute inset-0 bg-[#f5f5f5]/5 backdrop-blur-[0.2px]" />
  </div>
);

export default NoiseOverlay;
