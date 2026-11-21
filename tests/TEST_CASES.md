# تېست كېيسلەر تىزىملىكى (Test Cases) — «ئانالىزلار» پىروگىراممىسى

بۇ ھۆججەتتە `tests/` فولدېرى ئىچىدە يېزىلغان بارلىق **38 دانە** يۇنىت تېست كېيسىنىڭ ID، تەپسىلاتى، تۈرى ۋە مۆلچەرلەنگەن نەتىجىسى تولۇق كۆرسىتىلدى.

---

## 1. `tests/topicFilter.test.ts` — 8 گېئوسىياسىي تېما سۈزگۈچى (12 كېيس)

| Test Case ID | تۈرى | تەپسىلاتى (Description) | مۆلچەرلەنگەن نەتىجە (Expected Result) |
| :--- | :--- | :--- | :--- |
| `TC-TF-01` | Happy Path | `GEOPOLITICAL_TOPICS` تىزىملىكىنىڭ سانى ۋە تەرتىپىنى تەكشۈرۈش | جەمئىي 8 تېما، تەرتىپى `[1..8]` بولۇشى كېرەك |
| `TC-TF-02` | Happy Path | 4 چوڭ بوغۇز (Strait of Hormuz، مضيق باب المندب) ماقالىلىرىنى تونۇش | `matched: true`, `topicId: 'four-straits'` |
| `TC-TF-03` | Happy Path | تۈركچە روسىيە-ئۇكرائىنا ئانالىزىنى تونۇش | `matched: true`, `topicId: 'russia-ukraine'` |
| `TC-TF-04` | Happy Path | ئەرەبچە ئوتتۇرا شەرق (سۈرىيە، لىۋان، غەززە) ماقالىسىنى تونۇش | `matched: true`, `topicId: 'middle-east'` |
| `TC-TF-05` | Happy Path | ئىنگلىزچە خىتاي ئىقتىسادى ۋە بېيجىڭ سىياسىتىنى تونۇش | `matched: true`, `topicId: 'china-affairs'` |
| `TC-TF-06` | Happy Path | ئامېرىكا-ئىران جىددىيلىكى ۋە تېھران خەۋىرىنى تونۇش | `matched: true`, `topicId: 'us-iran'` |
| `TC-TF-07` | Happy Path | تۈركچە جەنۇبىي دېڭىز (Güney Çin Denizi) ئانالىزىنى تونۇش | `matched: true`, `topicId: 'south-china-sea'` |
| `TC-TF-08` | Happy Path | ئوتتۇرا ئاسىيا (قازاقىستان، ئۆزبېكىستان، تۈرك دۆلەتلىرى) نى تونۇش | `matched: true`, `topicId: 'central-asia'` |
| `TC-TF-09` | Happy Path | شەرقىي تۈركىستان ۋە ئۇيغۇر ھوقۇقى دوكلاتىنى ئەڭ يۇقىرى ئالدىنلىقتا تونۇش | `matched: true`, `topicId: 'east-turkistan'` |
| `TC-TF-10` | Edge Case | ئائىلە (`/family/`) ۋە تەنتەربىيە (`/sport/`) ماقالىلىرىنى چەكلەش | `matched: false` ۋە رەت سەۋەبى قايتۇرىدۇ |
| `TC-TF-11` | Edge Case | قۇرۇق كىرگۈزۈش ۋە تار تېما چەكلىمىسى (`['four-straits']`) | `matched: false` قايتۇرىدۇ |
| `TC-TF-12` | Edge Case | `getTopicById` توغرا ID ۋە `undefined` بىلەن چاقىرىلىشى | توغرا تېما ئوبيېكتى ياكى `undefined` قايتۇرىدۇ |

---

## 2. `tests/terminology.test.ts` — ئاتالغۇ، 15 ئىملا قائىدىسى، خاس لوغەت ۋە ۋاقىت-چېسلا (11 كېيس)

