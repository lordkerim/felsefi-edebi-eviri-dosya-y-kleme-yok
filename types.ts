export enum AppMode {
  TRANSLATE = 'translate',
  ANALYZE = 'analyze',
  IMAGINE = 'imagine',
}

export enum TranslationSpeed {
  FAST = 'fast', // Flash Lite
  DEEP = 'deep', // Pro with Thinking
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

export interface TranslationResult {
  original: string;
  translated: string;
  termNotes?: string[];
  groundingUrls?: string[];
}

export interface AnalysisResult {
  text: string;
  groundingUrls?: string[];
}

export interface ImageGenerationResult {
  imageUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  isThinking?: boolean;
  groundingUrls?: string[];
}