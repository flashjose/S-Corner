/** PDF 渲染基准：100% 对应 scale = BASE_RENDER_SCALE */
const PDF_BASE_RENDER_SCALE = 1.5;

export function zoomToRenderScale(zoomPercent: number): number {
  return (zoomPercent / 100) * PDF_BASE_RENDER_SCALE;
}

function renderScaleToZoom(scale: number): number {
  return Math.round((scale / PDF_BASE_RENDER_SCALE) * 100);
}

/** 根据容器宽度计算「适应宽度」的 zoom 百分比 */
export function computeFitWidthZoom(
  pageWidthAtScale1: number,
  containerWidth: number,
  horizontalPadding = 16,
): number {
  if (pageWidthAtScale1 <= 0 || containerWidth <= 0) return 100;
  const available = containerWidth - horizontalPadding * 2;
  const targetScale = available / pageWidthAtScale1;
  const zoom = renderScaleToZoom(targetScale);
  return Math.min(150, Math.max(45, Math.round(zoom / 5) * 5));
}

export function isMobilePdfLayout(): boolean {
  return window.matchMedia('(max-width: 767px)').matches;
}

/** 移动端默认缩放：略大于适应宽度，可横滑查看其余内容 */
export const MOBILE_DEFAULT_ZOOM = 100;

export const PDF_ZOOM_OPTIONS_MOBILE = [70, 80, 90, 100, 110, 125, 150, 175, 200];
export const PDF_ZOOM_OPTIONS_DESKTOP = [50, 75, 100, 125, 150, 200, 300, 400];
