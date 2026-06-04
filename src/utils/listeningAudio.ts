/**
 * Local listening mp3 path (matches scripts/scrape-listening.mjs output).
 * Used when DB audioUrl is empty but file exists under public/audio/.
 */
export function localListeningAudioPath(categorySlug: string, paperSlug: string): string {
  const fileSlug = paperSlug.replace(/\//g, '-');
  return `/audio/${categorySlug}/${fileSlug}.mp3`;
}

export function resolveListeningAudioUrl(
  categorySlug: string | undefined,
  paperSlug: string | undefined,
  audioUrl?: string | null,
): string | undefined {
  if (audioUrl?.trim()) return audioUrl;
  if (!categorySlug || !paperSlug) return undefined;
  return localListeningAudioPath(categorySlug, paperSlug);
}
