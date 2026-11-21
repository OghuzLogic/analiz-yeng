import { describe, expect, it } from 'vitest';
import {
  escapeTelegramHtml,
  formatAnalysisForTelegram,
  splitTelegramMessage,
} from '../src/utils/telegramFormat';

/**
 * تېلېگراممىغا يوللاش فورماتى ۋە ئۇزۇن تېكىستلەرنى بىخەتەر بۆلۈش يۇنىت تېستلىرى
 */
describe('telegramFormat — تېلېگرامما فورماتى ۋە بۆلۈش فۇنكسىيەلىرى', () => {
  it('TC-TG-01: HTML مەخسۇس بەلگىلىرىنى (&, <, >) بىخەتەر قوغداش', () => {
    expect(escapeTelegramHtml('US & Iran <talks>')).toBe('US &amp; Iran &lt;talks&gt;');
    expect(escapeTelegramHtml('')).toBe('');
  });

  it('TC-TG-02: تولۇق ئۇيغۇرچە ئانالىزنى ماۋزۇ، ۋاقىت، مەنبە ۋە ئۇلانمىسى بىلەن فورماتلاش', () => {
    const formatted = formatAnalysisForTelegram({
      title: 'شەرقىي تۈركىستان ۋە ئوتتۇرا ئاسىيا ئىستراتېگىيەسى',
      paragraphs: ['بىرىنچى تولۇق ئابزاس.', 'ئىككىنچى تولۇق ئابزاس.'],
      keyTakeaways: ['يادرولۇق نۇقتا 1', 'يادرولۇق نۇقتا 2'],
      topic: 'شەرقىي تۈركىستان',
      sourceName: 'ئەلجەزىرە',
      articleUrl: 'https://www.aljazeera.net/politics/test',
      publishedAt: new Date(2026, 10, 21, 10, 15).toISOString(),
    });

    expect(formatted).toContain('<b>شەرقىي تۈركىستان ۋە ئوتتۇرا ئاسىيا ئىستراتېگىيەسى</b>');
    expect(formatted).toContain('بىرىنچى تولۇق ئابزاس.');
    expect(formatted).toContain('ئىككىنچى تولۇق ئابزاس.');
    expect(formatted).toContain('<b>يادرولۇق نۇقتىلار:</b>');
    expect(formatted).toContain('<b>مەنبەسى:</b> ئەلجەزىرە');
    expect(formatted).toContain('<b>ئۇلانما ئادرېسى:</b> https://www.aljazeera.net/politics/test');
  });

  it('TC-TG-03: چەكلەنگەن مۇستەملىكىچى ئاتالغۇلار تېلېگرامما تېكىستىدە ئاپتوماتىك تازىلىنىشى كېرەك', () => {
    const forbidden = '\u0634\u0649\u0646\u062c\u0627\u06ad';
    const formatted = formatAnalysisForTelegram({
      title: `${forbidden} خەۋىرى`,
      paragraphs: [`${forbidden} توغرىسىدا دوكلات`],
      sourceName: 'BBC',
      articleUrl: 'https://www.bbc.com/news/world',
    });
    expect(formatted).not.toContain(forbidden);
    expect(formatted).toContain('شەرقىي تۈركىستان');
  });

  it('TC-TG-04: 4096 ھەرپتىن ئېشىپ كەتكەن تولۇق تەرجىمىلەرنى پاكىز پارچىلاش (Edge Case)', () => {
    const p1 = 'ئۇيغۇرچە تولۇق تەرجىمە ئابزاسى. '.repeat(80).trim();
    const p2 = 'ئىككىنچى ئۇزۇن تەھلىل ئابزاسى. '.repeat(80).trim();
    const full = `${p1}\n\n${p2}`;

    const chunks = splitTelegramMessage(full, 1500);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1500);
    }
    expect(splitTelegramMessage('')).toEqual([]);
  });
});
