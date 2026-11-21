import type { GeopoliticalTopicId } from './utils/topicFilter';

export type LanguageCode = 'ar' | 'en' | 'tr';

export type AiEnginePreference = 'auto' | 'gemini' | 'openrouter';

export interface AppSettings {
  autoTranslateToUyghur: boolean;
  autoDailyRefresh: boolean;
  refreshIntervalHours: number;
  strictGeopoliticalFilter: boolean;
  enabledTopics: GeopoliticalTopicId[];
  preferredEngine: AiEnginePreference;
  openRouterModel: string;
}

export interface GlossaryRule {
  id: string;
  wrong: string;
  correct: string;
  note?: string;
  enabled: boolean;
  builtIn?: boolean;
}

export interface ServerEngineStatus {
  geminiAvailable: boolean;
  openRouterConfigured: boolean;
  openRouterModel: string;
  telegramConfigured?: boolean;
}

export interface ChannelConfig {
  id: string;
  name: string;
  nativeName: string;
  language: LanguageCode;
  rssUrl: string;
  siteUrl: string;
  focus: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface AnalysisItem {
  id: string;
  originalTitle: string;
  uyghurTitle?: string;
  originalExcerpt: string;
  uyghurExcerpt?: string;
  uyghurFullParagraphs?: string[];
  isFullTranslated?: boolean;
  summaryParagraphs?: string[];
  keyTakeaways?: string[];
  topic?: string;
  topicId?: GeopoliticalTopicId;
  notes?: string;
  sourceName: string;
  sourceSiteUrl: string;
  articleUrl: string;
  language: LanguageCode;
  publishedAt: string;
  collectedAt: string;
  bookmarked: boolean;
  isManual?: boolean;
}

export interface FetchFeedsResult {
  items: Omit<AnalysisItem, 'id' | 'bookmarked' | 'collectedAt'>[];
  succeededChannels: number;
  failedChannels: { name: string; reason: string }[];
  filteredOutCount: number;
  fetchedAt: string;
}

export interface SummarizeResult {
  uyghurTitle: string;
  summaryParagraphs: string[];
  keyTakeaways: string[];
  topic: string;
  engineUsed?: 'gemini' | 'openrouter';
}

export interface TranslateBatchItemResult {
  articleUrl: string;
  uyghurTitle: string;
  uyghurExcerpt: string;
  uyghurFullParagraphs?: string[];
  isFullTranslated?: boolean;
}

export interface FullTranslateResult {
  uyghurTitle: string;
  uyghurFullParagraphs: string[];
  uyghurExcerpt: string;
  engineUsed?: 'gemini' | 'openrouter';
}
