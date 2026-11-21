import type { AnalysisItem, GlossaryRule } from '../types';

/**
 * 15 مۇقىم تەھرىرلىك ۋە ئىملا-ئاتالغۇ قائىدىلىرى (ئۇيغۇرچە تەرجىمە ۋە خۇلاسە ئۈچۈن).
 * بارلىق تېكىستلەر، AI تەرجىمىلىرى، خۇلاسىلەر ۋە تېلېگرامما ئۇچۇرلىرىغا قاتتىق تەتبىقلىنىدۇ.
 */
export interface BuiltInOrthographyRule {
  order: number;
  id: string;
  wrongLabel: string;
  correctLabel: string;
  note?: string;
  patterns: Array<[RegExp, string]>;
}

const P_COL_ET = /\u0634\u0649\u0646\u062c\u0627\u06ad/gu;
const P_COL_CN = /\u062c\u06c7\u06ad\u06af\u0648/gu;
const P_COL_LANG = /\u062e\u06d5\u0646\u0632\u06c7\u0686\u06d5/gu;
const P_COL_PEOPLE = /\u062e\u06d5\u0646\u0632\u06c7/gu;
const P_COL_ALT = /\u0634\u0649\u0646\u0644\u0627\u06ad/gu;

export const BUILTIN_ORTHOGRAPHY_RULES: BuiltInOrthographyRule[] = [
  {
    order: 1,
    id: 'rule-01-terminology-independence',
    wrongLabel: 'مۇستەملىكىچى ئاتالغۇلار',
    correctLabel: 'خىتاي / شەرقىي تۈركىستان / خىتاي تىلى',
    note: 'ئاتالغۇ مۇستەقىللىقى پرىنسىپى',
    patterns: [
      [P_COL_ET, 'شەرقىي تۈركىستان'],
      [P_COL_CN, 'خىتاي'],
      [P_COL_LANG, 'خىتاي تىلى'],
      [P_COL_PEOPLE, 'خىتاي'],
      [P_COL_ALT, 'خىتاي'],
    ],
  },
  {
    order: 2,
    id: 'rule-02-usa',
    wrongLabel: 'ئامېرىكا قوشما شتاتلىرى',
    correctLabel: 'ئامېرىكا',
    patterns: [
      [/ئامېرىكا\s+قوشما\s+(?:ئىشتاتلىرى|شتاتلىرى)/gu, 'ئامېرىكا'],
    ],
  },
  {
    order: 3,
    id: 'rule-03-uae',
    wrongLabel: 'ئەرەب بىرلەشمە خەلىپىسى',
    correctLabel: 'ئەرەب بىرلەشمە ئەمىرلىكى',
    patterns: [
      [/ئەرەب\s+بىرلەشمە\s+(?:خەلىپىلىكى|خەلىپىسى)/gu, 'ئەرەب بىرلەشمە ئەمىرلىكى'],
    ],
  },
  {
    order: 4,
    id: 'rule-04-drone',
    wrongLabel: 'ئۇچقۇسىز / ئۇچقۇسىز ئايروپلان',
    correctLabel: 'تىزگىن ئۇچقۇ',
    note: 'مەسىلەن: «تىزگىن ئۇچقۇ ھۇجۇمى»',
    patterns: [
      [/ئۇچقۇسىز\s+(?:ئايروپىلان|ئايروپلان|ئۇچقۇ|ئۇچۇش\s+ئاپپاراتى)/gu, 'تىزگىن ئۇچقۇ'],
      [/ئۇچقۇسىز/gu, 'تىزگىن ئۇچقۇ'],
    ],
  },
  {
    order: 5,
    id: 'rule-05-iran-pakistan',
    wrongLabel: 'ئىران ئىسلام جۇمھۇرىيىتى / پاكىستان ئىسلام جۇمھۇرىيىتى',
    correctLabel: 'ئىران / پاكىستان',
    patterns: [
      [/ئىران\s+ئىسلام\s+جۇمھۇرىيىتى/gu, 'ئىران'],
      [/پاكىستان\s+ئىسلام\s+جۇمھۇرىيىتى/gu, 'پاكىستان'],
    ],
  },
  {
    order: 6,
    id: 'rule-06-shia',
    wrongLabel: 'شىيئە مۇسۇلمانلىرى',
    correctLabel: 'شىيئە',
    patterns: [
      [/(?:شىيئە|شىئە)\s+مۇسۇلمانلىرى/gu, 'شىيئە'],
    ],
  },
  {
    order: 7,
    id: 'rule-07-syria-defense-minister',
    wrongLabel: 'مۇرھەف ئەبۇ قەسرە / مرهف أبو قصرة',
    correctLabel: 'سۈرىيە دۆلەت مۇداپىئە مىنىستىرى مۇرھىپ ئەبۇ قەسرا',
    note: 'ئەرەبچە: مرهف أبو قصرة',
    patterns: [
      [
        /(?:سۈرىيە\s+(?:دۆلەت\s+)?مۇداپىئە\s+مىنىستىرى\s+)?(?:مۇرھەف|مۇرھەپ|مۇرھىف|مۇرھىپ)\s+ئەبۇ\s+(?:قەسرە|قەسرا|قاسىرە|قاسرا)/gu,
        'سۈرىيە دۆلەت مۇداپىئە مىنىستىرى مۇرھىپ ئەبۇ قەسرا',
      ],
      [/مرهف\s+أبو\s+قصرة/gu, 'سۈرىيە دۆلەت مۇداپىئە مىنىستىرى مۇرھىپ ئەبۇ قەسرا'],
    ],
  },
  {
    order: 8,
    id: 'rule-08-syria-leader',
    wrongLabel: 'سۈرىيە پىرىزدېنتى / سۈرىيە پرېزىدېنتى',
    correctLabel: 'سۈرىيە رەئىسى',
    note: '«پىرىزدېنت» سۆزى سۈرىيە ئۈچۈن ئىشلىتىلمەيدۇ',
    patterns: [
      [
        /سۈرىيە(?:نىڭ)?\s+(?:پىرىزدېنتى|پرېزىدېنتى|پىرېزىدېنتى|پىرىزىدېنتى|پىرېزدېنتى)/gu,
        'سۈرىيە رەئىسى',
      ],
    ],
  },
  {
    order: 9,
    id: 'rule-09-syria-justice-minister',
    wrongLabel: 'مەزھەر ئەلۋەيس / مظهر الويس',
    correctLabel: 'سۈرىيە ئەدىلىيە مىنىستىرى مۇزھىر ئەلھۇۋەيس',
    note: 'ئەرەبچە: مظهر الويس',
    patterns: [
      [
        /(?:سۈرىيە\s+(?:ئەدلىيە|ئەدىلىيە)\s+مىنىستىرى\s+)?(?:مەزھەر|مۇزھىر|مەزھىر|مۇزھەر)\s+(?:ئەلۋەيس|ئەلۋېيس|ئەلھۇۋەيس|ۋەيس|ئەل-ۋەيس)/gu,
        'سۈرىيە ئەدىلىيە مىنىستىرى مۇزھىر ئەلھۇۋەيس',
      ],
      [/مظهر\s+الويس/gu, 'سۈرىيە ئەدىلىيە مىنىستىرى مۇزھىر ئەلھۇۋەيس'],
    ],
  },
  {
    order: 10,
    id: 'rule-10-syria-chief-of-staff',
    wrongLabel: 'ئەلى نەئسان / علي النعسان',
    correctLabel: 'سۈرىيە باش شتاب باشلىقى ئەلى ئەننەئسان',
    note: 'ئەرەبچە: علي النعسان',
    patterns: [
      [
        /(?:سۈرىيە\s+باش\s+(?:شتاب|ئىشتاب)\s+باشلىقى\s+)?ئەلى\s+(?:ئەننەئسان|ئەلنەئسان|ئەن-نەئسان|ئەل-نەئسان|نەئسان|نەسان)/gu,
        'سۈرىيە باش شتاب باشلىقى ئەلى ئەننەئسان',
      ],
      [/علي\s+النعسان/gu, 'سۈرىيە باش شتاب باشلىقى ئەلى ئەننەئسان'],
    ],
  },
  {
    order: 11,
    id: 'rule-11-syria-foreign-minister',
    wrongLabel: 'سۈرىيە ئەرەب جۇمھۇرىيىتى تاشقى ئىشلار ۋە چەتئەللىكلەر مىنىستىرلىكى',
    correctLabel: 'سۈرىيە تاشقى ئىشلار مىنىستىرى',
    note: 'مىنىستىرلىك ئىسمى ئەمەس، ئەمەلدارنى كۆرسىتىدۇ',
    patterns: [
      [
        /سۈرىيە\s+(?:ئەرەب\s+جۇمھۇرىيىتى\s+)?تاشقى\s+ئىشلار\s+(?:ۋە\s+چەتئەللىكلەر\s+)?مىنىستىرلىكى/gu,
        'سۈرىيە تاشقى ئىشلار مىنىستىرى',
      ],
    ],
  },
  {
    order: 12,
    id: 'rule-12-hakan-fidan',
    wrongLabel: 'ھاقان فىدان',
    correctLabel: 'خاقان فىدان',
    note: 'تۈركىيە تاشقى ئىشلار مىنىستىرى',
    patterns: [
      [/(?:ھاقان|خاقان)\s+(?:فىدان|فېدان)/gu, 'خاقان فىدان'],
    ],
  },
  {
    order: 13,
    id: 'rule-13-latakia',
    wrongLabel: 'لاتاقىيە / لاتاكىيە',
    correctLabel: 'لازىقىيە',
    note: 'ئەرەبچە: اللاذقية',
    patterns: [
      [/(?:لاتاقىيە|لاتاكىيە|لازاقىيە)/gu, 'لازىقىيە'],
    ],
  },
  {
    order: 14,
    id: 'rule-14-passed-away',
    wrongLabel: 'ئۆلدى / ۋاپات بولدى / قوربان بولدى',
    correctLabel: 'ھاياتىدىن ئايرىلدى',
    note: 'ئۆلتۈرۈلگەن بولسا «ئۆلتۈرۈلدى» پېتى ساقلىنىدۇ',
    patterns: [
      [/(?:ۋاپات|قوربان|قۇربان)\s+بولدى/gu, 'ھاياتىدىن ئايرىلدى'],
      [/(?<!\p{L})ئۆلدى(?!\p{L})/gu, 'ھاياتىدىن ئايرىلدى'],
    ],
  },
  {
    order: 15,
    id: 'rule-15-houthis',
    wrongLabel: 'خۇسىيلار / خۇسىي',
    correctLabel: 'ھۇسىيلار / ھۇسىي',
    patterns: [
      [/خۇسىيلار/gu, 'ھۇسىيلار'],
      [/خۇسىي/gu, 'ھۇسىي'],
    ],
  },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * ئاتالغۇ مۇستەقىللىقى ۋە بارلىق ئىملا-لوغەت قائىدىلىرىنى تەتبىقلاش فۇنكسىيەسى:
 * 1) 15 مۇقىم ئىملا قائىدىسى
 * 2) ئىشلەتكۈچى «لوغەت ۋە ئىملا» دىن قوشقان خاس تۈزىتىشلەر (ئۇزۇن ئىبارىدىن قىسقىغا قاراپ)
 */