| Test Case ID | تۈرى | تەپسىلاتى (Description) | مۆلچەرلەنگەن نەتىجە (Expected Result) |
| :--- | :--- | :--- | :--- |
| `TC-TM-01` | Happy Path | چەكلەنگەن مۇستەملىكىچى ئاتالغۇلارنى مۇستەقىل ئاتالغۇلارغا ئالماشتۇرۇش | «شەرقىي تۈركىستان»، «خىتاي»، «خىتاي تىلى» قىلىپ قايتۇرىدۇ |
| `TC-TM-02` | Edge Case | قۇرۇق ياكى پاكىز ئۇيغۇرچە تېكىستنى ئۆزگەرتمەسلىك | ئەسلى قىممەت ئۆزگەرمەي قايتۇرىلىدۇ |
| `TC-TM-03` | Happy Path | `ar`, `en`, `tr` تىل كودلىرىنى ئۇيغۇرچە نامغا ئايلاندۇرۇش | `ئەرەبچە`، `ئىنگلىزچە`، `تۈركچە` |
| `TC-TM-04` | Happy Path | `formatUyghurDate` ئېنىق ئۇيغۇرچە چېسلا ۋە سائەت فورماتى | `2026-يىل 11-ئاينىڭ 21-كۈنى، 09:05` |
| `TC-TM-05` | Error Case | ناتوغرا ۋاقىت تېكىستى (`invalid-date-string`) | چۈشۈپ كەتمەي ئەسلى تېكىست / قۇرۇق تېكىست قايتۇرىدۇ |
| `TC-TM-06` | Happy Path | `getRelativeDayBadge` ۋە `getLocalDateKey` كۈن پەرقلەندۈرۈش | `بۈگۈن`، `تۈنۈگۈن`، `2026-11-15` ۋە `2026-11-21` |
| `TC-TM-07` | Happy Path / Edge | `shouldRunDailyRefresh` يېڭى كۈن، قىسقا ئارىلىق، ئۇزۇن ئارىلىق ۋە `null` | يېڭى كۈن/ۋاقىت توشقاندا `true`، يېقىندا يېڭىلانغاندا `false` |
| `TC-TM-08` | Happy Path / Error | `extractDomain` توغرا ۋە ناتوغرا URL ئادرېسلىرى | `www.` چىقىرىۋېتىلگەن دائىرە نامى ياكى ئەسلى تېكىست |
| `TC-TM-09` | Happy Path | بارلىق 15 مۇقىم ئىملا قائىدىسى (تىزگىن ئۇچقۇ، سۈرىيە ئەمەلدارلىرى، خاقان فىدان، لازىقىيە، ھاياتىدىن ئايرىلدى، ھۇسىيلار...) | 15 قائىدە تولۇق ۋە توغرا ئالماشتۇرىدۇ، «ئۆلتۈرۈلدى» نى بۇزمايدۇ |
| `TC-TM-10` | Happy Path / Edge | خاس لوغەت قائىدىلىرىنى ئۇزۇنلۇق تەرتىپى بويىچە تەتبىقلاش ۋە تاقاق قائىدىنى ئاتلاپ ئۆتۈش | ئاكتىپ خاس قائىدىلەر دەرھال تەتبىقلىنىدۇ، تاقاق قائىدە ئۆزگەرتىلمەيدۇ |
| `TC-TM-11` | Happy Path | `applyGlossaryToAnalysis` پۈتۈن ئانالىز ئوبيېكتىنى دەرھال توغرىلاش | ماۋزۇ، تەرجىمە، ئابزاس، خۇلاسە ۋە يادرولۇق نۇقتىلار دەرھال تۈزىتىلىدۇ |

---

## 3. `tests/feedHelpers.test.ts` — RSS / Atom ياردەمچى فۇنكسىيەلىرى (5 كېيس)

| Test Case ID | تۈرى | تەپسىلاتى (Description) | مۆلچەرلەنگەن نەتىجە (Expected Result) |
| :--- | :--- | :--- | :--- |
| `TC-FH-01` | Happy Path | CDATA، HTML بەلگىلىرى ۋە مەخسۇس ھەرپ كودلىرىنى پاكىزلاش | پاكىز، ئارتۇق بوشلۇقسىز تېكىست قايتۇرىدۇ |
| `TC-FH-02` | Edge Case | قۇرۇق تېكىست ۋە چەكتىن ئاشقان Unicode كودلىرى (`&#99999999;`) | خاتالىق چىقارماي بىخەتەر پاكىزلايدۇ |
| `TC-FH-03` | Happy Path / Edge | `extractTextValue` تېكىست، سان، `#text`, `@_href`, `null` | توغرا تېكىست قىممىتى ياكى `""` قايتۇرىدۇ |
| `TC-FH-04` | Happy Path / Edge | `extractLink` RSS تېكىست، Atom تىزىملىك (`alternate`)، `guid` ۋە زاپاس | توغرا `https://...` ئۇلانمىسى ياكى `fallbackSite` |
| `TC-FH-05` | Happy Path / Error | `safeIsoDate` RFC2822، ناتوغرا تېكىست ۋە `undefined` | ئۆلچەملىك ISO ۋاقىت ياكى `fallbackNow` قايتۇرىدۇ |

