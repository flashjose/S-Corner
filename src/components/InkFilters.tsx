/**
 * SVG Ink/Emboss Filter Definitions
 * 集中管理所有 SVG 滤镜，各组件通过 url(#id) 引用
 */

const InkFilters = () => (
  <svg className="absolute w-0 h-0" aria-hidden="true">
    <defs>
      {/* 泼墨滤镜 - 用于蒙版、高亮边框等 */}
      <filter id="inkSplatter" x="-50%" y="-50%" width="200%" height="200%">
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
        <feTurbulence baseFrequency="0.08" numOctaves="2" result="detail" seed="10" />
        <feDisplacementMap in="displaced" in2="detail" scale="20" result="finalShape" />
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15"
        />
      </filter>

      {/* 浮雕滤镜 A - 用于高亮标注（略粗糙） */}
      <filter id="emboss-1" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="3"
          result="noise"
          seed="1"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="0.5" result="blur" />
        <feComposite in="blur" in2="noise" operator="in" />
      </filter>

      {/* 浮雕滤镜 B - 另一种纹理 */}
      <filter id="emboss-2" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.06"
          numOctaves="2"
          result="noise"
          seed="7"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="0.3" result="blur" />
        <feComposite in="blur" in2="noise" operator="in" />
      </filter>

      {/* 噪点纹理 - 用于进度条、图表填充 */}
      <filter id="noiseTexture" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
        <feComponentTransfer in="mono" result="contrast">
          <feFuncR type="linear" slope="1.5" intercept="-0.2" />
          <feFuncG type="linear" slope="1.5" intercept="-0.2" />
          <feFuncB type="linear" slope="1.5" intercept="-0.2" />
        </feComponentTransfer>
      </filter>

      {/* 有机边缘 - 用于弹窗外壳 */}
      <filter id="organicEdge" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.03"
          numOctaves="4"
          result="warp"
          seed="3"
        />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

export default InkFilters;
