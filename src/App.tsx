import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
    {/* 极强颗粒感 - 静止的高对比度艺术噪声 */}
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

const MaskedHeroImage = () => {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const springX = useSpring(mouseX, { damping: 40, stiffness: 500, mass: 0.6 });
  const springY = useSpring(mouseY, { damping: 40, stiffness: 500, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center cursor-none overflow-hidden bg-white"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 select-none">
        <h1 className="font-['Instrument_Serif'] text-[18vw] leading-[0.8] italic text-[#292929] opacity-5">
          Sparrow
        </h1>
      </div>

      <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
        <defs>
          <filter id="inkSplatter">
            {/* 多重噪声叠加创造真实泼墨感 */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.015" 
              numOctaves="4" 
              result="texture" 
              seed="5"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="texture" 
              scale="180" 
              xChannelSelector="R" 
              yChannelSelector="G" 
              result="displaced"
            />
            
            {/* 增加边缘的微小不规则溅射 */}
            <feTurbulence baseFrequency="0.08" numOctaves="2" result="detail" seed="10" />
            <feDisplacementMap in="displaced" in2="detail" scale="20" result="finalShape" />

            {/* 液体质感处理 */}
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" />
          </filter>

          <mask id="revealMask">
            <motion.circle 
              cx={useTransform(springX, (v) => `${v}%`)}
              cy={useTransform(springY, (v) => `${v}%`)}
              r="12%" 
              fill="white" 
              filter="url(#inkSplatter)"
            />
            {/* 随机墨点 A */}
            <motion.circle 
              cx={useTransform(springX, (v) => `${v + 6}%`)}
              cy={useTransform(springY, (v) => `${v - 4}%`)}
              r="4%" 
              fill="white" 
              filter="url(#inkSplatter)"
            />
            {/* 随机墨点 B */}
            <motion.circle 
              cx={useTransform(springX, (v) => `${v - 5}%`)}
              cy={useTransform(springY, (v) => `${v + 5}%`)}
              r="3%" 
              fill="white" 
              filter="url(#inkSplatter)"
            />
          </mask>
        </defs>

        <image
          href="../imgs/sparrows.png"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask="url(#revealMask)"
        />
      </svg>

      {/* 极小的跟手指针 */}
      <motion.div 
        className="fixed w-1.5 h-1.5 bg-black rounded-full z-50 pointer-events-none mix-blend-difference"
        style={{
          x: useTransform(springX, (v) => `calc(${v}vw - 3px)`),
          y: useTransform(springY, (v) => `calc(${v}vh - 3px)`),
        }}
      />
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#292929] font-['Manrope'] selection:bg-neutral-200 overflow-x-hidden">
      <NoiseOverlay />
      
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full p-6 md:p-10 flex justify-between items-center z-50">
        <div className="text-[10px] font-bold uppercase tracking-[0.4em]">Sparrow-Joseph</div>
        <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.4em] hidden md:flex">
          <a href="#" className="hover:line-through">Process</a>
          <a href="#" className="hover:line-through">Members</a>
          <a href="#" className="hover:line-through">Contact</a>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.4em]">Index</div>
      </nav>

      {/* 主体部分：蒙版显露 */}
      <section className="relative h-screen w-full">
        <MaskedHeroImage />
        
        {/* 前景文字层：放置在蒙版之上但又不受蒙版影响，或者可以作为蒙版的一部分 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-['Instrument_Serif'] text-[15vw] leading-[0.8] italic text-[#292929]"
          >
            Sparrow
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 max-w-sm"
          >
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#464646] leading-relaxed">
              Asterisk Digital is a lifelong learning community for people who are changing the face of venture capital.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 页脚装饰 */}
      <footer className="fixed bottom-0 w-full p-6 md:p-10 flex justify-between items-end z-50 pointer-events-none">
        <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 max-w-[200px]">
          Changing the face of venture capital through community.
        </div>
        <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">
          Start your journey
        </div>
      </footer>
    </div>
  );
};

export default App;
