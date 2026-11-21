import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  BookOpenCheck,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import {
  AnalysisItem,
  AppSettings,
  ChannelConfig,
  FetchFeedsResult,
  FullTranslateResult,
  GlossaryRule,
  LanguageCode,
  ServerEngineStatus,
  SummarizeResult,
  TranslateBatchItemResult,
} from './types';
import {
  deleteAnalysisById,
  deleteChannelById,
  getAllAnalyses,
  getAllChannels,
  loadAppSettings,
  loadCustomGlossaryRules,
  loadOpenRouterKey,
  mergeFetchedAnalyses,
  saveAnalysis,
  saveAppSettings,
  saveChannels,
  saveCustomGlossaryRules,
  saveManyAnalyses,
  saveOpenRouterKey,
} from './utils/storage';
import {
  applyGlossaryToAnalysis,
  formatUyghurDate,
  shouldRunDailyRefresh,
} from './utils/terminology';
import { GEOPOLITICAL_TOPICS, GeopoliticalTopicId, matchGeopoliticalTopic } from './utils/topicFilter';
import { ActiveSection, Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PrinciplesBanner } from './components/PrinciplesBanner';
import { AnalysisCard } from './components/AnalysisCard';
import { AnalysisModal } from './components/AnalysisModal';
import { ReaderDrawer } from './components/ReaderDrawer';
import { ChannelsSection } from './components/ChannelsSection';
import { SettingsModal } from './components/SettingsModal';
import { GlossaryModal } from './components/GlossaryModal';

type FilterTab = 'all' | LanguageCode | 'bookmarks' | 'summarized';
type TopicFilter = 'all' | GeopoliticalTopicId;

const LAST_FETCH_ISO_KEY = 'analizlar_last_fetched_iso';

