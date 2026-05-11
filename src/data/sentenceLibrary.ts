/**
 * Sparrow 句子库
 * 精选英文句子数据集
 */

import { Sentence } from '../types/sentence';

export const sentenceLibrary: Sentence[] = [
  {
    id: 'sent-001',
    text: 'The secret of getting ahead is getting started.',
    chineseTranslation: '成功的秘诀在于开始。',
    source: 'Think and Grow Rich',
    sourceAuthor: 'Napoleon Hill',
    category: 'life',
    difficulty: 'easy',
    keywords: [
      {
        text: 'secret',
        pronunciation: '/ˈsiːkrət/',
        chineseDefinition: '秘密，秘诀',
        englishDefinition: 'something that is not known or not told to others',
        example: 'The secret to success is hard work.',
      },
      {
        text: 'getting ahead',
        chineseDefinition: '取得成功，超越他人',
        englishDefinition: 'to make progress or succeed',
      },
    ],
    grammaticalAnalysis: 'This is a parallel structure. "The secret of X is Y" emphasizes the connection between cause and effect.',
    rhetoricalDevices: ['Parallelism', 'Simplicity'],
    expressionTips: '这句话体现了英文写作中的对称美。注意 getting ahead 和 getting started 的平行结构。',
    relatedExpressions: ['take the first step', 'start the ball rolling', 'break the ice'],
    createdAt: '2026-05-09',
    views: 1250,
    favorites: 320,
  },
  {
    id: 'sent-002',
    text: 'It was the best of times, it was the worst of times.',
    chineseTranslation: '这是最好的时代，也是最坏的时代。',
    source: 'A Tale of Two Cities',
    sourceAuthor: 'Charles Dickens',
    category: 'literature',
    difficulty: 'medium',
    keywords: [
      {
        text: 'best',
        chineseDefinition: '最好的',
        englishDefinition: 'of the highest quality; most excellent',
      },
      {
        text: 'worst',
        chineseDefinition: '最坏的',
        englishDefinition: 'of the lowest quality; most bad',
      },
    ],
    grammaticalAnalysis: 'Perfect parallel structure using repetition. The inversion of "was...was..." creates rhythm and contrast.',
    rhetoricalDevices: ['Parallelism', 'Antithesis', 'Epimone (repetition)'],
    expressionTips: '这是英文文学中最著名的开篇之一。并行结构突出了时代的矛盾性。用 best/worst 的对比来表达复杂的时代背景。',
    relatedExpressions: ['paradox', 'contradiction', 'juxtaposition'],
    createdAt: '2026-05-08',
    views: 2840,
    favorites: 1120,
  },
  {
    id: 'sent-003',
    text: 'The only way to do great work is to love what you do.',
    chineseTranslation: '做伟大工作的唯一方式就是热爱你所做的事。',
    source: 'Stanford Commencement Address',
    sourceAuthor: 'Steve Jobs',
    category: 'life',
    difficulty: 'easy',
    keywords: [
      {
        text: 'way',
        chineseDefinition: '方式，方法',
        englishDefinition: 'a method or direction of doing something',
      },
      {
        text: 'great work',
        chineseDefinition: '伟大的工作',
        englishDefinition: 'work of high quality and importance',
      },
      {
        text: 'love',
        chineseDefinition: '热爱',
        englishDefinition: 'to have a deep romantic or platonic affection for someone or something',
      },
    ],
    grammaticalAnalysis: 'Simple declarative sentence with strong emphasis. The structure "the only way to do X is to Y" presents a definitive assertion.',
    rhetoricalDevices: ['Assertion', 'Universal truth', 'Simplicity'],
    expressionTips: '这是一句经典的人生哲理。注意 "the only way to do" 的表达方式，显得绝对和有说服力。',
    relatedExpressions: ['passion', 'dedication', 'commitment'],
    createdAt: '2026-05-09',
    views: 3560,
    favorites: 1890,
  },
  {
    id: 'sent-004',
    text: 'All happy families are alike; each unhappy family is unhappy in its own way.',
    chineseTranslation: '所有幸福的家庭都是相似的，而每个不幸的家庭各有各的不幸。',
    source: 'Anna Karenina',
    sourceAuthor: 'Leo Tolstoy',
    category: 'literature',
    difficulty: 'hard',
    keywords: [
      {
        text: 'alike',
        chineseDefinition: '相似的，相同的',
        englishDefinition: 'similar in appearance or nature',
      },
      {
        text: 'unhappy',
        chineseDefinition: '不幸的，不快乐的',
        englishDefinition: 'not happy; sad or discontented',
      },
    ],
    grammaticalAnalysis: 'Antithetical structure with contrast between "happy" and "unhappy". Uses universal statements with different conclusions.',
    rhetoricalDevices: ['Antithesis', 'Paradox', 'Universality'],
    expressionTips: '俄国文学的经典开篇。通过对比幸福与不幸的特点，提出了深刻的人生哲学。注意英文原文的对称之美。',
    relatedExpressions: ['misery', 'contentment', 'harmony'],
    createdAt: '2026-05-07',
    views: 1920,
    favorites: 680,
  },
  {
    id: 'sent-005',
    text: 'To be, or not to be, that is the question.',
    chineseTranslation: '生存还是毁灭，这是个问题。',
    source: 'Hamlet',
    sourceAuthor: 'William Shakespeare',
    category: 'literature',
    difficulty: 'hard',
    keywords: [
      {
        text: 'be',
        chineseDefinition: '存在，生存',
        englishDefinition: 'to exist; to have existence',
      },
      {
        text: 'question',
        chineseDefinition: '问题',
        englishDefinition: 'a sentence worded or expressed so as to elicit information',
      },
    ],
    grammaticalAnalysis: 'Rhetorical question using binary opposition. The infinitive "to be" is elevated to philosophical status.',
    rhetoricalDevices: ['Rhetorical question', 'Existentialism', 'Repetition', 'Antithesis'],
    expressionTips: '莎士比亚最著名的独白。用最简单的词汇表达最深刻的哲学问题。英文中 "to be or not to be" 成为了不可或缺的表达。',
    relatedExpressions: ['existence', 'mortality', 'dilemma'],
    createdAt: '2026-05-06',
    views: 4230,
    favorites: 2340,
  },
  {
    id: 'sent-006',
    text: 'The early bird catches the worm, but the second mouse gets the cheese.',
    chineseTranslation: '早起的鸟儿有虫吃，但第二只老鼠得到奶酪。',
    source: 'Popular Saying (adapted)',
    category: 'life',
    difficulty: 'medium',
    keywords: [
      {
        text: 'early bird',
        chineseDefinition: '早起的人',
        englishDefinition: 'a person who rises early in the morning',
      },
      {
        text: 'worm',
        chineseDefinition: '虫子',
        englishDefinition: 'a small invertebrate animal',
      },
      {
        text: 'cheese',
        chineseDefinition: '奶酪，干酪',
        englishDefinition: 'a food made from milk',
      },
    ],
    grammaticalAnalysis: 'Paradoxical proverb that subverts traditional wisdom through parallel structure.',
    rhetoricalDevices: ['Paradox', 'Proverb variation', 'Humor', 'Inversion'],
    expressionTips: '这是对传统谚语的创意改写。通过第二只鼠的例子制造幽默，表达了"大胆尝试"的哲学。',
    relatedExpressions: ['fortune favors the bold', 'risk-taking', 'unconventional wisdom'],
    createdAt: '2026-05-05',
    views: 890,
    favorites: 420,
  },
];

/**
 * 获取每日推荐句子
 */
export const getDailySentence = (): Sentence => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return sentenceLibrary[dayOfYear % sentenceLibrary.length];
};

/**
 * 获取随机句子
 */
export const getRandomSentence = (): Sentence => {
  return sentenceLibrary[Math.floor(Math.random() * sentenceLibrary.length)];
};

/**
 * 按难度获取句子
 */
export const getSentencesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Sentence[] => {
  return sentenceLibrary.filter((s) => s.difficulty === difficulty);
};

/**
 * 按分类获取句子
 */
export const getSentencesByCategory = (
  category: 'literature' | 'news' | 'essay' | 'science' | 'philosophy' | 'life'
): Sentence[] => {
  return sentenceLibrary.filter((s) => s.category === category);
};

/**
 * 获取最受欢迎的句子
 */
export const getTopFavoriteSentences = (limit: number = 5): Sentence[] => {
  return [...sentenceLibrary].sort((a, b) => (b.favorites || 0) - (a.favorites || 0)).slice(0, limit);
};

/**
 * 获取最多浏览的句子
 */
export const getTopViewedSentences = (limit: number = 5): Sentence[] => {
  return [...sentenceLibrary].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limit);
};