export function enforceUyghurTerminology(
  input: string,
  customRules?: GlossaryRule[]
): string {
  if (!input) return input;
  let result = input;

  // 1. 15 مۇقىم ئىملا قائىدىسى
  for (const rule of BUILTIN_ORTHOGRAPHY_RULES) {
    for (const [pattern, replacement] of rule.patterns) {
      result = result.replace(pattern, replacement);
    }
  }

  // 2. ئىشلەتكۈچى قوشقان خاس لوغەت قائىدىلىرى (دەرھال ئىشلەيدۇ)
  if (Array.isArray(customRules) && customRules.length > 0) {
    const activeSorted = customRules
      .filter((r) => r && r.enabled && typeof r.wrong === 'string' && r.wrong.trim().length > 0)
      .sort((a, b) => b.wrong.trim().length - a.wrong.trim().length);

    for (const rule of activeSorted) {
      const wrong = rule.wrong.trim();
      const correct = (rule.correct || '').trim();
      if (!wrong || wrong === correct) continue;
      const pattern = new RegExp(escapeRegExp(wrong), 'gu');
      result = result.replace(pattern, correct);
    }
  }

  return result;
}

/**
 * سۈنئىي ئەقىل تەرجىمە ۋە خۇلاسە بۇيرۇقى (System Instruction) ئۈچۈن
 * بارلىق 15 مۇقىم ئىملا قائىدىسى + ئىشلەتكۈچى قوشقان خاس لوغەت قائىدىلىرىنى تەييارلايدۇ.
 */
