/**
 * CET4/CET6 listening papers on zhenti.burningvocabulary.cn.
 * CET4: 6 periods × 3 sets = 18
 * CET6: 6 periods × 3 sets = 18 (includes 2023-06, 2023-12)
 * Total: 36 papers with listening audio
 *
 * Not included: kaoyan (no listening), tem4/tem8 (404 on site)
 */

const BASE_URL = 'https://zhenti.burningvocabulary.cn';

const PERIODS = ['2023-06', '2023-12', '2024-06', '2024-12', '2025-06', '2025-12'];

function buildPages(category) {
  return PERIODS.flatMap((period) =>
    [1, 2, 3].map((set) => {
      const setSlug = set.toString().padStart(2, '0');
      const slug = `${period}/${setSlug}`;
      return {
        category,
        slug,
        url: `${BASE_URL}/${category}/${period}/${setSlug}`,
      };
    }),
  );
}

export const LISTENING_EXAM_PAGES = [...buildPages('cet4'), ...buildPages('cet6')];

export const LISTENING_EXAM_COUNT = LISTENING_EXAM_PAGES.length;
