import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI, Type } from '@google/genai';
import { buildGlossaryPromptRules, enforceUyghurTerminology } from './src/utils/terminology.ts';
import { matchGeopoliticalTopic, type GeopoliticalTopicId } from './src/utils/topicFilter.ts';
import {
  decodeHtmlEntities,
  extractLink,
  extractTextValue,
  safeIsoDate,
} from './src/utils/feedHelpers.ts';
import {
  formatAnalysisForTelegram,
  splitTelegramMessage,
} from './src/utils/telegramFormat.ts';
import type { AiEnginePreference, ChannelConfig, GlossaryRule, LanguageCode } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY مۇھىت ئۆزگەرگۈچىسى تېپىلمىدى.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveOpenRouterKey(headerKey?: string): string {
  const fromHeader = typeof headerKey === 'string' ? headerKey.trim() : '';
  if (fromHeader) return fromHeader;
  return (process.env.OPENROUTER_API_KEY || '').trim();
}

function shouldUseOpenRouter(preference?: AiEnginePreference, headerKey?: string): boolean {
  const key = resolveOpenRouterKey(headerKey);
  if (!key) return false;
  if (preference === 'gemini') return false;
  return preference === 'openrouter' || preference === 'auto';
}

class OpenRouterApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callOpenRouterJson<T>(
  systemInstruction: string,
  userPrompt: string,
  overrideKey?: string,
  overrideModel?: string,
  maxTokens = 4096
): Promise<T> {
  const apiKey = resolveOpenRouterKey(overrideKey);
  if (!apiKey) {
    throw new OpenRouterApiError(400, 'OpenRouter ئاچقۇچى كىرگۈزۈلمىدى. تەڭشەكتىن ئاچقۇچ سېلىڭ.');
  }
  const model =
    (overrideModel && overrideModel.trim()) ||
    process.env.OPENROUTER_MODEL?.trim() ||
    'google/gemini-2.5-flash';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Analizlar',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 402) {
      throw new OpenRouterApiError(
        402,
        'OpenRouter ھېسابىڭىزدا قالدۇق پۇل (كرېدىت) يېتىشمىدى (402). تەڭشەكتىن ھەقسىز (:free) مودېل ياكى Gemini AI نى تاللاڭ، ياكى OpenRouter ھېسابىڭىزغا پۇل قاچىلاڭ.'
      );
    }
    throw new OpenRouterApiError(
      res.status,
      `OpenRouter خاتالىقى (${res.status}): ${errText.slice(0, 180)}`
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
}

