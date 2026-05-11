export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation?: string;
  definition: string;
  chineseDefinition: string;
  example?: string;
  sourceArticleId?: string;
  masteryLevel: number;
  createdAt: string;
  updatedAt: string;
}
