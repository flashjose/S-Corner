/**
 * InkReveal — 三层 SVG 墨迹揭露组件
 *
 * 桌面端：鼠标移入/移动/移出驱动蒙版揭露
 * 触屏端：触摸按下/滑动模拟相同效果（touch-action: pan-y 保留纵向滚动）
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

interface InkRevealProps {
  /** 是否禁用交互 */
  disabled?: boolean;
}

const SPRING_CONFIG = { damping: 25, stiffness: 150, mass: 0.5 };
const REVEAL_RADIUS_DESKTOP = 130;
const REVEAL_RADIUS_MOBILE = 96;

function useRevealRadius() {
  const [radius, setRadius] = useState(REVEAL_RADIUS_DESKTOP);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setRadius(mq.matches ? REVEAL_RADIUS_MOBILE : REVEAL_RADIUS_DESKTOP);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return radius;
}

const InkReveal: React.FC<InkRevealProps> = ({ disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const revealRadius = useRevealRadius();
  const touchActiveRef = useRef(false);

  const ids = useMemo(() => {
    const uid = Math.random().toString(36).slice(2, 8);
    return {
      mask: `ink-mask-${uid}`,
      filter: `ink-filter-${uid}`,
    };
  }, []);

  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const springX = useSpring(mouseX, SPRING_CONFIG);
  const springY = useSpring(mouseY, SPRING_CONFIG);

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

  const [active, setActive] = useState(false);

  const setPosition = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(clientX - rect.left);
      mouseY.set(clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      setPosition(e.clientX, e.clientY);
      if (e.pointerType === 'mouse') {
        setActive(true);
      } else if (touchActiveRef.current) {
        setActive(true);
      }
    },
    [disabled, setPosition]
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.pointerType !== 'mouse') return;
      setActive(true);
      setPosition(e.clientX, e.clientY);
    },
    [disabled, setPosition]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return;
      setActive(false);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.pointerType === 'mouse') return;
      touchActiveRef.current = true;
      setActive(true);
      setPosition(e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [disabled, setPosition]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') return;
      touchActiveRef.current = false;
      setActive(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    []
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') return;
      touchActiveRef.current = false;
      setActive(false);
    },
    []
  );

  const { w, h } = size;
  const theme = useAppStore((s) => s.theme);
  const overlayFill = theme === 'dark' ? '#050505' : '#ffffff';

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 overflow-hidden pointer-events-auto touch-pan-y"
      style={{ touchAction: 'pan-y' }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
            <filter
              id={ids.filter}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
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
              <feGaussianBlur in="detailDisplaced" stdDeviation="4" result="blurred" />
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

            <mask id={ids.mask}>
              <rect width={w} height={h} fill="white" />
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={revealRadius}
                fill="black"
                filter={`url(#${ids.filter})`}
                style={{
                  opacity: active ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                }}
              />
            </mask>
          </defs>

          <rect width={w} height={h} fill={overlayFill} mask={`url(#${ids.mask})`} />
        </svg>
      )}
    </div>
  );
};

export default InkReveal;