async function fetchSingleFeed(
  channel: ChannelConfig,
  strictGeopoliticalFilter: boolean,
  enabledTopics?: GeopoliticalTopicId[]
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetch(channel.rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AnalizlarReader/1.2; +https://analizlar.local)',
        Accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const xml = await response.text();
    const parsed = xmlParser.parse(xml) as Record<string, unknown>;

    let rawItems: Record<string, unknown>[] = [];
    const rssChannel = (parsed.rss as Record<string, unknown> | undefined)?.channel as
      | Record<string, unknown>
      | undefined;
    if (rssChannel?.item) {
      rawItems = Array.isArray(rssChannel.item)
        ? (rssChannel.item as Record<string, unknown>[])
        : [rssChannel.item as Record<string, unknown>];
    } else if ((parsed.feed as Record<string, unknown> | undefined)?.entry) {
      const entries = (parsed.feed as Record<string, unknown>).entry;
      rawItems = Array.isArray(entries)
        ? (entries as Record<string, unknown>[])
        : [entries as Record<string, unknown>];
    }

    const accepted = [];
    let filteredOut = 0;

    for (const entry of rawItems.slice(0, 28)) {
      if (accepted.length >= 4) break;
      const title = extractTextValue(entry.title);
      const description =
        extractTextValue(entry['content:encoded']) ||
        extractTextValue(entry.description) ||
        extractTextValue(entry.summary) ||
        extractTextValue(entry.content);
      const excerpt =
        description.length > 1200 ? `${description.slice(0, 1200).trim()}…` : description;
      const articleUrl = extractLink(entry, channel.siteUrl);
      const publishedAt = safeIsoDate(
        entry.pubDate || entry.published || entry.updated || entry['dc:date']
      );

      if (!title || !articleUrl) continue;

      const match = matchGeopoliticalTopic(title, excerpt, articleUrl, enabledTopics);
      if (strictGeopoliticalFilter && !match.matched) {
        filteredOut += 1;
        continue;
      }

      accepted.push({
        originalTitle: title,
        originalExcerpt: excerpt || title,
        sourceName: channel.name,
        sourceSiteUrl: channel.siteUrl,
        articleUrl,
        language: channel.language as LanguageCode,
        publishedAt,
        topicId: match.topicId,
        topic: match.topicLabel,
      });
    }

    return { ok: true as const, items: accepted, filteredOut };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ئۇلىنىش خاتالىقى';
    return { ok: false as const, error: message, filteredOut: 0 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ماقالىنىڭ تور بېتىدىن تولۇق تېكىست ئابزاسلىرىنى ئېلىپ چىقىدۇ
 * (پۈتۈن تەرجىمە ۋە خۇلاسە ئۈچۈن).
 */
async function fetchFullArticleText(url: string, maxChars = 11000): Promise<string[]> {
  if (!url || !url.startsWith('http')) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // ماقالە رايونى بار بولسا شۇنى ئالدىن تاللاش
    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
    const scope = articleMatch ? articleMatch[0] : html;

    const cleaned = scope
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
      .replace(/<figure[\s\S]*?<\/figure>/gi, ' ');

    const seen = new Set<string>();
    const paragraphs: string[] = [];
    let totalLen = 0;

    for (const m of cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const text = decodeHtmlEntities(m[1]);
      if (text.length < 40) continue;
      if (/^(advertisement|sign up|subscribe|read more|all rights reserved|cookie)/i.test(text)) {
        continue;
      }
      if (seen.has(text)) continue;
      seen.add(text);
      paragraphs.push(text);
      totalLen += text.length;
      if (paragraphs.length >= 32 || totalLen >= maxChars) break;
    }

    return paragraphs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const UYGHUR_EDITORIAL_RULES = `مۇھىم قائىدىلەر (قەتئىي ئەمەل قىلىش شەرت):
1. بارلىق جاۋابلار ساپ، راۋان، رەسمىي ۋە ئىلمىي ئەدەبىي ئۇيغۇر تىلىدا بولسۇن.
2. ئاتالغۇ مۇستەقىللىقىگە قەتئىي ئەمەل قىل: مۇستەملىكىچى ئاتالغۇلارنى قەتئىي ئىشلەتمە. زۆرۈر تېپىلغاندا دائىم پەقەت «شەرقىي تۈركىستان»، «خىتاي» ياكى «خىتاي تىلى» دېگەن ئاتالغۇلارنىلا ئىشلەت.
3. تىل ئۇسلۇبى ئەھلى سۈننەت ۋەلجامائەت ئەخلاقىغا ئۇيغۇن، سالماق، ئىلمىي، ئوبيېكتىپ ۋە شەرقىي تۈركىستان خەلقىنىڭ قەدىر-قىممىتىگە ھۆرمەت قىلىدىغان بولسۇن.`;

async function translateSingleArticleComplete(params: {
  originalTitle: string;
  originalExcerpt: string;
  articleUrl: string;
  language?: LanguageCode;
  preferredEngine?: AiEnginePreference;
  openRouterKey?: string;
  openRouterModel?: string;
  customGlossaryRules?: GlossaryRule[];
}) {
  const scrapedParagraphs = await fetchFullArticleText(params.articleUrl, 10000);
  const fullSourceText =
    scrapedParagraphs.length > 0
      ? scrapedParagraphs.join('\n\n')
      : params.originalExcerpt || params.originalTitle;

  const glossaryBlock = buildGlossaryPromptRules(params.customGlossaryRules);
  const systemInstruction = `سەن ئەرەبچە، ئىنگلىزچە ۋە تۈركچە خەلقئارالىق گېئوسىياسىي ئانالىز ماقالىلىرىنى باشتىن-ئاخىر تولۇق ئەدەبىي ئۇيغۇر تىلىغا تەرجىمە قىلىدىغان ئالىي تەرجىمان.
${UYGHUR_EDITORIAL_RULES}
${glossaryBlock}
4. قىسقارتما، ئاتلاپ ئۆتمە، پەقەت ماۋزۇ ياكى بىر قىسمىنىلا تەرجىمە قىلىپ قويما! بېرىلگەن ماۋزۇ ۋە بارلىق ئابزاسلارنى تولۇق، بىرمۇبىر ئۇيغۇر تىلىغا تەرجىمە قىل.
5. ھېچقانداق جۈملىنى ئەرەبچە، ئىنگلىزچە ياكى تۈركچە پېتى قالدۇرما.
6. «uyghurFullParagraphs» تىزىملىكىدە ماقالىنىڭ پۈتۈن ئۇيغۇرچە ئابزاسلىرىنى رەت بويىچە قايتۇر.`;

  const userPrompt = `تۆۋەندىكى ماقالىنىڭ ماۋزۇسىنى ۋە پۈتۈن تېكىستىنى تولۇق ئۇيغۇر تىلىغا تەرجىمە قىلىپ بەر (قىسقارتماي تولۇق تەرجىمە قىل):\n\nماۋزۇ:\n${params.originalTitle}\n\nتولۇق تېكىست:\n${fullSourceText}`;

  let parsed: {
    uyghurTitle?: string;
    uyghurFullParagraphs?: string[];
  };
  let engineUsed: 'gemini' | 'openrouter' = 'gemini';

  const runGeminiFullTranslate = async () => {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            uyghurTitle: {
              type: Type.STRING,
              description: 'ماقالە ماۋزۇسىنىڭ تولۇق ئۇيغۇرچە تەرجىمىسى',
            },
            uyghurFullParagraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'ماقالىنىڭ بارلىق ئابزاسلىرىنىڭ تولۇق ئۇيغۇرچە تەرجىمىسى',
            },
          },
          required: ['uyghurTitle', 'uyghurFullParagraphs'],
        },
      },
    });
    return JSON.parse((response.text ?? '{}').trim()) as {
      uyghurTitle?: string;
      uyghurFullParagraphs?: string[];
    };
  };

  if (shouldUseOpenRouter(params.preferredEngine, params.openRouterKey)) {
    try {
      engineUsed = 'openrouter';
      parsed = await callOpenRouterJson(
        `${systemInstruction}\nJSON قۇرۇلمىسى: {"uyghurTitle": "...", "uyghurFullParagraphs": ["1-ئابزاس", "2-ئابزاس", "..."]}`,
        userPrompt,
        params.openRouterKey,
        params.openRouterModel,
        4096
      );
    } catch (err) {
      const canFallback =
        Boolean(process.env.GEMINI_API_KEY) &&
        err instanceof OpenRouterApiError &&
        (err.status === 402 || err.status === 429);
      if (!canFallback) {
        throw err;
      }
      engineUsed = 'gemini';
      parsed = await runGeminiFullTranslate();
    }
  } else {
    parsed = await runGeminiFullTranslate();
  }

  const uyghurTitle = enforceUyghurTerminology(
    parsed.uyghurTitle || params.originalTitle,
    params.customGlossaryRules
  );
  const uyghurFullParagraphs = (parsed.uyghurFullParagraphs || [])
    .map((p) => enforceUyghurTerminology(String(p || '').trim(), params.customGlossaryRules))
    .filter(Boolean);

  const uyghurExcerpt =
    uyghurFullParagraphs.length > 0
      ? uyghurFullParagraphs.slice(0, 2).join('\n\n')
      : uyghurTitle;

  return {
    uyghurTitle,
    uyghurFullParagraphs,
    uyghurExcerpt,
    engineUsed,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '3mb' }));

  // مۇلازىمېتىر ھالىتى
  app.get('/api/config/status', (_req, res) => {
    res.json({
      geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
      openRouterConfigured: Boolean(
        process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()
      ),
      openRouterModel: process.env.OPENROUTER_MODEL?.trim() || 'google/gemini-2.5-flash',
      telegramConfigured: Boolean(
        process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim()
      ),
    });
  });

  // OpenRouter ئاچقۇچىنى سىناش
  app.post('/api/openrouter/test', async (req, res) => {
    try {
      const headerKey = req.header('x-openrouter-key');
      const apiKey = resolveOpenRouterKey(headerKey);
      if (!apiKey) {
        return res.status(400).json({ ok: false, error: 'OpenRouter ئاچقۇچى كىرگۈزۈلمىدى.' });
      }
      const check = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!check.ok) {
        return res.status(401).json({
          ok: false,
          error: `ئاچقۇچ ئىناۋەتسىز ياكى رەت قىلىندى (HTTP ${check.status}).`,
        });
      }
      const info = (await check.json()) as { data?: { label?: string } };
      return res.json({
        ok: true,
        label: info.data?.label || 'ئۇلىنىش مۇۋەپپەقىيەتلىك',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OpenRouter ئۇلىنىشىدا خاتالىق كۆرۈلدى.';
      return res.status(500).json({ ok: false, error: message });
    }
  });

  // تېلېگراممىغا يوللاش (پەقەت مۇلازىمېتىر تەرەپتىكى .env دىن ئوقۇيدۇ)
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
      const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

      if (!botToken || !chatId) {
        return res.status(500).json({
          error: 'تېلېگرامما بوت تەڭشىكى (.env دىكى TELEGRAM_BOT_TOKEN ۋە TELEGRAM_CHAT_ID) تېپىلمىدى.',
        });
      }

      const {
        title,
        paragraphs,
        keyTakeaways,
        topic,
        sourceName,
        articleUrl,
        publishedAt,
        customGlossaryRules,
      } = req.body as {
        title?: string;
        paragraphs?: string[];
        keyTakeaways?: string[];
        topic?: string;
        sourceName?: string;
        articleUrl?: string;
        publishedAt?: string;
        customGlossaryRules?: GlossaryRule[];
      };

      if (!title || !articleUrl) {
        return res.status(400).json({ error: 'يوللىنىدىغان ئانالىز ماۋزۇسى ياكى ئۇلانمىسى كەم.' });
      }

      const formatted = formatAnalysisForTelegram({
        title,
        paragraphs: Array.isArray(paragraphs) ? paragraphs : [],
        keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : undefined,
        topic,
        sourceName: sourceName || 'مەنبە',
        articleUrl,
        publishedAt,
        customGlossaryRules: Array.isArray(customGlossaryRules) ? customGlossaryRules : undefined,
      });

      const parts = splitTelegramMessage(formatted, 3950);

      for (const part of parts) {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: part,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        });

        const tgData = (await tgRes.json()) as { ok?: boolean; description?: string };
        if (!tgRes.ok || !tgData.ok) {
          throw new Error(tgData.description || `Telegram HTTP ${tgRes.status}`);
        }
      }

      return res.json({
        ok: true,
        partsSent: parts.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تېلېگراممىغا يوللاشتا خاتالىق كۆرۈلدى.';
      return res.status(500).json({ error: message });
    }
  });

  // 1. كۈندىلىك خەلقئارا ئانالىزلارنى پەقەت 8 گېئوسىياسىي تېما بويىچە يىغىش
  app.post('/api/feeds/fetch', async (req, res) => {
    try {
      const channels = Array.isArray(req.body?.channels) ? (req.body.channels as ChannelConfig[]) : [];
      const strictGeopoliticalFilter =
        typeof req.body?.strictGeopoliticalFilter === 'boolean'
          ? req.body.strictGeopoliticalFilter
          : true;
      const enabledTopics = Array.isArray(req.body?.enabledTopics)
        ? (req.body.enabledTopics as GeopoliticalTopicId[])
        : undefined;

      const activeChannels = channels.filter(
        (c) => c && c.enabled && typeof c.rssUrl === 'string' && c.rssUrl.startsWith('http')
      );

      if (activeChannels.length === 0) {
        return res.status(400).json({ error: 'ھېچقانداق ئاكتىپ ئانالىز قانىلى تاللانمىدى.' });
      }

      const settled = await Promise.all(
        activeChannels.map(async (channel) => ({
          channel,
          result: await fetchSingleFeed(channel, strictGeopoliticalFilter, enabledTopics),
        }))
      );

      const items = [];
      const failedChannels: { name: string; reason: string }[] = [];
      let succeededChannels = 0;
      let filteredOutCount = 0;

      for (const entry of settled) {
        if (entry.result.ok) {
          succeededChannels += 1;
          filteredOutCount += entry.result.filteredOut;
          items.push(...entry.result.items);
        } else {
          failedChannels.push({ name: entry.channel.name, reason: entry.result.error });
        }
      }

      items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return res.json({
        items,
        succeededChannels,
        failedChannels,
        filteredOutCount,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'قاناللارنى يىغىشتا خاتالىق كۆرۈلدى.';
      return res.status(500).json({ error: message });
    }
  });

  // 2. يەككە ئانالىزنى باشتىن-ئاخىر تولۇق ئۇيغۇرچىگە تەرجىمە قىلىش
  app.post('/api/translate-full', async (req, res) => {
    try {
      const {
        originalTitle,
        originalExcerpt,
        articleUrl,
        language,
        preferredEngine,
        customGlossaryRules,
      } = req.body as {
        originalTitle?: string;
        originalExcerpt?: string;
        articleUrl?: string;
        language?: LanguageCode;
        preferredEngine?: AiEnginePreference;
        customGlossaryRules?: GlossaryRule[];
      };

      const openRouterKey = req.header('x-openrouter-key');
      const openRouterModel = req.header('x-openrouter-model');

      if (preferredEngine === 'openrouter' && !resolveOpenRouterKey(openRouterKey)) {
        return res.status(400).json({
          error: 'OpenRouter تاللانغان، ئەمما ئاچقۇچ كىرگۈزۈلمىدى. تەڭشەكتىن OpenRouter ئاچقۇچىنى سېلىڭ.',
        });
      }

      if (!originalTitle && !originalExcerpt) {
        return res.status(400).json({ error: 'تەرجىمە قىلىنىدىغان ماقالە مەزمۇنى تەمىنلەنمىدى.' });
      }

      const result = await translateSingleArticleComplete({
        originalTitle: originalTitle || '',
        originalExcerpt: originalExcerpt || '',
        articleUrl: articleUrl || '',
        language,
        preferredEngine,
        openRouterKey,
        openRouterModel,
        customGlossaryRules: Array.isArray(customGlossaryRules) ? customGlossaryRules : undefined,
      });

      return res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تولۇق ئۇيغۇرچە تەرجىمىدە خاتالىق كۆرۈلدى.';
      return res.status(500).json({ error: message });
    }
  });

  // 3. توپ ھالەتتە تولۇق تەرجىمە قىلىش (ھەر بىر ماقالىنىڭ تولۇق تېكىستىنى ئەينەن تەرجىمە قىلىدۇ)
  app.post('/api/translate-batch', async (req, res) => {
    try {
      const rawItems = Array.isArray(req.body?.items)
        ? (req.body.items as Array<{
            articleUrl: string;
            originalTitle: string;
            originalExcerpt: string;
            language: LanguageCode;
          }>)
        : [];
      const preferredEngine = req.body?.preferredEngine as AiEnginePreference | undefined;
      const customGlossaryRules = Array.isArray(req.body?.customGlossaryRules)
        ? (req.body.customGlossaryRules as GlossaryRule[])
        : undefined;
      const openRouterKey = req.header('x-openrouter-key');
      const openRouterModel = req.header('x-openrouter-model');

      if (preferredEngine === 'openrouter' && !resolveOpenRouterKey(openRouterKey)) {
        return res.status(400).json({
          error: 'OpenRouter تاللانغان، ئەمما ئاچقۇچ كىرگۈزۈلمىدى. تەڭشەكتىن OpenRouter ئاچقۇچىنى سېلىڭ.',
        });
      }

      if (rawItems.length === 0) {
        return res.json({ translations: [] });
      }

      const batch = rawItems.slice(0, 4);
      const settled = await Promise.all(
        batch.map(async (item) => {
          try {
            const tr = await translateSingleArticleComplete({
              originalTitle: item.originalTitle,
              originalExcerpt: item.originalExcerpt,
              articleUrl: item.articleUrl,
              language: item.language,
              preferredEngine,
              openRouterKey,
              openRouterModel,
              customGlossaryRules,
            });
            return {
              articleUrl: item.articleUrl,
              uyghurTitle: tr.uyghurTitle,
              uyghurExcerpt: tr.uyghurExcerpt,
              uyghurFullParagraphs: tr.uyghurFullParagraphs,
              isFullTranslated: true,
            };
          } catch {
            return null;
          }
        })
      );

      const translations = settled.filter(Boolean);
      return res.json({ translations });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ئۇيغۇرچە تەرجىمىدە خاتالىق كۆرۈلدى.';
      return res.status(500).json({ error: message });
    }
  });

  // 4. ئانالىزنى ئىلمىي، رەسمىي ئەدەبىي ئۇيغۇر تىلىدا خۇلاسىلەش
  app.post('/api/summarize', async (req, res) => {
    try {
      const {
        originalTitle,
        originalExcerpt,
        sourceName,
        articleUrl,
        language,
        preferredEngine,
        customGlossaryRules,
      } = req.body as {
        originalTitle?: string;
        originalExcerpt?: string;
        sourceName?: string;
        articleUrl?: string;
        language?: LanguageCode;
        preferredEngine?: AiEnginePreference;
        customGlossaryRules?: GlossaryRule[];
      };

      const rules = Array.isArray(customGlossaryRules) ? customGlossaryRules : undefined;
      const openRouterKey = req.header('x-openrouter-key');
      const openRouterModel = req.header('x-openrouter-model');

      if (preferredEngine === 'openrouter' && !resolveOpenRouterKey(openRouterKey)) {
        return res.status(400).json({
          error: 'OpenRouter تاللانغان، ئەمما ئاچقۇچ كىرگۈزۈلمىدى. تەڭشەكتىن OpenRouter ئاچقۇچىنى سېلىڭ.',
        });
      }

      if (!originalTitle && !originalExcerpt) {
        return res.status(400).json({ error: 'خۇلاسىلەيدىغان ماقالە مەزمۇنى تەمىنلەنمىدى.' });
      }

      const fullParagraphs = articleUrl ? await fetchFullArticleText(articleUrl, 8000) : [];
      const extraBody = fullParagraphs.join('\n\n');
      const combinedContext = [
        `ماۋزۇ: ${originalTitle || ''}`,
        `مەنبە: ${sourceName || ''}`,
        `ئەسلى تىل: ${language || ''}`,
        `قىسقىچە مەزمۇن: ${originalExcerpt || ''}`,
        extraBody ? `ماقالىنىڭ تولۇق تېكىستى:\n${extraBody}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const glossaryBlock = buildGlossaryPromptRules(rules);
      const systemInstruction = `سەن خەلقئارا سىياسىي، ئىقتىسادىي ۋە ئىستراتېگىيەلىك ئانالىزلارنى ئىلمىي، رەسمىي ۋە نەپىس ئەدەبىي ئۇيغۇر تىلىدا خۇلاسىلەيدىغان تەجرىبىلىك مۇتەخەسسىس.

${UYGHUR_EDITORIAL_RULES}
${glossaryBlock}
4. «summaryParagraphs» قىسمىدا 2 دىن 3 كىچە مۇكەممەل ئۇيغۇرچە ئابزاس ياز (ھەر بىر ئابزاس ئېنىق، چوڭقۇر تەھلىلىي خۇلاسە بولسۇن).
5. «keyTakeaways» قىسمىدا 3 دانە قىسقا، يادرولۇق يەكۈن بەر.
6. «topic» قىسمىدا قىسقا بىر تېما تۈرى بەر (مەسىلەن: خەلقئارادىكى 4 چوڭ بوغۇز، روسىيە-ئۇكرائىنا ئۇرۇشى، ئوتتۇرا شەرق، خىتاي ۋەزىيىتى، ئامېرىكا-ئىران ئۇرۇشى، جەنۇبىي دېڭىز، ئوتتۇرا ئاسىيا، شەرقىي تۈركىستان).`;

      let parsed: {
        uyghurTitle?: string;
        summaryParagraphs?: string[];
        keyTakeaways?: string[];
        topic?: string;
      };
      let engineUsed: 'gemini' | 'openrouter' = 'gemini';

      const runGeminiSummary = async () => {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `تۆۋەندىكى خەلقئارا ئانالىزنى ئۇيغۇر تىلىدا ئىلمىي ۋە ئېنىق خۇلاسىلەپ بەر:\n\n${combinedContext}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                uyghurTitle: {
                  type: Type.STRING,
                  description: 'ئانالىز ماۋزۇسىنىڭ ساپ ئەدەبىي ئۇيغۇرچە تەرجىمىسى',
                },
                summaryParagraphs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2-3 ئابزاستىن تەركىب تاپقان ئىلمىي ئۇيغۇرچە خۇلاسە',
                },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 دانە يادرولۇق نۇقتا',
                },
                topic: {
                  type: Type.STRING,
                  description: 'تەھلىل تېما تۈرى',
                },
              },
              required: ['uyghurTitle', 'summaryParagraphs', 'keyTakeaways', 'topic'],
            },
          },
        });
        return JSON.parse((response.text ?? '{}').trim()) as {
          uyghurTitle?: string;
          summaryParagraphs?: string[];
          keyTakeaways?: string[];
          topic?: string;
        };
      };

      if (shouldUseOpenRouter(preferredEngine, openRouterKey)) {
        try {
          engineUsed = 'openrouter';
          parsed = await callOpenRouterJson(
            `${systemInstruction}\nJSON قۇرۇلمىسى: {"uyghurTitle": "...", "summaryParagraphs": ["...", "..."], "keyTakeaways": ["...", "...", "..."], "topic": "..."}`,
            `تۆۋەندىكى خەلقئارا ئانالىزنى ئۇيغۇر تىلىدا ئىلمىي ۋە ئېنىق خۇلاسىلەپ بەر:\n\n${combinedContext}`,
            openRouterKey,
            openRouterModel,
            2048
          );
        } catch (err) {
          const canFallback =
            Boolean(process.env.GEMINI_API_KEY) &&
            err instanceof OpenRouterApiError &&
            (err.status === 402 || err.status === 429);
          if (!canFallback) {
            throw err;
          }
          engineUsed = 'gemini';
          parsed = await runGeminiSummary();
        }
      } else {
        parsed = await runGeminiSummary();
      }

      const sanitized = {
        uyghurTitle: enforceUyghurTerminology(parsed.uyghurTitle || originalTitle || '', rules),
        summaryParagraphs: (parsed.summaryParagraphs || []).map((p) =>
          enforceUyghurTerminology(p, rules)
        ),
        keyTakeaways: (parsed.keyTakeaways || []).map((k) => enforceUyghurTerminology(k, rules)),
        topic: enforceUyghurTerminology(parsed.topic || 'خەلقئارا ئانالىز', rules),
        engineUsed,
      };

      return res.json(sanitized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خۇلاسە ھاسىل قىلىشتا خاتالىق كۆرۈلدى.';
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Analizlar server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
