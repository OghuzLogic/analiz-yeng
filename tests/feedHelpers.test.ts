import { describe, expect, it } from 'vitest';
import {
  decodeHtmlEntities,
  extractLink,
  extractTextValue,
  safeIsoDate,
} from '../src/utils/feedHelpers';

/**
 * RSS / Atom XML تېكىست پاكىزلاش، ئۇلانما ئېلىش ۋە ۋاقىت ئانالىز يۇنىت تېستلىرى
 */
describe('feedHelpers — RSS/Atom ياردەمچى فۇنكسىيەلىرى', () => {
  it('TC-FH-01: HTML بەلگىلىرى، CDATA ۋە مەخسۇس ھەرپ كودلىرىنى پاكىزلاش', () => {
    const raw = '<![CDATA[<p>US &amp; Iran &#39;talks&#39; &nbsp; in <b>Geneva</b>&#x2014;update</p>]]>';
    expect(decodeHtmlEntities(raw)).toBe("US & Iran 'talks' in Geneva —update");
  });

  it('TC-FH-02: قۇرۇق ياكى چەكتىن ئاشقان Unicode كودلىرىدا چۈشۈپ كەتمەسلىك (Edge Case)', () => {
    expect(decodeHtmlEntities('')).toBe('');
    expect(decodeHtmlEntities('Test &#99999999; &#xFFFFFFF; end')).toBe('Test end');
  });

  it('TC-FH-03: extractTextValue تۈرلۈك XML ئوبيېكتلىرىدىن تېكىست چىقىرىشى كېرەك', () => {
    expect(extractTextValue('Simple Title')).toBe('Simple Title');
    expect(extractTextValue(2026)).toBe('2026');
    expect(extractTextValue({ '#text': '<b>Nested</b> Title' })).toBe('Nested Title');
    expect(extractTextValue({ '@_href': ' https://example.com/post ' })).toBe(
      'https://example.com/post'
    );
    expect(extractTextValue(null)).toBe('');
  });

  it('TC-FH-04: extractLink تۈرلۈك RSS ۋە Atom ئۇلانما شەكىللىرىنى توغرا تېپىشى كېرەك', () => {
    // RSS تېكىست ئۇلانمىسى
    expect(extractLink({ link: 'https://www.aa.com.tr/tr/analiz/1' }, 'https://aa.com.tr')).toBe(
      'https://www.aa.com.tr/tr/analiz/1'
    );

    // Atom تىزىملىك ئۇلانمىسى (alternate نى تاللاش)
    expect(
      extractLink(
        {
          link: [
            { '@_rel': 'enclosure', '@_href': 'https://cdn.example.com/img.jpg' },
            { '@_rel': 'alternate', '@_href': 'https://www.theguardian.com/world/story' },
          ],
        },
        'https://www.theguardian.com'
      )
    ).toBe('https://www.theguardian.com/world/story');

    // guid ئارقىلىق زاپاس تېپىش
    expect(extractLink({ guid: 'https://www.brookings.edu/articles/test' }, 'https://fallback.org')).toBe(
      'https://www.brookings.edu/articles/test'
    );

    // ھېچقانداق ئۇلانما يوق ئەھۋالدا ئەسلى تور بەتنى قايتۇرۇش
    expect(extractLink({}, 'https://www.setav.org')).toBe('https://www.setav.org');
  });

  it('TC-FH-05: safeIsoDate توغرا ۋە ناتوغرا ۋاقىت فورماتلىرىنى بىخەتەر ئايلاندۇرۇشى كېرەك', () => {
    const fixedFallback = new Date('2026-11-21T10:00:00.000Z');
    expect(safeIsoDate('Sat, 21 Nov 2026 08:30:00 GMT', fixedFallback)).toBe(
      '2026-11-21T08:30:00.000Z'
    );
    expect(safeIsoDate('not-a-valid-date', fixedFallback)).toBe('2026-11-21T10:00:00.000Z');
    expect(safeIsoDate(undefined, fixedFallback)).toBe('2026-11-21T10:00:00.000Z');
  });
});
