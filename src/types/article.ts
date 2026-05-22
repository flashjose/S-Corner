export interface Article {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category: string;
  difficulty: string;
  tags: string; // JSON string
  isFromRss: boolean;
  rssFeedId?: string;
  imageUrl?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  paragraphs?: Paragraph[];
  annotations?: Annotation[];
  progress?: ReadingProgress[];
  images?: ArticleImage[];
  _count?: { paragraphs: number; annotations: number; images: number };
}

export interface Paragraph {
  id: string;
  articleId: string;
  index: number;
  originalText: string;
  chineseTranslation?: string;
  grammaticalAnalysis?: string;
  expressionTips?: string;
}

export interface Annotation {
  id: string;
  articleId: string;
  paragraphId?: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  translation?: string;
  note?: string;
  color?: string;
  createdAt: string;
}

export interface ArticleImage {
  id: string;
  articleId: string;
  url: string;
  alt?: string;
  caption?: string;
  index: number;
}

export interface ReadingProgress {
  id: string;
  articleId: string;
  lastParagraph: number;
  totalParagraphs: number;
  timeSpent: number;
  isCompleted: boolean;
  lastReadAt: string;
  createdAt: string;
}

export interface DictionaryResult {
  word: string;
  phonetic: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
  message?: string;
}

export interface RssFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  isActive: boolean;
  fetchHour: number;
  fetchMinute: number;
  lastFetchedAt?: string;
  createdAt: string;
}

export interface Stats {
  totalArticles: number;
  publishedArticles: number;
  totalVocabulary: number;
  totalAnnotations: number;
  totalTimeSpent: number;
  completedArticles: number;
  activityByDate: Record<string, number>;
  vocabularyMastery: { level: number; count: number }[];
}
