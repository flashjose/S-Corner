/**
 * InkReveal — 三层 SVG 墨迹揭露组件
 *
 * 第一层: useMotionValue + useSpring 弹性鼠标跟踪
 * 第二层: SVG <mask> + feTurbulence/feDisplacementMap 墨迹边缘
 * 第三层: (NoiseOverlay 在 App.tsx 全局叠加)
 *
 * 原理：sparrow 图片是下方 HTML <img> (z-0)。
 * 本组件渲染一个白色 SVG 覆盖层 (z-10)。
 * 通过 SVG mask 在鼠标位置打洞来揭露底层图片。
 * mask 中：白色 = 覆盖层可见（遮住图片），黑色 = 覆盖层不可见（露出图片）。
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

interface InkRevealProps {
  /** 是否禁用交互（移动端直接展示图片） */
  disabled?: boolean;
}

// ─── 弹簧参数（可调） ───────────────────────────────────────
const SPRING_CONFIG = { damping: 25, stiffness: 150, mass: 0.5 };

// ─── 墨迹揭露半径 ──────────────────────────────────────────
const REVEAL_RADIUS = 130;

const InkReveal: React.FC<InkRevealProps> = ({ disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // ── 唯一 ID（避免同页多个实例冲突） ──────────────────────
  const ids = useMemo(() => {
    const uid = Math.random().toString(36).slice(2, 8);
    return {
      mask: `ink-mask-${uid}`,
      filter: `ink-filter-${uid}`,
    };
  }, []);

  // ── 第一层：弹性鼠标跟踪 ──────────────────────────────────
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const springX = useSpring(mouseX, SPRING_CONFIG);
  const springY = useSpring(mouseY, SPRING_CONFIG);

  // 将 spring 值同步到 React state，用于驱动 SVG 属性
  const [pos, setPos] = useState({ cx: -500, cy: -500 });

  useEffect(() => {
    const unsubX = springX.on('change', (v) =>
      setPos((p) => (p.cx === v ? p : { ...p, cx: v }))
    );
    const unsubY = springY.on('change', (v) =>
      setPos((p) => (p.cy === v ? p : { ...p, cy: v }))
    );
    return () => {
      unsubX();
      unsubY();
    };
  }, [springX, springY]);

  // ── 容器尺寸（ResizeObserver） ──────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.ceil(rect.width), h: Math.ceil(rect.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── 交互可见性（鼠标进入时开始揭露，离开后隐藏） ────────
  const [active, setActive] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [disabled, mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setActive(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setActive(false);
  }, []);

  // 触摸事件（移动端支持滑动揭露）
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(touch.clientX - rect.left);
      mouseY.set(touch.clientY - rect.top);
      if (!active) setActive(true);
    },
    [mouseX, mouseY, active]
  );

  const { w, h } = size;
  const theme = useAppStore((s) => s.theme);
  const overlayFill = theme === 'dark' ? '#0a0a0a' : '#ffffff';

  // disabled 时直接不渲染遮罩层，sparrow 图片完全可见
  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 overflow-hidden pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
    >
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="absolute inset-0 block"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            {/* ──────────────────────────────────────────────
                第二层：墨迹边缘 SVG Filter
                三层滤镜嵌套：粗变形 → 飞溅细节 → 液化晕染
               ────────────────────────────────────────────── */}
            <filter
              id={ids.filter}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              {/* ① 粗变形：feTurbulence 低频噪声 + feDisplacementMap 大位移
                  把硬边圆形扭曲成不规则墨迹轮廓 */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="4"
                seed="5"
                result="coarseNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="coarseNoise"
                scale="180"
                xChannelSelector="R"
                yChannelSelector="G"
                result="coarseDisplaced"
              />

              {/* ② 飞溅细节：feTurbulence 高频噪声 + feDisplacementMap 小位移
                  在粗变形基础上叠加墨滴飞溅的微细节 */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.08"
                numOctaves="2"
                seed="10"
                result="detailNoise"
              />
              <feDisplacementMap
                in="coarseDisplaced"
                in2="detailNoise"
                scale="20"
                xChannelSelector="R"
                yChannelSelector="G"
                result="detailDisplaced"
              />

              {/* ③ 液化晕染：高斯模糊 + alpha 增益
                  模拟墨水在纸面晕开的液化效果 */}
              <feGaussianBlur
                in="detailDisplaced"
                stdDeviation="4"
                result="blurred"
              />
              <feColorMatrix
                in="blurred"
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 35 -15"
                result="inkEdge"
              />
            </filter>

            {/* ──────────────────────────────────────────────
                SVG Mask：控制白色覆盖层哪里可见、哪里透明
                白色 = 覆盖层可见（遮住图片）
                黑色 = 覆盖层不可见（露出图片）
               ────────────────────────────────────────────── */}
            <mask id={ids.mask}>
              {/* 全白背景：整片覆盖层都可见 */}
              <rect width={w} height={h} fill="white" />

              {/* 黑色墨迹圆：覆盖层不可见，露出底层 sparrow 图片
                  应用 ink filter 产生不规则墨迹边缘 */}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={REVEAL_RADIUS}
                fill="black"
                filter={`url(#${ids.filter})`}
                style={{
                  opacity: active ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                }}
              />
            </mask>
          </defs>

          {/* 覆盖层，用 mask 打洞揭露底层图片 */}
          <rect
            width={w}
            height={h}
            fill={overlayFill}
            mask={`url(#${ids.mask})`}
          />
        </svg>
      )}
    </div>
  );
};

export default InkReveal;
