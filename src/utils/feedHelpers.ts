/**
 * RSS ۋە Atom ئۇچۇرلىرىنى پاكىزلاش، ئۇلانما چىقىرىش ۋە ۋاقىتنى ئۆلچەملەشتۈرۈش ياردەمچى فۇنكسىيەلىرى.
 * مۇلازىمېتىر ۋە يۇنىت تېستلار تەرىپىدىن بىۋاسىتە ئىشلىتىلىدۇ.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTextValue(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return decodeHtmlEntities(val);
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj['#text'] === 'string') return decodeHtmlEntities(obj['#text']);
    if (typeof obj['@_href'] === 'string') return obj['@_href'].trim();
  }
  return '';
}

export function extractLink(item: Record<string, unknown>, fallbackSite: string): string {
  const rawLink = item?.link;
  if (typeof rawLink === 'string' && rawLink.trim().startsWith('http')) {
    return rawLink.trim();
  }
  if (Array.isArray(rawLink)) {
    for (const entry of rawLink) {
      if (typeof entry === 'object' && entry !== null) {
        const href = (entry as Record<string, unknown>)['@_href'];
        const rel = (entry as Record<string, unknown>)['@_rel'];
        if (typeof href === 'string' && href.trim().startsWith('http') && (!rel || rel === 'alternate')) {
          return href.trim();
        }
      }
    }
  }
  if (typeof rawLink === 'object' && rawLink !== null) {
    const href = (rawLink as Record<string, unknown>)['@_href'];
    if (typeof href === 'string' && href.trim().startsWith('http')) {
      return href.trim();
    }
  }
  const guid = extractTextValue(item?.guid);
  if (guid.startsWith('http')) return guid;
  return fallbackSite;
}

export function safeIsoDate(raw: unknown, fallbackNow?: Date): string {
  const str = extractTextValue(raw);
  const fallback = (fallbackNow ?? new Date()).toISOString();
  if (!str) return fallback;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}
