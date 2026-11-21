import { enforceUyghurTerminology, formatUyghurDate } from './terminology';
import type { GlossaryRule } from '../types';

export interface TelegramArticlePayload {
  title: string;
  paragraphs: string[];
  keyTakeaways?: string[];
  topic?: string;
  sourceName: string;
  articleUrl: string;
  publishedAt?: string;
  customGlossaryRules?: GlossaryRule[];
}

export function escapeTelegramHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * ئانالىزنى تېلېگرامما HTML فورماتىدا رەتلىك تەييارلايدۇ
 * (ماۋزۇ، تېما، ۋاقىت، تولۇق ئۇيغۇرچە مەزمۇن، مەنبە ۋە ئۇلانما ئادرېسى).
 */
export function formatAnalysisForTelegram(payload: TelegramArticlePayload): string {
  const rules = payload.customGlossaryRules;
  const safeTitle = escapeTelegramHtml(enforceUyghurTerminology(payload.title, rules));
  const safeTopic = payload.topic
    ? escapeTelegramHtml(enforceUyghurTerminology(payload.topic, rules))
    : '';
  const safeDate = payload.publishedAt ? escapeTelegramHtml(formatUyghurDate(payload.publishedAt)) : '';
  const safeSource = escapeTelegramHtml(enforceUyghurTerminology(payload.sourceName, rules));
  const safeUrl = (payload.articleUrl || '').trim();

  const headerLines: string[] = [`<b>${safeTitle}</b>`];
  const metaParts = [safeTopic, safeDate].filter(Boolean);
  if (metaParts.length > 0) {
    headerLines.push(`<i>${metaParts.join(' · ')}</i>`);
  }

  const bodyLines = (payload.paragraphs || [])
    .map((p) => enforceUyghurTerminology(p.trim(), rules))
    .filter(Boolean)
    .map((p) => escapeTelegramHtml(p));

  const sections: string[] = [headerLines.join('\n')];
  if (bodyLines.length > 0) {
    sections.push(bodyLines.join('\n\n'));
  }

  if (payload.keyTakeaways && payload.keyTakeaways.length > 0) {
    const takeaways = payload.keyTakeaways
      .map((k, i) => `${i + 1}. ${escapeTelegramHtml(enforceUyghurTerminology(k.trim(), rules))}`)
      .join('\n');
    sections.push(`<b>يادرولۇق نۇقتىلار:</b>\n${takeaways}`);
  }

  const footer = `<b>مەنبەسى:</b> ${safeSource}\n<b>ئۇلانما ئادرېسى:</b> ${escapeTelegramHtml(safeUrl)}`;
  sections.push(footer);

  return sections.join('\n\n');
}

/**
 * تېلېگراممىنىڭ 4096 ھەرپ چەكلىمىسىدىن ئېشىپ كەتكەن ئۇزۇن ئانالىزلارنى
 * ئابزاس چېگراسىدىن پاكىز بۆلۈپ تەييارلايدۇ.
 */
export function splitTelegramMessage(message: string, maxLength = 3950): string[] {
  const cleaned = (message || '').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLength) return [cleaned];

  const blocks = cleaned.split('\n\n');
  const chunks: string[] = [];
  let current = '';

  for (const block of blocks) {
    if (block.length > maxLength) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      // ناھايىتى ئۇزۇن يەككە ئابزاسنى بوشلۇق بويىچە بۆلۈش
      let remaining = block;
      while (remaining.length > maxLength) {
        let cut = remaining.lastIndexOf(' ', maxLength);
        if (cut < Math.floor(maxLength * 0.5)) {
          cut = maxLength;
        }
        chunks.push(remaining.slice(0, cut).trim());
        remaining = remaining.slice(cut).trim();
      }
      if (remaining) {
        current = remaining;
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) chunks.push(current.trim());
      current = block;
    }
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks;
}