export default function App() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => loadOpenRouterKey());
  const [customGlossaryRules, setCustomGlossaryRules] = useState<GlossaryRule[]>(() =>
    loadCustomGlossaryRules()
  );
  const [lastGlossaryAppliedCount, setLastGlossaryAppliedCount] = useState<number | null>(null);
  const [engineStatus, setEngineStatus] = useState<ServerEngineStatus | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedIso, setLastFetchedIso] = useState<string | null>(() =>
    localStorage.getItem(LAST_FETCH_ISO_KEY)
  );

  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [summarizingIds, setSummarizingIds] = useState<Record<string, boolean>>({});
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});
  const [sendingTelegramIds, setSendingTelegramIds] = useState<Record<string, boolean>>({});
  const [telegramSentIds, setTelegramSentIds] = useState<Record<string, boolean>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnalysisItem | null>(null);
  const [readerItemId, setReaderItemId] = useState<string | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const openRouterKeyRef = useRef(openRouterKey);
  openRouterKeyRef.current = openRouterKey;
  const glossaryRulesRef = useRef(customGlossaryRules);
  glossaryRulesRef.current = customGlossaryRules;
  const analysesRef = useRef(analyses);
  analysesRef.current = analyses;

  const buildAiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const key = openRouterKeyRef.current.trim();
    if (key) {
      headers['X-OpenRouter-Key'] = key;
    }
    const model = settingsRef.current.openRouterModel?.trim();
    if (model) {
      headers['X-OpenRouter-Model'] = model;
    }
    return headers;
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('analizlar_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('analizlar_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    fetch('/api/config/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ServerEngineStatus | null) => {
        if (data) setEngineStatus(data);
      })
      .catch(() => {});
  }, []);

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    saveAppSettings(next);
  };

  const handleSaveOpenRouterKey = (nextKey: string) => {
    const cleaned = nextKey.trim();
    setOpenRouterKey(cleaned);
    saveOpenRouterKey(cleaned);
  };

  /**
   * بارلىق يەرلىكتە ساقلانغان ئانالىزلارغا 15 مۇقىم قائىدە + خاس لوغەت قائىدىلىرىنى
   * شۇ ھامان تەتبىقلاپ ئېكران ۋە IndexedDB نى دەرھال يېڭىلايدۇ.
   */
  const applyGlossaryRulesToAllAnalyses = useCallback(async (rules: GlossaryRule[]): Promise<number> => {
    const current = analysesRef.current;
    const toPersist: AnalysisItem[] = [];
    const nextList = current.map((item) => {
      const { updated, changed } = applyGlossaryToAnalysis(item, rules);
      if (changed) {
        toPersist.push(updated);
      }
      return updated;
    });

    if (toPersist.length > 0) {
      await saveManyAnalyses(toPersist);
      setAnalyses(nextList);
    }
    setLastGlossaryAppliedCount(toPersist.length);
    return toPersist.length;
  }, []);

  const handleSaveGlossaryRules = useCallback(
    async (nextRules: GlossaryRule[]): Promise<number> => {
      setCustomGlossaryRules(nextRules);
      glossaryRulesRef.current = nextRules;
      saveCustomGlossaryRules(nextRules);
      return applyGlossaryRulesToAllAnalyses(nextRules);
    },
    [applyGlossaryRulesToAllAnalyses]
  );

  const handleReapplyGlossaryAll = useCallback(async (): Promise<number> => {
    return applyGlossaryRulesToAllAnalyses(glossaryRulesRef.current);
  }, [applyGlossaryRulesToAllAnalyses]);

  /**
   * بارلىق تولۇق تەرجىمە قىلىنمىغان ئانالىزلارنى 3 تىن تەرتىپلىك ھالدا
   * باشتىن-ئاخىر پۈتۈن ئۇيغۇرچىگە تەرجىمە قىلىدۇ.
   */
  const translateItemsBatch = useCallback(
    async (targets: AnalysisItem[], preferredEngine = settingsRef.current.preferredEngine) => {
      const needFull = targets.filter(
        (i) => !i.isFullTranslated || !i.uyghurTitle || !(i.uyghurFullParagraphs?.length)
      );
      if (needFull.length === 0) return;

      setIsBatchTranslating(true);
      setTranslationProgress({ done: 0, total: needFull.length });

      try {
        const chunkSize = 3;
        let completed = 0;

        for (let idx = 0; idx < needFull.length; idx += chunkSize) {
          const chunk = needFull.slice(idx, idx + chunkSize);
          const res = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: buildAiHeaders(),
            body: JSON.stringify({
              items: chunk.map((c) => ({
                articleUrl: c.articleUrl,
                originalTitle: c.originalTitle,
                originalExcerpt: c.originalExcerpt,
                language: c.language,
              })),
              preferredEngine,
              customGlossaryRules: glossaryRulesRef.current,
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as { translations?: TranslateBatchItemResult[] };
            const list = data.translations || [];
            const byUrl = new Map(list.map((t) => [t.articleUrl, t]));
            const updatedMap = new Map<string, AnalysisItem>();
            const toPersist: AnalysisItem[] = [];

            for (const item of chunk) {
              const tr = byUrl.get(item.articleUrl);
              if (tr && tr.uyghurTitle) {
                const merged: AnalysisItem = {
                  ...item,
                  uyghurTitle: tr.uyghurTitle,
                  uyghurExcerpt: tr.uyghurExcerpt || item.uyghurExcerpt,
                  uyghurFullParagraphs:
                    tr.uyghurFullParagraphs && tr.uyghurFullParagraphs.length > 0
                      ? tr.uyghurFullParagraphs
                      : item.uyghurFullParagraphs,
                  isFullTranslated: Boolean(
                    tr.isFullTranslated &&
                      tr.uyghurFullParagraphs &&
                      tr.uyghurFullParagraphs.length > 0
                  ),
                };
                updatedMap.set(merged.id, merged);
                toPersist.push(merged);
              }
            }

            if (toPersist.length > 0) {
              await saveManyAnalyses(toPersist);
              setAnalyses((prev) =>
                prev.map((existing) => updatedMap.get(existing.id) || existing)
              );
            }
          }

          completed = Math.min(needFull.length, idx + chunk.length);
          setTranslationProgress({ done: completed, total: needFull.length });
        }
      } catch {
        // ئايرىم تۈرلەرنى قايتا تەرجىمە قىلىشقا بولىدۇ
      } finally {
        setIsBatchTranslating(false);
        setTranslationProgress(null);
      }
    },
    [buildAiHeaders]
  );

  const fetchDailyAnalyses = useCallback(
    async (channelList: ChannelConfig[], currentSettings = settingsRef.current) => {
      const active = channelList.filter((c) => c.enabled);
      if (active.length === 0) {
        setFetchError('ئاز دېگەندە بىر ئانالىز قانىلىنى ئاكتىپلاڭ.');
        return;
      }

      setIsFetching(true);
      setFetchError(null);
      setFetchNotice(null);

      try {
        const response = await fetch('/api/feeds/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channels: active,
            strictGeopoliticalFilter: currentSettings.strictGeopoliticalFilter,
            enabledTopics: currentSettings.enabledTopics,
          }),
        });

        const data = (await response.json()) as FetchFeedsResult & { error?: string };
        if (!response.ok) {
          throw new Error(data.error || 'قاناللاردىن مەلۇمات ئېلىش مەغلۇپ بولدى.');
        }

        const { addedCount, addedItems, allItems } = await mergeFetchedAnalyses(data.items || []);
        setAnalyses(allItems);

        const fetchedIso = data.fetchedAt || new Date().toISOString();
        setLastFetchedIso(fetchedIso);
        localStorage.setItem(LAST_FETCH_ISO_KEY, fetchedIso);

        const filteredText =
          data.filteredOutCount > 0
            ? ` (${data.filteredOutCount} پارچە ئىجتىمائىي ۋە غەيرىي سىياسىي ماقالە چىقىرىۋېتىلدى)`
            : '';

        if (addedCount > 0) {
          setFetchNotice(
            `${data.succeededChannels} نوپۇزلۇق قانالدىن ${addedCount} پارچە يېڭى گېئوسىياسىي ئانالىز يىغىلدى${filteredText}.`
          );
        } else {
          setFetchNotice(
            `${data.succeededChannels} قانال تەكشۈرۈلدى؛ بارلىق ئەڭ يېڭى ئانالىزلار ئاللىقاچان ئارخىپىڭىزدا بار${filteredText}.`
          );
        }

        // يىغىلغان بارلىق ئانالىزلارنى پۈتۈنلەي ئۇيغۇرچىگە تەرجىمە قىلىش
        if (currentSettings.autoTranslateToUyghur) {
          const pending =
            addedItems.length > 0
              ? addedItems
              : allItems.filter(
                  (i) => !i.isFullTranslated || !i.uyghurTitle || !(i.uyghurFullParagraphs?.length)
                );
          if (pending.length > 0) {
            await translateItemsBatch(pending, currentSettings.preferredEngine);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'تور ئۇلىنىشىدا خاتالىق كۆرۈلدى.';
        setFetchError(message);
      } finally {
        setIsFetching(false);
      }
    },
    [translateItemsBatch]
  );

  useEffect(() => {
    let cancelled = false;
    async function hydrateLocalData() {
      try {
        const [storedChannels, storedAnalyses] = await Promise.all([
          getAllChannels(),
          getAllAnalyses(),
        ]);
        if (cancelled) return;

        let cleanedAnalyses = storedAnalyses;
        if (settingsRef.current.strictGeopoliticalFilter && storedAnalyses.length > 0) {
          const validList: AnalysisItem[] = [];
          for (const item of storedAnalyses) {
            if (item.isManual || item.bookmarked) {
              validList.push(item);
              continue;
            }
            const match = matchGeopoliticalTopic(
              item.originalTitle,
              item.originalExcerpt,
              item.articleUrl,
              settingsRef.current.enabledTopics
            );
            if (match.matched) {
              const withTopic =
                !item.topicId && match.topicId
                  ? { ...item, topicId: match.topicId, topic: item.topic || match.topicLabel }
                  : item;
              validList.push(withTopic);
            } else {
              await deleteAnalysisById(item.id);
            }
          }
          cleanedAnalyses = validList;
        }

        // يەرلىكتىكى بارلىق ئانالىزلارغا 15 مۇقىم ئىملا قائىدىسى + خاس لوغەتنى دەرھال تەتبىقلاش
        const correctedToPersist: AnalysisItem[] = [];
        const normalizedAnalyses = cleanedAnalyses.map((item) => {
          const { updated, changed } = applyGlossaryToAnalysis(item, glossaryRulesRef.current);
          if (changed) {
            correctedToPersist.push(updated);
          }
          return updated;
        });
        if (correctedToPersist.length > 0) {
          await saveManyAnalyses(correctedToPersist);
        }

        setChannels(storedChannels);
        setAnalyses(normalizedAnalyses);
        setIsInitializing(false);

        const savedIso = localStorage.getItem(LAST_FETCH_ISO_KEY);
        const needsRefresh =
          normalizedAnalyses.length === 0 ||
          (settingsRef.current.autoDailyRefresh &&
            shouldRunDailyRefresh(savedIso, settingsRef.current.refreshIntervalHours));

        if (needsRefresh) {
          await fetchDailyAnalyses(storedChannels, settingsRef.current);
        } else if (settingsRef.current.autoTranslateToUyghur) {
          const pending = normalizedAnalyses.filter(
            (i) => !i.isFullTranslated || !i.uyghurTitle || !(i.uyghurFullParagraphs?.length)
          );
          if (pending.length > 0) {
            await translateItemsBatch(pending, settingsRef.current.preferredEngine);
          }
        }
      } catch {
        if (!cancelled) {
          setIsInitializing(false);
          setFetchError('يەرلىك ساقلاش ئامبىرىنى ئېچىشتا خاتالىق كۆرۈلدى.');
        }
      }
    }
    hydrateLocalData();
    return () => {
      cancelled = true;
    };
  }, [fetchDailyAnalyses, translateItemsBatch]);

  useEffect(() => {
    if (!settings.autoDailyRefresh || channels.length === 0) return;
    const timer = window.setInterval(() => {
      const savedIso = localStorage.getItem(LAST_FETCH_ISO_KEY);
      if (shouldRunDailyRefresh(savedIso, settingsRef.current.refreshIntervalHours)) {
        fetchDailyAnalyses(channels, settingsRef.current);
      }
    }, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [settings.autoDailyRefresh, channels, fetchDailyAnalyses]);

  const translateFullSingle = useCallback(
    async (item: AnalysisItem): Promise<AnalysisItem> => {
      setTranslatingIds((prev) => ({ ...prev, [item.id]: true }));
      setActionErrors((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      try {
        const res = await fetch('/api/translate-full', {
          method: 'POST',
          headers: buildAiHeaders(),
          body: JSON.stringify({
            originalTitle: item.originalTitle,
            originalExcerpt: item.originalExcerpt,
            articleUrl: item.articleUrl,
            language: item.language,
            preferredEngine: settingsRef.current.preferredEngine,
            customGlossaryRules: glossaryRulesRef.current,
          }),
        });
        const data = (await res.json()) as FullTranslateResult & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'پۈتۈن تەرجىمە مەغلۇپ بولدى.');
        }
        const updated: AnalysisItem = {
          ...item,
          uyghurTitle: data.uyghurTitle || item.uyghurTitle,
          uyghurExcerpt: data.uyghurExcerpt || item.uyghurExcerpt,
          uyghurFullParagraphs: data.uyghurFullParagraphs,
          isFullTranslated: true,
        };
        await saveAnalysis(updated);
        setAnalyses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'تەرجىمە خاتالىقى.';
        setActionErrors((prev) => ({ ...prev, [item.id]: message }));
        throw err;
      } finally {
        setTranslatingIds((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [buildAiHeaders]
  );

  const handleTranslateFull = async (item: AnalysisItem) => {
    try {
      await translateFullSingle(item);
    } catch {
      // خاتالىق actionErrors دا كۆرسىتىلدى
    }
  };

  const handleSendTelegram = async (item: AnalysisItem) => {
    setSendingTelegramIds((prev) => ({ ...prev, [item.id]: true }));
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    try {
      let readyItem = item;
      // تېلېگراممىغا يوللاشتىن بۇرۇن ئەگەر تولۇق ئۇيغۇرچە تەرجىمە قىلىنمىغان بولسا دەرھال پۈتۈن تەرجىمە قىلىش
      const hasReadyUyghur =
        Boolean(readyItem.summaryParagraphs && readyItem.summaryParagraphs.length > 0) ||
        Boolean(
          readyItem.isFullTranslated &&
            readyItem.uyghurTitle &&
            readyItem.uyghurFullParagraphs &&
            readyItem.uyghurFullParagraphs.length > 0
        );

      if (!hasReadyUyghur) {
        readyItem = await translateFullSingle(readyItem);
      }

      const title = readyItem.uyghurTitle || readyItem.originalTitle;
      const paragraphs =
        readyItem.summaryParagraphs && readyItem.summaryParagraphs.length > 0
          ? readyItem.summaryParagraphs
          : readyItem.uyghurFullParagraphs && readyItem.uyghurFullParagraphs.length > 0
            ? readyItem.uyghurFullParagraphs
            : [readyItem.uyghurExcerpt || readyItem.originalExcerpt];

      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          paragraphs,
          keyTakeaways: readyItem.keyTakeaways,
          topic: readyItem.topic,
          sourceName: readyItem.sourceName,
          articleUrl: readyItem.articleUrl,
          publishedAt: readyItem.publishedAt,
          customGlossaryRules: glossaryRulesRef.current,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'تېلېگراممىغا يوللاش مەغلۇپ بولدى.');
      }

      setTelegramSentIds((prev) => ({ ...prev, [item.id]: true }));
      window.setTimeout(() => {
        setTelegramSentIds((prev) => ({ ...prev, [item.id]: false }));
      }, 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تېلېگراممىغا يوللاشتا خاتالىق كۆرۈلدى.';
      setActionErrors((prev) => ({ ...prev, [item.id]: message }));
    } finally {
      setSendingTelegramIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleSummarize = async (item: AnalysisItem) => {
    setSummarizingIds((prev) => ({ ...prev, [item.id]: true }));
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: buildAiHeaders(),
        body: JSON.stringify({
          originalTitle: item.originalTitle,
          originalExcerpt: item.originalExcerpt,
          sourceName: item.sourceName,
          articleUrl: item.articleUrl,
          language: item.language,
          preferredEngine: settings.preferredEngine,
          customGlossaryRules: glossaryRulesRef.current,
        }),
      });

      const data = (await response.json()) as SummarizeResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'خۇلاسە ھاسىل قىلىنمىدى.');
      }

      const updated: AnalysisItem = {
        ...item,
        uyghurTitle: data.uyghurTitle || item.uyghurTitle,
        summaryParagraphs: data.summaryParagraphs,
        keyTakeaways: data.keyTakeaways,
        topic: item.topic || data.topic,
      };

      await saveAnalysis(updated);
      setAnalyses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'نامەلۇم خاتالىق يۈز بەردى.';
      setActionErrors((prev) => ({ ...prev, [item.id]: message }));
    } finally {
      setSummarizingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleSaveAnalysis = async (saved: AnalysisItem) => {
    await saveAnalysis(saved);
    setAnalyses((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      const next = exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev];
      return next.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  };

  const handleDeleteAnalysis = async (id: string) => {
    await deleteAnalysisById(id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (readerItemId === id) {
      setReaderItemId(null);
    }
  };

  const handleToggleBookmark = async (item: AnalysisItem) => {
    const updated: AnalysisItem = { ...item, bookmarked: !item.bookmarked };
    await saveAnalysis(updated);
    setAnalyses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleToggleChannel = async (id: string) => {
    const updated = channels.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setChannels(updated);
    await saveChannels(updated);
  };

  const handleAddChannel = async (channel: ChannelConfig) => {
    const updated = [...channels, channel];
    setChannels(updated);
    await saveChannels(updated);
  };

  const handleDeleteChannel = async (id: string) => {
    await deleteChannelById(id);
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImportAnalyses = async (imported: AnalysisItem[]) => {
    for (const item of imported) {
      if (item && item.id && item.originalTitle && item.articleUrl) {
        await saveAnalysis(item);
      }
    }
    const refreshed = await getAllAnalyses();
    setAnalyses(refreshed);
  };

  const handleNavigate = (section: ActiveSection) => {
    setActiveSection(section);
    if (section === 'bookmarks') {
      setFilterTab('bookmarks');
      document.getElementById('analyses')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (section === 'analyses' && filterTab === 'bookmarks') {
      setFilterTab('all');
    }
    const targetId = section === 'home' ? 'home' : section;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const counts = useMemo(() => {
    return {
      all: analyses.length,
      ar: analyses.filter((a) => a.language === 'ar').length,
      en: analyses.filter((a) => a.language === 'en').length,
      tr: analyses.filter((a) => a.language === 'tr').length,
      bookmarks: analyses.filter((a) => a.bookmarked).length,
      summarized: analyses.filter((a) => a.summaryParagraphs && a.summaryParagraphs.length > 0)
        .length,
      translated: analyses.filter((a) => Boolean(a.isFullTranslated && a.uyghurTitle)).length,
      untranslated: analyses.filter(
        (a) => !a.isFullTranslated || !a.uyghurTitle || !(a.uyghurFullParagraphs?.length)
      ).length,
    };
  }, [analyses]);

  const topicCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const topic of GEOPOLITICAL_TOPICS) {
      map[topic.id] = analyses.filter((a) => a.topicId === topic.id).length;
    }
    return map;
  }, [analyses]);

  const filteredAnalyses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return analyses.filter((item) => {
      if (filterTab === 'ar' && item.language !== 'ar') return false;
      if (filterTab === 'en' && item.language !== 'en') return false;
      if (filterTab === 'tr' && item.language !== 'tr') return false;
      if (filterTab === 'bookmarks' && !item.bookmarked) return false;
      if (
        filterTab === 'summarized' &&
        !(item.summaryParagraphs && item.summaryParagraphs.length > 0)
      ) {
        return false;
      }

      if (topicFilter !== 'all' && item.topicId !== topicFilter) return false;

      if (!q) return true;
      const haystack = [
        item.uyghurTitle,
        item.uyghurExcerpt,
        ...(item.uyghurFullParagraphs || []),
        item.originalTitle,
        item.originalExcerpt,
        item.sourceName,
        item.topic,
        item.notes,
        ...(item.summaryParagraphs || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [analyses, filterTab, topicFilter, searchQuery]);

  const activeReaderItem = useMemo(
    () => (readerItemId ? analyses.find((a) => a.id === readerItemId) || null : null),
    [analyses, readerItemId]
  );

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'ھەممىسى', count: counts.all },
    { id: 'ar', label: 'ئەرەبچە', count: counts.ar },
    { id: 'en', label: 'ئىنگلىزچە', count: counts.en },
    { id: 'tr', label: 'تۈركچە', count: counts.tr },
    { id: 'summarized', label: 'خۇلاسىلەنگەن', count: counts.summarized },
    { id: 'bookmarks', label: 'ساقلانغان', count: counts.bookmarks },
  ];

  const formattedLastFetched = lastFetchedIso ? formatUyghurDate(lastFetchedIso) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onFetchDaily={() => fetchDailyAnalyses(channels)}
        isFetching={isFetching || isBatchTranslating}
      />

      <main className="flex-1">
        <HeroSection
          totalCount={analyses.length}
          translatedCount={counts.translated}
          activeChannelCount={channels.filter((c) => c.enabled).length}
          lastFetchedAt={formattedLastFetched}
          autoDailyRefresh={settings.autoDailyRefresh}
          isFetching={isFetching}
          isTranslating={isBatchTranslating}
          isDark={isDark}
          customGlossaryCount={customGlossaryRules.filter((r) => r.enabled).length}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onFetchDaily={() => fetchDailyAnalyses(channels)}
          onOpenAddModal={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
        />

        <PrinciplesBanner onJumpToChannels={() => handleNavigate('channels')} />

        {/* Analyses Feed & Workspace Section */}
        <section id="analyses" className="py-12 md:py-14 border-t border-[var(--border-subtle)]">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div>
                <span className="editorial-eyebrow editorial-eyebrow-start mb-2">
                  كۈندىلىك گېئوسىياسىي تەھلىللەر
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  يىغىلغان <span className="text-[var(--accent-primary)]">ئانالىزلار</span>
                </h2>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[var(--text-secondary)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ماۋزۇ، مەنبە ياكى تېما ئىزدەش..."
                  className="w-full pr-11 pl-4 py-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* 8 Geopolitical Topic Filter Bar */}
            <div className="mb-5">
              <div className="text-xs font-bold text-[var(--text-secondary)] mb-2.5">
                8 مەركىزىي تېما بويىچە تاللاش:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTopicFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    topicFilter === 'all'
                      ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  بارلىق 8 تېما ({analyses.length})
                </button>
                {GEOPOLITICAL_TOPICS.map((topic) => {
                  const active = topicFilter === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setTopicFilter(topic.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="tabular-nums ml-1">{topic.order}.</span>
                      <span>{topic.shortLabel}</span>
                      <span className="mr-1.5 opacity-75 tabular-nums">
                        ({topicCounts[topic.id] || 0})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Filter Tabs & Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
              <div
                role="tablist"
                aria-label="تىل ۋە تۈر بويىچە سۈزۈش"
                className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
              >
                {filterTabs.map((tab) => {
                  const active = filterTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilterTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-xs opacity-75 tabular-nums">{tab.count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {counts.untranslated > 0 && (
                  <button
                    type="button"
                    disabled={isBatchTranslating}
                    onClick={() => translateItemsBatch(analyses)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isBatchTranslating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4" />
                    )}
                    <span>
                      {isBatchTranslating && translationProgress
                        ? `پۈتۈن تەرجىمە قىلىۋاتىدۇ (${translationProgress.done}/${translationProgress.total})...`
                        : `ھەممىسىنى پۈتۈن تەرجىمە قىلىش (${counts.untranslated})`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsGlossaryOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpenCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>لوغەت ۋە ئىملا</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Settings className="w-4 h-4" />
                  <span>تەڭشەك</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>يېڭى ئانالىز</span>
                </button>
              </div>
            </div>

            {/* Translation Progress Banner */}
            {isBatchTranslating && (
              <div className="mb-6 px-5 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent-primary)]/40 text-sm text-[var(--text-primary)] flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)] shrink-0" />
                <span>
                  ئانالىزلارنىڭ ماۋزۇسى ۋە پۈتۈن تېكىستى ئۇيغۇرچىگە تولۇق تەرجىمە قىلىنىۋاتىدۇ
                  {translationProgress
                    ? ` (${translationProgress.done} / ${translationProgress.total})`
                    : '...'}
                </span>
              </div>
            )}

            {/* Feedback Banners */}
            {fetchNotice && (
              <div className="mb-6 px-5 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] flex items-center justify-between gap-4">
                <span>{fetchNotice}</span>
                <button
                  type="button"
                  onClick={() => setFetchNotice(null)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  تاقاش
                </button>
              </div>
            )}

            {fetchError && (
              <div
                role="alert"
                className="mb-6 px-5 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/70 text-sm text-red-700 dark:text-red-300 flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Loading / Empty / Feed Grid */}
            {isInitializing || (isFetching && analyses.length === 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="editorial-card rounded-[24px] p-7 animate-pulse space-y-4"
                  >
                    <div className="h-3.5 w-1/3 bg-[var(--bg-elevated)] rounded" />
                    <div className="h-6 w-4/5 bg-[var(--bg-elevated)] rounded" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-full bg-[var(--bg-elevated)] rounded" />
                      <div className="h-3.5 w-5/6 bg-[var(--bg-elevated)] rounded" />
                      <div className="h-3.5 w-2/3 bg-[var(--bg-elevated)] rounded" />
                    </div>
                    <div className="h-9 w-2/3 bg-[var(--bg-elevated)] rounded-full pt-2" />
                  </div>
                ))}
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="editorial-card rounded-[28px] p-10 sm:p-12 text-center max-w-2xl mx-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                  {analyses.length === 0
                    ? 'ھازىرچە يىغىلغان ئانالىز يوق'
                    : 'بۇ تېما ياكى سۈزگۈچتە ئانالىز تېپىلمىدى'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                  {analyses.length === 0
                    ? '«كۈندىلىك يىغىش» كۇنۇپكىسىنى بېسىپ 8 گېئوسىياسىي تېما بويىچە بۈگۈنكى ئانالىزلارنى يىغىڭ.'
                    : 'باشقا تېمىنى تاللاڭ ياكى «بارلىق 8 تېما» غا قايتىڭ.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {analyses.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fetchDailyAnalyses(channels)}
                      disabled={isFetching}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                      <span>كۈندىلىك يىغىش</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterTab('all');
                        setTopicFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] cursor-pointer"
                    >
                      بارلىق ئانالىزلارنى كۆرسىتىش
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAnalyses.map((item) => (
                  <AnalysisCard
                    key={item.id}
                    item={item}
                    isSummarizing={Boolean(summarizingIds[item.id])}
                    isTranslating={Boolean(translatingIds[item.id])}
                    isSendingTelegram={Boolean(sendingTelegramIds[item.id])}
                    telegramSentSuccess={Boolean(telegramSentIds[item.id])}
                    actionError={actionErrors[item.id]}
                    onSummarize={handleSummarize}
                    onTranslateFull={handleTranslateFull}
                    onSendTelegram={handleSendTelegram}
                    onEdit={(target) => {
                      setEditingItem(target);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteAnalysis}
                    onToggleBookmark={handleToggleBookmark}
                    onOpenReader={(target) => setReaderItemId(target.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Authoritative Channels & Local Vault Section */}
        <ChannelsSection
          channels={channels}
          analyses={analyses}
          onToggleChannel={handleToggleChannel}
          onAddChannel={handleAddChannel}
          onDeleteChannel={handleDeleteChannel}
          onImportAnalyses={handleImportAnalyses}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-9">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold text-[var(--text-primary)]">
            ئانالىزلار<span className="text-[var(--accent-primary)]">.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('home');
              }}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              باش بەت
            </a>
            <a
              href="#analyses"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('analyses');
              }}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              ئانالىزلار
            </a>
            <a
              href="#channels"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('channels');
              }}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              قاناللار
            </a>
            <button
              type="button"
              onClick={() => setIsGlossaryOpen(true)}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              لوغەت ۋە ئىملا
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              تەڭشەك
            </button>
          </div>

          <div className="text-xs text-[var(--text-secondary)]">
            © 2026 ئانالىزلار · بارلىق مەلۇماتلار يەرلىكتە ساقلىنىدۇ
          </div>
        </div>
      </footer>

      {/* Add / Edit Modal */}
      <AnalysisModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        customGlossaryRules={customGlossaryRules}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveAnalysis}
      />

      {/* Glossary & Orthography Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        customRules={customGlossaryRules}
        lastAppliedCount={lastGlossaryAppliedCount}
        onClose={() => setIsGlossaryOpen(false)}
        onSaveRules={handleSaveGlossaryRules}
        onReapplyAll={handleReapplyGlossaryAll}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        engineStatus={engineStatus}
        openRouterKey={openRouterKey}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onSaveOpenRouterKey={handleSaveOpenRouterKey}
      />

      {/* Full Reader Drawer */}
      <ReaderDrawer
        item={activeReaderItem}
        isSummarizing={Boolean(activeReaderItem && summarizingIds[activeReaderItem.id])}
        isTranslating={Boolean(activeReaderItem && translatingIds[activeReaderItem.id])}
        isSendingTelegram={Boolean(activeReaderItem && sendingTelegramIds[activeReaderItem.id])}
        telegramSentSuccess={Boolean(activeReaderItem && telegramSentIds[activeReaderItem.id])}
        onClose={() => setReaderItemId(null)}
        onSummarize={handleSummarize}
        onTranslateFull={handleTranslateFull}
        onSendTelegram={handleSendTelegram}
        onEdit={(target) => {
          setEditingItem(target);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteAnalysis}
      />
    </div>
  );
}
