import { describe, expect, it } from 'vitest';
import {
  GEOPOLITICAL_TOPICS,
  getTopicById,
  matchGeopoliticalTopic,
} from '../src/utils/topicFilter';

/**
 * 8 مەركىزىي گېئوسىياسىي تېما سۈزگۈچى يۇنىت تېستلىرى
 * (مۇستەقىل، ئەسلى كودقا دەخلى قىلمايدىغان تېستلار)
 */
describe('topicFilter — 8 گېئوسىياسىي تېما سۈزگۈچى', () => {
  it('TC-TF-01: بارلىق 8 گېئوسىياسىي تېما توغرا تەرتىپ بىلەن ئېنىقلىنىشى كېرەك', () => {
    expect(GEOPOLITICAL_TOPICS).toHaveLength(8);
    expect(GEOPOLITICAL_TOPICS.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('TC-TF-02: خەلقئارادىكى 4 چوڭ بوغۇز (ھورمۇز، بابۇلمەندەب، مالاككا، بوسفور) نى توغرا تونۇش', () => {
    const resEn = matchGeopoliticalTopic(
      'Maritime insurance surges in the Strait of Hormuz',
      'Tankers face delays across global chokepoints',
      'https://www.bbc.com/news/world-123'
    );
    expect(resEn.matched).toBe(true);
    expect(resEn.topicId).toBe('four-straits');

    const resAr = matchGeopoliticalTopic(
      'توترات الملاحة في مضيق باب المندب والبحر الأحمر',
      'تحليل استراتيجي حول أمن الممرات البحرية',
      'https://www.aljazeera.net/politics/2026/11/21/test'
    );
    expect(resAr.matched).toBe(true);
    expect(resAr.topicId).toBe('four-straits');
  });

  it('TC-TF-03: روسىيە-ئۇكرائىنا ئۇرۇشى تېمىسىنى ئۈچ تىلدا توغرا تونۇش', () => {
    const resTr = matchGeopoliticalTopic(
      'Rusya-Ukrayna cephesinde yeni stratejik denge',
      'Kiev ve Moskova arasında diplomatik baskı artıyor',
      'https://www.aa.com.tr/tr/analiz/rusya-ukrayna'
    );
    expect(resTr.matched).toBe(true);
    expect(resTr.topicId).toBe('russia-ukraine');
  });

  it('TC-TF-04: ئوتتۇرا شەرق ۋەزىيىتى ۋە دۆلەتلىرىدىكى ئۆزگىرىشنى تونۇش', () => {
    const resAr = matchGeopoliticalTopic(
      'تحولات جديدة في سوريا ولبنان وغزة',
      'قراءة في توازنات الشرق الأوسط',
      'https://www.alaraby.co.uk/politics/middle-east'
    );
    expect(resAr.matched).toBe(true);
    expect(resAr.topicId).toBe('middle-east');
  });

  it('TC-TF-05: خىتاي ۋەزىيىتى ۋە خەۋەرلىرىنى تونۇش', () => {
    const resEn = matchGeopoliticalTopic(
      'Beijing unveils new economic stimulus amid trade pressure',
      'Analysts assess China fiscal strategy',
      'https://www.theguardian.com/world/2026/11/21/china-economy'
    );
    expect(resEn.matched).toBe(true);
    expect(resEn.topicId).toBe('china-affairs');
  });

  it('TC-TF-06: ئامېرىكا-ئىران ئۇرۇشى ۋە جىددىيلىكىنى تونۇش', () => {
    const resEn = matchGeopoliticalTopic(
      'US-Iran tensions escalate after Persian Gulf standoff',
      'Tehran warns Washington over nuclear talks',
      'https://www.middleeasteye.net/news/us-iran-tensions'
    );
    expect(resEn.matched).toBe(true);
    expect(resEn.topicId).toBe('us-iran');
  });

  it('TC-TF-07: جەنۇبىي دېڭىز تېمىسىنى تونۇش', () => {
    const resTr = matchGeopoliticalTopic(
      'Güney Çin Denizi ve Hint-Pasifik hattında askeri hareketlilik',
      'Filipinler açıklarında yeni gerilim',
      'https://www.setav.org/guney-cin-denizi-analiz'
    );
    expect(resTr.matched).toBe(true);
    expect(resTr.topicId).toBe('south-china-sea');
  });

  it('TC-TF-08: ئوتتۇرا ئاسىيا خەۋەرلىرىنى تونۇش', () => {
    const resTr = matchGeopoliticalTopic(
      'Türk Devletleri Teşkilatı ve Orta Asya enerji koridoru',
      'Kazakistan ve Özbekistan yeni ulaşım anlaşması imzaladı',
      'https://www.trthaber.com/haber/dunya/orta-asya'
    );
    expect(resTr.matched).toBe(true);
    expect(resTr.topicId).toBe('central-asia');
  });

  it('TC-TF-09: شەرقىي تۈركىستان تېمىسىنى ئەڭ يۇقىرى ئالدىنلىق بىلەن تونۇش', () => {
    const resEn = matchGeopoliticalTopic(
      'UN experts raise renewed concerns over Uyghur rights in East Turkistan',
      'Report examines Beijing policies toward Uyghurs',
      'https://www.theguardian.com/world/uyghur-report'
    );
    expect(resEn.matched).toBe(true);
    expect(resEn.topicId).toBe('east-turkistan');
    expect(resEn.matchedTopicIds).toContain('china-affairs');
  });

  it('TC-TF-10: ئىجتىمائىي، ئائىلە ۋە تەنتەربىيە سەھىپىلىرىنى قەتئىي رەت قىلىش (Edge Case)', () => {
    const familyRes = matchGeopoliticalTopic(
      'شريك بلا طموح.. الحد الفاصل بين النجاح الوظيفي واستقرار الزوجية',
      'نصائح أسرية حول الحياة الزوجية',
      'https://www.aljazeera.net/family/2026/11/21/article'
    );
    expect(familyRes.matched).toBe(false);
    expect(familyRes.excludedReason).toBeTruthy();

    const sportRes = matchGeopoliticalTopic(
      'Premier League title race heats up after weekend derby',
      'Football highlights and standings',
      'https://www.bbc.com/sport/football/12345'
    );
    expect(sportRes.matched).toBe(false);
  });

  it('TC-TF-11: قۇرۇق مەزمۇن ۋە ئالاھىدە تاللانغان تېما تىزىملىكىنى توغرا بىر تەرەپ قىلىش (Edge Case)', () => {
    const emptyRes = matchGeopoliticalTopic('', '', '');
    expect(emptyRes.matched).toBe(false);

    const restricted = matchGeopoliticalTopic(
      'Kazakhstan hosts Central Asia summit',
      'Regional trade talks in Astana',
      'https://example.com/news',
      ['four-straits']
    );
    expect(restricted.matched).toBe(false);
  });

  it('TC-TF-12: getTopicById توغرا تېما قايتۇرىدۇ ياكى مەۋجۇت بولمىسا undefined قايتۇرىدۇ', () => {
    expect(getTopicById('east-turkistan')?.label).toBe('شەرقىي تۈركىستان');
    expect(getTopicById(undefined)).toBeUndefined();
  });
});