export function buildGlossaryPromptRules(customRules?: GlossaryRule[]): string {
  const lines: string[] = [
    'ئىملا ۋە ئاتالغۇ مەجبۇرىي قائىدىلىرى (بىرمۇبىر قاتتىق ئەمەل قىل):',
    '1. مۇستەملىكىچى ئاتالغۇلارنى قەتئىي ئىشلەتمە؛ دائىم پەقەت «خىتاي»، «شەرقىي تۈركىستان»، «خىتاي تىلى» دەپ ياز.',
    '2. «ئامېرىكا قوشما شتاتلىرى» دېمە، دائىم «ئامېرىكا» دەپ ياز.',
    '3. «ئەرەب بىرلەشمە خەلىپىسى» دېمە، دائىم «ئەرەب بىرلەشمە ئەمىرلىكى» دەپ ياز.',
    '4. «ئۇچقۇسىز» ياكى «ئۇچقۇسىز ئايروپلان» دېمە؛ ھەر ۋاقىت «تىزگىن ئۇچقۇ» دەپ ياز (مەسىلەن: «تىزگىن ئۇچقۇ ھۇجۇمى»).',
    '5. «ئىران ئىسلام جۇمھۇرىيىتى» ئەمەس، «ئىران»؛ «پاكىستان ئىسلام جۇمھۇرىيىتى» ئەمەس، «پاكىستان» دەپ ياز.',
    '6. «شىيئە مۇسۇلمانلىرى» ئەمەس، «شىيئە» دەپ ياز.',
    '7. سۈرىيە دۆلەت مۇداپىئە مىنىستىرى (مرهف أبو قصرة) تىلغا ئېلىنسا ھەر ۋاقىت «سۈرىيە دۆلەت مۇداپىئە مىنىستىرى مۇرھىپ ئەبۇ قەسرا» دەپ ياز.',
    '8. «سۈرىيە پىرىزدېنتى» ياكى «پرېزىدېنت» سۆزىنى سۈرىيە ئۈچۈن قەتئىي ئىشلەتمە؛ ھەر ۋاقىت «سۈرىيە رەئىسى» دەپ ياز.',
    '9. سۈرىيە ئەدىلىيە مىنىستىرى (مظهر الويس) تىلغا ئېلىنسا ھەر ۋاقىت «سۈرىيە ئەدىلىيە مىنىستىرى مۇزھىر ئەلھۇۋەيس» دەپ ياز.',
    '10. سۈرىيە باش شتاب باشلىقى (علي النعسان) تىلغا ئېلىنسا ھەر ۋاقىت «سۈرىيە باش شتاب باشلىقى ئەلى ئەننەئسان» دەپ ياز.',
    '11. «سۈرىيە ئەرەب جۇمھۇرىيىتى تاشقى ئىشلار ۋە چەتئەللىكلەر مىنىستىرلىكى» ئەمەس، «سۈرىيە تاشقى ئىشلار مىنىستىرى» دەپ ياز.',
    '12. تۈركىيە تاشقى ئىشلار مىنىستىرى «ھاقان فىدان» ئەمەس، «خاقان فىدان» دەپ ياز.',
    '13. «لاتاقىيە» ياكى «لاتاكىيە» ئەمەس، ھەر ۋاقىت «لازىقىيە» (اللاذقية) دەپ ياز.',
    '14. ئادەم ئۆلگەن بولسا «ئۆلدى»، «ۋاپات بولدى» ياكى «قوربان بولدى» دېمە، ھەر ۋاقىت «ھاياتىدىن ئايرىلدى» دەپ ياز؛ ئۆلتۈرۈلگەن بولسا «ئۆلتۈرۈلدى» دەپ ياز.',
    '15. «خۇسىيلار» ئەمەس، ھەر ۋاقىت «ھۇسىيلار» دەپ ياز.',
  ];

  if (Array.isArray(customRules) && customRules.length > 0) {
    const active = customRules.filter(
      (r) => r && r.enabled && typeof r.wrong === 'string' && r.wrong.trim().length > 0
    );
    if (active.length > 0) {
      lines.push('ئىشلەتكۈچى قوشقان خاس لوغەت ۋە ئىملا تۈزىتىشلىرى:');
      for (const rule of active) {
        const noteText = rule.note?.trim() ? ` (${rule.note.trim()})` : '';
        lines.push(`- «${rule.wrong.trim()}» ئەمەس، ھەر ۋاقىت «${(rule.correct || '').trim()}» دەپ ياز${noteText}.`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * بىر ئانالىز كارتىسىدىكى بارلىق ئۇيغۇرچە مەزمۇنلارغا لوغەت ۋە ئىملا قائىدىلىرىنى دەرھال تەتبىقلايدۇ.
 */
export function applyGlossaryToAnalysis(
  item: AnalysisItem,
  customRules?: GlossaryRule[]
): { updated: AnalysisItem; changed: boolean } {
  let changed = false;

  const fixStr = (val?: string): string | undefined => {
    if (typeof val !== 'string' || !val) return val;
    const next = enforceUyghurTerminology(val, customRules);
    if (next !== val) changed = true;
    return next;
  };

  const fixArr = (arr?: string[]): string[] | undefined => {
    if (!Array.isArray(arr)) return arr;
    let arrChanged = false;
    const next = arr.map((entry) => {
      const fixed = enforceUyghurTerminology(entry, customRules);
      if (fixed !== entry) arrChanged = true;
      return fixed;
    });
    if (arrChanged) changed = true;
    return arrChanged ? next : arr;
  };

  const updated: AnalysisItem = {
    ...item,
    uyghurTitle: fixStr(item.uyghurTitle),
    uyghurExcerpt: fixStr(item.uyghurExcerpt),
    uyghurFullParagraphs: fixArr(item.uyghurFullParagraphs),
    summaryParagraphs: fixArr(item.summaryParagraphs),
    keyTakeaways: fixArr(item.keyTakeaways),
    topic: fixStr(item.topic),
    notes: fixStr(item.notes),
  };

  return { updated, changed };
}

export function getLanguageLabel(lang: 'ar' | 'en' | 'tr'): string {
  switch (lang) {
    case 'ar':
      return 'ئەرەبچە';
    case 'en':
      return 'ئىنگلىزچە';
    case 'tr':
      return 'تۈركچە';
  }
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ئېنىق ئۇيغۇرچە چېسلا ۋە ۋاقىت فورماتى:
 * مەسىلەن: 2026-يىل 11-ئاينىڭ 21-كۈنى، 09:25
 */
export function formatUyghurDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-يىل ${month}-ئاينىڭ ${day}-كۈنى، ${hours}:${minutes}`;
}

/**
 * بۈگۈن / تۈنۈگۈن / ئېنىق كۈن بەلگىسىنى قايتۇرىدۇ
 */
export function getRelativeDayBadge(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const targetKey = getLocalDateKey(date);
  const todayKey = getLocalDateKey(now);
  if (targetKey === todayKey) return 'بۈگۈن';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (targetKey === getLocalDateKey(yesterday)) return 'تۈنۈگۈن';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function shouldRunDailyRefresh(
  lastFetchedIso: string | null,
  intervalHours: number,
  now: Date = new Date()
): boolean {
  if (!lastFetchedIso) return true;
  const last = new Date(lastFetchedIso);
  if (Number.isNaN(last.getTime())) return true;
  // ئەگەر يېڭى كۈنگە ئۆتكەن بولسا دەرھال يېڭىلاش
  if (getLocalDateKey(last) !== getLocalDateKey(now)) {
    return true;
  }
  const safeHours = Math.max(1, intervalHours);
  const diffMs = now.getTime() - last.getTime();
  return diffMs >= safeHours * 60 * 60 * 1000;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
