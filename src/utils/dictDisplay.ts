import type { DictionaryResult } from '@/types/exam';

/** 清理词头中文（去掉 up/ap/上涨 等混杂内容） */
export function sanitizeWordZh(raw?: string | null): string {
  if (!raw?.trim()) return '';
  const m = raw.match(/[\u4e00-\u9fff][\u4e00-\u9fff\s·；，、：:（）()\-]*/);
  return m ? m[0].trim() : raw.trim();
}

/** 词头摘要中文：优先 wordZh，否则取首条义项中文 */
export function pickDictHeadlineZh(dict: DictionaryResult): string {
  const fromWord = sanitizeWordZh(dict.wordZh);
  if (fromWord) return fromWord;
  for (const m of dict.meanings) {
    const z = m.definitionsZh?.find((s) => s?.trim());
    if (z) return z.trim();
  }
  return '';
}

export function pickChineseForVocab(dict: DictionaryResult): string {
  const headline = pickDictHeadlineZh(dict);
  if (headline) return headline;
  const parts: string[] = [];
  for (const m of dict.meanings) {
    m.definitionsZh?.forEach((z) => {
      if (z?.trim()) parts.push(z.trim());
    });
  }
  return parts.slice(0, 2).join('；');
}
