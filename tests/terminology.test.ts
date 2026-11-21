import { describe, expect, it } from 'vitest';
import {
  applyGlossaryToAnalysis,
  buildGlossaryPromptRules,
  BUILTIN_ORTHOGRAPHY_RULES,
  enforceUyghurTerminology,
  extractDomain,
  formatUyghurDate,
  getLanguageLabel,
  getLocalDateKey,
  getRelativeDayBadge,
  shouldRunDailyRefresh,
} from '../src/utils/terminology';
import type { AnalysisItem, GlossaryRule } from '../src/types';

/**
 * ئاتالغۇ مۇستەقىللىقى، ۋاقىت-چېسلا فورماتى ۋە كۈندىلىك يېڭىلاش لوگىكىسى تېستلىرى
 */
describe('terminology — ئاتالغۇ، چېسلا ۋە كۈندىلىك يېڭىلاش فۇنكسىيەلىرى', () => {
  it('TC-TM-01: چەكلەنگەن مۇستەملىكىچى ئاتالغۇلارنى مۇستەقىل ئاتالغۇلارغا ئالماشتۇرۇش', () => {
    const forbidden1 = '\u0634\u0649\u0646\u062c\u0627\u06ad';
    const forbidden2 = '\u062c\u06c7\u06ad\u06af\u0648';
    const forbidden3 = '\u062e\u06d5\u0646\u0632\u06c7\u0686\u06d5';
    const sample = `${forbidden1} مەسىلىسى ۋە ${forbidden2} تەشۋىقاتى (${forbidden3})`;

    const cleaned = enforceUyghurTerminology(sample);
    expect(cleaned).toBe('شەرقىي تۈركىستان مەسىلىسى ۋە خىتاي تەشۋىقاتى (خىتاي تىلى)');
  });

  it('TC-TM-02: قۇرۇق ياكى پاكىز ئۇيغۇرچە تېكىستنى ئۆزگەرتمەي قايتۇرۇش (Edge Case)', () => {
    expect(enforceUyghurTerminology('')).toBe('');
    expect(enforceUyghurTerminology('شەرقىي تۈركىستان ۋە ئوتتۇرا ئاسىيا')).toBe(
      'شەرقىي تۈركىستان ۋە ئوتتۇرا ئاسىيا'
    );
  });

  it('TC-TM-03: تىل بەلگىلىرىنى ئۇيغۇرچە توغرا قايتۇرۇش', () => {
    expect(getLanguageLabel('ar')).toBe('ئەرەبچە');
    expect(getLanguageLabel('en')).toBe('ئىنگلىزچە');
    expect(getLanguageLabel('tr')).toBe('تۈركچە');
  });

  it('TC-TM-04: ئېنىق ئۇيغۇرچە چېسلا ۋە سائەت فورماتى (formatUyghurDate)', () => {
    const date = new Date(2026, 10, 21, 9, 5); // 2026-11-21 09:05 local time
    const formatted = formatUyghurDate(date.toISOString());
    expect(formatted).toBe('2026-يىل 11-ئاينىڭ 21-كۈنى، 09:05');
  });

  it('TC-TM-05: ناتوغرا ۋاقىت تېكىستىدە خاتالىق چىقارماي ئەسلى قىممەتنى قايتۇرۇش (Error Case)', () => {
    expect(formatUyghurDate('invalid-date-string')).toBe('invalid-date-string');
    expect(getRelativeDayBadge('invalid-date-string')).toBe('');
  });

  it('TC-TM-06: بۈگۈن، تۈنۈگۈن ۋە بۇرۇنقى كۈنلەرنى توغرا پەرقلەندۈرۈش', () => {
    const now = new Date(2026, 10, 21, 14, 0);
    const today = new Date(2026, 10, 21, 8, 30).toISOString();
    const yesterday = new Date(2026, 10, 20, 18, 0).toISOString();
    const older = new Date(2026, 10, 15, 10, 0).toISOString();

    expect(getRelativeDayBadge(today, now)).toBe('بۈگۈن');
    expect(getRelativeDayBadge(yesterday, now)).toBe('تۈنۈگۈن');
    expect(getRelativeDayBadge(older, now)).toBe('2026-11-15');
    expect(getLocalDateKey(now)).toBe('2026-11-21');
  });

  it('TC-TM-07: كۈندىلىك ئاپتوماتىك يېڭىلاش قائىدىسى (shouldRunDailyRefresh)', () => {
    const now = new Date(2026, 10, 21, 14, 0);

    // تۇنجى قېتىم (null) ياكى ناتوغرا ۋاقىت -> يېڭىلاش كېرەك
    expect(shouldRunDailyRefresh(null, 6, now)).toBe(true);
    expect(shouldRunDailyRefresh('not-a-date', 6, now)).toBe(true);

    // تۈنۈگۈن يېڭىلانغان -> يېڭى كۈنگە ئۆتكەنلىكتىن دەرھال يېڭىلاش كېرەك
    const yesterdayNight = new Date(2026, 10, 20, 23, 30).toISOString();
    expect(shouldRunDailyRefresh(yesterdayNight, 24, now)).toBe(true);

    // بۈگۈن 2 سائەت بۇرۇن يېڭىلانغان (ئارىلىق 6 سائەت) -> يېڭىلاش ھاجەتسىز
    const twoHoursAgo = new Date(2026, 10, 21, 12, 0).toISOString();
    expect(shouldRunDailyRefresh(twoHoursAgo, 6, now)).toBe(false);

    // بۈگۈن 7 سائەت بۇرۇن يېڭىلانغان (ئارىلىق 6 سائەت) -> يېڭىلاش كېرەك
    const sevenHoursAgo = new Date(2026, 10, 21, 7, 0).toISOString();
    expect(shouldRunDailyRefresh(sevenHoursAgo, 6, now)).toBe(true);
  });

  it('TC-TM-08: تور بەت دائىرە نامىنى (extractDomain) توغرا ئايرىش', () => {
    expect(extractDomain('https://www.aljazeera.net/politics/2026')).toBe('aljazeera.net');
    expect(extractDomain('https://feeds.bbci.co.uk/news/world')).toBe('feeds.bbci.co.uk');
    expect(extractDomain('not-a-valid-url')).toBe('not-a-valid-url');
  });

  it('TC-TM-09: بارلىق 15 مۇقىم ئىملا قائىدىسىنىڭ تولۇق ۋە توغرا ئىشلىشى', () => {
    expect(BUILTIN_ORTHOGRAPHY_RULES).toHaveLength(15);

    expect(enforceUyghurTerminology('ئامېرىكا قوشما شتاتلىرى')).toBe('ئامېرىكا');
    expect(enforceUyghurTerminology('ئەرەب بىرلەشمە خەلىپىسى')).toBe('ئەرەب بىرلەشمە ئەمىرلىكى');
    expect(enforceUyghurTerminology('ئۇچقۇسىز ئايروپلان ھۇجۇمى')).toBe('تىزگىن ئۇچقۇ ھۇجۇمى');
    expect(enforceUyghurTerminology('ئۇچقۇسىز ھۇجۇم')).toBe('تىزگىن ئۇچقۇ ھۇجۇم');
    expect(
      enforceUyghurTerminology('ئىران ئىسلام جۇمھۇرىيىتى ۋە پاكىستان ئىسلام جۇمھۇرىيىتى')
    ).toBe('ئىران ۋە پاكىستان');
    expect(enforceUyghurTerminology('شىيئە مۇسۇلمانلىرى')).toBe('شىيئە');
    expect(enforceUyghurTerminology('مۇرھەف ئەبۇ قەسرە')).toBe(
      'سۈرىيە دۆلەت مۇداپىئە مىنىستىرى مۇرھىپ ئەبۇ قەسرا'
    );
    expect(enforceUyghurTerminology('سۈرىيە پىرىزدېنتى بايانات بەردى')).toBe(
      'سۈرىيە رەئىسى بايانات بەردى'
    );
    expect(enforceUyghurTerminology('مەزھەر ئەلۋەيس')).toBe(
      'سۈرىيە ئەدىلىيە مىنىستىرى مۇزھىر ئەلھۇۋەيس'
    );
    expect(enforceUyghurTerminology('ئەلى نەئسان')).toBe(
      'سۈرىيە باش شتاب باشلىقى ئەلى ئەننەئسان'
    );
    expect(
      enforceUyghurTerminology('سۈرىيە ئەرەب جۇمھۇرىيىتى تاشقى ئىشلار ۋە چەتئەللىكلەر مىنىستىرلىكى')
    ).toBe('سۈرىيە تاشقى ئىشلار مىنىستىرى');
    expect(enforceUyghurTerminology('ھاقان فىدان')).toBe('خاقان فىدان');
    expect(enforceUyghurTerminology('لاتاقىيە ۋە لاتاكىيە')).toBe('لازىقىيە ۋە لازىقىيە');
    expect(enforceUyghurTerminology('ئۇ ۋاپات بولدى، بىر كىشى ئۆلدى، ئۈچ كىشى ئۆلتۈرۈلدى')).toBe(
      'ئۇ ھاياتىدىن ئايرىلدى، بىر كىشى ھاياتىدىن ئايرىلدى، ئۈچ كىشى ئۆلتۈرۈلدى'
    );
    expect(enforceUyghurTerminology('خۇسىيلار ھۇجۇم قىلدى')).toBe('ھۇسىيلار ھۇجۇم قىلدى');
  });

  it('TC-TM-10: خاس لوغەت قائىدىلىرىنى دەرھال تەتبىقلاش ۋە تاقاق قائىدىنى ئاتلاپ ئۆتۈش', () => {
    const customRules: GlossaryRule[] = [
      { id: 'c1', wrong: 'تەشكىلاتى', correct: 'قۇرۇلمىسى', enabled: true },
      { id: 'c2', wrong: 'بىرلەشمە تەشكىلاتى', correct: 'ئىتتىپاقى', enabled: true },
      { id: 'c3', wrong: 'سىناق سۆز', correct: 'ئۆزگەرتىلمىسۇن', enabled: false },
    ];

    // ئۇزۇن ئىبارە قىسقا ئىبارىدىن بۇرۇن ئالماشتۇرۇلىدۇ
    expect(enforceUyghurTerminology('بىرلەشمە تەشكىلاتى ۋە سىناق سۆز', customRules)).toBe(
      'ئىتتىپاقى ۋە سىناق سۆز'
    );

    const prompt = buildGlossaryPromptRules(customRules);
    expect(prompt).toContain('«بىرلەشمە تەشكىلاتى» ئەمەس، ھەر ۋاقىت «ئىتتىپاقى»');
    expect(prompt).not.toContain('سىناق سۆز');
  });

  it('TC-TM-11: applyGlossaryToAnalysis ئانالىزنىڭ ماۋزۇ، ئابزاس ۋە خۇلاسىسىنى دەرھال تۈزىتىدۇ', () => {
    const item: AnalysisItem = {
      id: 'a1',
      originalTitle: 'Test',
      uyghurTitle: 'خۇسىيلارنىڭ ئۇچقۇسىز ئايروپلان ھۇجۇمى',
      originalExcerpt: 'Test',
      uyghurExcerpt: 'ھاقان فىدان لاتاقىيە توغرىسىدا سۆزلىدى.',
      uyghurFullParagraphs: ['سۈرىيە پىرىزدېنتى بايانات بەردى.'],
      summaryParagraphs: ['بىر پۇقرا قوربان بولدى.'],
      keyTakeaways: ['ئامېرىكا قوشما شتاتلىرى پوزىتسىيە بىلدۈردى.'],
      sourceName: 'ئەلجەزىرە',
      sourceSiteUrl: 'https://www.aljazeera.net',
      articleUrl: 'https://www.aljazeera.net/1',
      language: 'ar',
      publishedAt: new Date().toISOString(),
      collectedAt: new Date().toISOString(),
      bookmarked: false,
    };

    const { updated, changed } = applyGlossaryToAnalysis(item);
    expect(changed).toBe(true);
    expect(updated.uyghurTitle).toBe('ھۇسىيلارنىڭ تىزگىن ئۇچقۇ ھۇجۇمى');
    expect(updated.uyghurExcerpt).toBe('خاقان فىدان لازىقىيە توغرىسىدا سۆزلىدى.');
    expect(updated.uyghurFullParagraphs?.[0]).toBe('سۈرىيە رەئىسى بايانات بەردى.');
    expect(updated.summaryParagraphs?.[0]).toBe('بىر پۇقرا ھاياتىدىن ئايرىلدى.');
    expect(updated.keyTakeaways?.[0]).toBe('ئامېرىكا پوزىتسىيە بىلدۈردى.');
  });
});
