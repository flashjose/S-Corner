/**
 * 句子库类型定义
 * Sparrow 英文阅读平台 - 句子管理系统
 */

export interface Word {
  text: string;
  pronunciation?: string;
  chineseDefinition: string;
  englishDefinition?: string;
  example?: string;
}

export interface Sentence {
  id: string;
  text: string;
  chineseTranslation: string;
  source: string;
  sourceAuthor?: string;
  category: 'literature' | 'news' | 'essay' | 'science' | 'philosophy' | 'life';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: Word[];
  grammaticalAnalysis?: string;
  rhetoricalDevices?: string[];
  expressionTips?: string;
  relatedExpressions?: string[];
  createdAt: string;
  views?: number;
  favorites?: number;
}

export interface SentenceLibrary {
  sentences: Sentence[];
  totalCount: number;
  lastUpdated: string;
}
