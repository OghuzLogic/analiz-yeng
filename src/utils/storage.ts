import { AnalysisItem, AppSettings, ChannelConfig, GlossaryRule } from '../types';
import { DEFAULT_CHANNELS } from '../data/channels';
import { GEOPOLITICAL_TOPICS } from './topicFilter';

const DB_NAME = 'analizlar_local_vault';
const DB_VERSION = 1;
const STORE_ANALYSES = 'analyses';
const STORE_CHANNELS = 'channels';
const SETTINGS_KEY = 'analizlar_settings_v1';
const OPENROUTER_KEY_STORAGE = 'analizlar_openrouter_key_v1';
const GLOSSARY_RULES_KEY = 'analizlar_glossary_rules_v1';

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

export const DEFAULT_SETTINGS: AppSettings = {
  autoTranslateToUyghur: true,
  autoDailyRefresh: true,
  refreshIntervalHours: 6,
  strictGeopoliticalFilter: true,
  enabledTopics: GEOPOLITICAL_TOPICS.map((t) => t.id),
  preferredEngine: 'auto',
  openRouterModel: DEFAULT_OPENROUTER_MODEL,
};

export function loadOpenRouterKey(): string {
  try {
    return (localStorage.getItem(OPENROUTER_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function saveOpenRouterKey(key: string): void {
  const cleaned = key.trim();
  if (!cleaned) {
    localStorage.removeItem(OPENROUTER_KEY_STORAGE);
    return;
  }
  localStorage.setItem(OPENROUTER_KEY_STORAGE, cleaned);
}

export function clearOpenRouterKey(): void {
  localStorage.removeItem(OPENROUTER_KEY_STORAGE);
}

export function loadCustomGlossaryRules(): GlossaryRule[] {
  try {
    const raw = localStorage.getItem(GLOSSARY_RULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is GlossaryRule =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as GlossaryRule).id === 'string' &&
          typeof (item as GlossaryRule).wrong === 'string' &&
          (item as GlossaryRule).wrong.trim().length > 0 &&
          typeof (item as GlossaryRule).correct === 'string'
      )
      .map((item) => ({
        id: item.id,
        wrong: item.wrong.trim(),
        correct: item.correct.trim(),
        note: typeof item.note === 'string' ? item.note.trim() : undefined,
        enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
      }));
  } catch {
    return [];
  }
}

export function saveCustomGlossaryRules(rules: GlossaryRule[]): void {
  localStorage.setItem(GLOSSARY_RULES_KEY, JSON.stringify(rules));
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      autoTranslateToUyghur:
        typeof parsed.autoTranslateToUyghur === 'boolean'
          ? parsed.autoTranslateToUyghur
          : DEFAULT_SETTINGS.autoTranslateToUyghur,
      autoDailyRefresh:
        typeof parsed.autoDailyRefresh === 'boolean'
          ? parsed.autoDailyRefresh
          : DEFAULT_SETTINGS.autoDailyRefresh,
      refreshIntervalHours:
        typeof parsed.refreshIntervalHours === 'number' && parsed.refreshIntervalHours >= 1
          ? parsed.refreshIntervalHours
          : DEFAULT_SETTINGS.refreshIntervalHours,
      strictGeopoliticalFilter:
        typeof parsed.strictGeopoliticalFilter === 'boolean'
          ? parsed.strictGeopoliticalFilter
          : DEFAULT_SETTINGS.strictGeopoliticalFilter,
      enabledTopics:
        Array.isArray(parsed.enabledTopics) && parsed.enabledTopics.length > 0
          ? parsed.enabledTopics
          : DEFAULT_SETTINGS.enabledTopics,
      preferredEngine:
        parsed.preferredEngine === 'gemini' ||
        parsed.preferredEngine === 'openrouter' ||
        parsed.preferredEngine === 'auto'
          ? parsed.preferredEngine
          : 'auto',
      openRouterModel:
        typeof parsed.openRouterModel === 'string' && parsed.openRouterModel.trim()
          ? parsed.openRouterModel.trim()
          : DEFAULT_OPENROUTER_MODEL,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 100% يەرلىك ساقلاش سىستېمىسى (IndexedDB).
 * ھېچقانداق شەخسىي مەلۇمات سىرتقى مۇلازىمېتىرغا ئەۋەتىلمەيدۇ.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ANALYSES)) {
        const store = db.createObjectStore(STORE_ANALYSES, { keyPath: 'id' });
        store.createIndex('publishedAt', 'publishedAt', { unique: false });
        store.createIndex('articleUrl', 'articleUrl', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CHANNELS)) {
        db.createObjectStore(STORE_CHANNELS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllAnalyses(): Promise<AnalysisItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSES, 'readonly');
    const req = tx.objectStore(STORE_ANALYSES).getAll();
    req.onsuccess = () => {
      const items = (req.result as AnalysisItem[]).sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAnalysis(item: AnalysisItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSES, 'readwrite');
    tx.objectStore(STORE_ANALYSES).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveManyAnalyses(items: AnalysisItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSES, 'readwrite');
    const store = tx.objectStore(STORE_ANALYSES);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function mergeFetchedAnalyses(
  fetched: Omit<AnalysisItem, 'id' | 'bookmarked' | 'collectedAt'>[]
): Promise<{ addedCount: number; addedItems: AnalysisItem[]; allItems: AnalysisItem[] }> {
  const existing = await getAllAnalyses();
  const existingUrls = new Set(existing.map((i) => i.articleUrl.trim().toLowerCase()));
  const nowIso = new Date().toISOString();
  const newItems: AnalysisItem[] = [];

  for (const raw of fetched) {
    const normalizedUrl = raw.articleUrl.trim().toLowerCase();
    if (!normalizedUrl || existingUrls.has(normalizedUrl)) {
      continue;
    }
    existingUrls.add(normalizedUrl);
    newItems.push({
      ...raw,
      id: `anl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      bookmarked: false,
      collectedAt: nowIso,
    });
  }

  if (newItems.length > 0) {
    await saveManyAnalyses(newItems);
  }

  const allItems = await getAllAnalyses();
  return { addedCount: newItems.length, addedItems: newItems, allItems };
}

export async function deleteAnalysisById(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYSES, 'readwrite');
    tx.objectStore(STORE_ANALYSES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllChannels(): Promise<ChannelConfig[]> {
  const db = await openDatabase();
  const stored = await new Promise<ChannelConfig[]>((resolve, reject) => {
    const tx = db.transaction(STORE_CHANNELS, 'readonly');
    const req = tx.objectStore(STORE_CHANNELS).getAll();
    req.onsuccess = () => resolve(req.result as ChannelConfig[]);
    req.onerror = () => reject(req.error);
  });

  if (stored.length === 0) {
    await saveChannels(DEFAULT_CHANNELS);
    return DEFAULT_CHANNELS;
  }

  // يېڭى قوشۇلغان سۈكۈتتىكى قاناللارنى يوقىتىۋەتمەي سىنكرونلاش
  const storedIds = new Set(stored.map((c) => c.id));
  const missingDefaults = DEFAULT_CHANNELS.filter((c) => !storedIds.has(c.id));
  if (missingDefaults.length > 0) {
    await saveChannels(missingDefaults);
    return [...stored, ...missingDefaults];
  }
  return stored;
}

export async function saveChannels(channels: ChannelConfig[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHANNELS, 'readwrite');
    const store = tx.objectStore(STORE_CHANNELS);
    for (const ch of channels) {
      store.put(ch);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteChannelById(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHANNELS, 'readwrite');
    tx.objectStore(STORE_CHANNELS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function buildChromeManifestV3Json(): string {
  const manifest = {
    manifest_version: 3,
    name: 'ئانالىزلار',
    version: '1.1.0',
    description:
      'خەلقئارادىكى نوپۇزلۇق ئەرەبچە، ئىنگلىزچە ۋە تۈركچە ئانالىز قاناللىرىدىن 8 گېئوسىياسىي تېما بويىچە كۈندىلىك يېڭى ئانالىزلارنى يىغىش، ئۇيغۇرچىغا تەرجىمە قىلىش ۋە خۇلاسىلەش قىستۇرمىسى.',
    permissions: ['storage', 'alarms'],
    host_permissions: [
      'https://www.aljazeera.net/*',
      'https://www.alaraby.co.uk/*',
      'https://arabi21.com/*',
      'https://www.noonpost.com/*',
      'https://www.middleeasteye.net/*',
      'https://feeds.bbci.co.uk/*',
      'https://www.theguardian.com/*',
      'https://www.brookings.edu/*',
      'https://www.aa.com.tr/*',
      'https://www.trthaber.com/*',
      'https://www.setav.org/*',
      'https://www.indyturk.com/*',
    ],
    action: {
      default_title: 'ئانالىزلار',
      default_popup: 'index.html',
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  };
  return JSON.stringify(manifest, null, 2);
}