---

## 4. `tests/storage.test.ts` — يەرلىك تەڭشەك، خاس لوغەت، OpenRouter ئاچقۇچى ۋە MV3 (6 كېيس)

| Test Case ID | تۈرى | تەپسىلاتى (Description) | مۆلچەرلەنگەن نەتىجە (Expected Result) |
| :--- | :--- | :--- | :--- |
| `TC-ST-01` | Happy Path | قۇرۇق `localStorage` دا `loadAppSettings` نىڭ سۈكۈتتىكى قىممەت قايتۇرۇشى | `DEFAULT_SETTINGS` (8 تېما، تەرجىمە ئاكتىپ) قايتۇرىدۇ |
| `TC-ST-02` | Happy Path | خاس تەڭشەكلەرنى ساقلاش (`saveAppSettings`) ۋە قايتا ئوقۇش | ساقلانغان قىممەت ئەينەن قايتىپ كېلىدۇ |
| `TC-ST-03` | Error Case | بۇزۇلغان JSON، مەنپىي سائەت ئارىلىقى ۋە ناتوغرا ماتور نامى | سۈكۈتتىكى بىخەتەر قىممەتلەرگە ئاپتوماتىك ئەسلىگە قايتىدۇ |
| `TC-ST-04` | Security / Edge | `buildChromeManifestV3Json` قېلىپىنى تەكشۈرۈش | `manifest_version: 3`، `<all_urls>` يوق، خىتاي تور دائىرىسى يوق |
| `TC-ST-05` | Happy Path / Edge | `saveOpenRouterKey`, `loadOpenRouterKey`, `clearOpenRouterKey` | بوشلۇقلارنى قىرقىپ ساقلايدۇ، قۇرۇق/ئۆچۈرۈلگەندە تولۇق تازىلايدۇ |
| `TC-ST-06` | Happy Path / Error | `saveCustomGlossaryRules`, `loadCustomGlossaryRules` | خاس لوغەت قائىدىلىرىنى ساقلايدۇ، بۇزۇلغان JSON دا بىخەتەر `[]` قايتۇرىدۇ |

---

## 5. `tests/telegramFormat.test.ts` — تېلېگرامما فورماتى ۋە بۆلۈش (4 كېيس)

| Test Case ID | تۈرى | تەپسىلاتى (Description) | مۆلچەرلەنگەن نەتىجە (Expected Result) |
| :--- | :--- | :--- | :--- |
| `TC-TG-01` | Security / Edge | `escapeTelegramHtml` ئارقىلىق `&`, `<`, `>` بەلگىلىرىنى قوغداش | `&amp;`, `&lt;`, `&gt;` غا ئايلاندۇرۇپ، قۇرۇق تېكىستتە `""` قايتۇرىدۇ |
| `TC-TG-02` | Happy Path | `formatAnalysisForTelegram` ماۋزۇ، بارلىق ئابزاسلار، يادرولۇق نۇقتا، مەنبە ۋە ئۇلانما | تولۇق ئۇيغۇرچە HTML تېكىستى (`<b>مەنبەسى:</b>`, `<b>ئۇلانما ئادرېسى:</b>` قاتارلىق) قايتۇرىدۇ |
| `TC-TG-03` | Security / Terminology | تېلېگرامما تېكىستىدە چەكلەنگەن مۇستەملىكىچى سۆزنى تازىلاش | چەكلەنگەن سۆز چىقىرىۋېتىلىپ «شەرقىي تۈركىستان» قىلىپ ئالماشتۇرۇلىدۇ |
| `TC-TG-04` | Edge Case | `splitTelegramMessage` ئۇزۇن تولۇق تەرجىمىلەرنى 4096 چەكلىمىسى بويىچە پارچىلاش | ھەر بىر بۆلەك چەكلىمىدىن ئاشمايدۇ؛ قۇرۇق تېكىستتە `[]` قايتۇرىدۇ |
