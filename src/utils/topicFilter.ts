export type GeopoliticalTopicId =
  | 'four-straits'
  | 'russia-ukraine'
  | 'middle-east'
  | 'china-affairs'
  | 'us-iran'
  | 'south-china-sea'
  | 'central-asia'
  | 'east-turkistan';

export interface GeopoliticalTopic {
  id: GeopoliticalTopicId;
  order: number;
  label: string;
  shortLabel: string;
  description: string;
  keywords: string[];
}

/**
 * پەقەت مۇشۇ 8 مەركىزىي گېئوسىياسىي تېما بويىچە ئانالىزلار يىغىلىدۇ؛
 * ئىجتىمائىي، تۇرمۇش، تەنتەربىيە ۋە كۆڭۈل ئېچىش مەزمۇنلىرى سۈزۈپ چىقىرىۋېتىلىدۇ.
 */
export const GEOPOLITICAL_TOPICS: GeopoliticalTopic[] = [
  {
    id: 'four-straits',
    order: 1,
    label: 'خەلقئارادىكى 4 چوڭ بوغۇز',
    shortLabel: '4 چوڭ بوغۇز',
    description: 'ھورمۇز، بابۇلمەندەب، مالاككا، تۈرك بوغۇزلىرى ۋە سۇۋەيش دېڭىز يوللىرى',
    keywords: [
      'strait of hormuz', 'hormuz', 'bab el-mandeb', 'bab al-mandab', 'malacca',
      'bosphorus', 'bosporus', 'dardanelles', 'turkish straits', 'suez canal', 'red sea shipping',
      'chokepoint', 'maritime chokepoint',
      'مضيق هرمز', 'هرمز', 'باب المندب', 'مضيق ملقا', 'ملقا', 'البوسفور', 'الدردنيل',
      'قناة السويس', 'المضائق', 'البحر الأحمر', 'الملاحة',
      'hürmüz', 'babülmendep', 'malakka', 'istanbul boğazı', 'çanakkale boğazı',
      'türk boğazları', 'boğazlar', 'süveyş', 'kızıldeniz',
      'بوغۇز', 'ھورمۇز', 'بابۇلمەندەب', 'مالاككا', 'بوسفور', 'سۇۋەيش',
    ],
  },
  {
    id: 'russia-ukraine',
    order: 2,
    label: 'روسىيە-ئۇكرائىنا ئۇرۇشى',
    shortLabel: 'روسىيە-ئۇكرائىنا',
    description: 'ئۇكرائىنا ئالدىنقى سېپى، روسىيە ئىستراتېگىيەسى، ناتو ۋە ياۋروپا بىخەتەرلىكى',
    keywords: [
      'ukraine', 'ukrainian', 'kyiv', 'kiev', 'zelensky', 'zelenskyy', 'russia', 'russian',
      'putin', 'kremlin', 'moscow', 'donbas', 'donetsk', 'crimea', 'kharkiv', 'nato',
      'أوكرانيا', 'الأوكرانية', 'كييف', 'زيلينسكي', 'روسيا', 'الروسية', 'بوتين',
      'الكرملين', 'موسكو', 'القرم', 'دونباس', 'الناتو',
      'ukrayna', 'rusya', 'kiev', 'zelenski', 'zelenskiy', 'putin', 'kremlin', 'moskova',
      'kırım', 'donbas', 'nato',
      'ئۇكرائىنا', 'روسىيە', 'پۇتىن', 'زېلېنسكىي', 'كىيېۋ',
    ],
  },
  {
    id: 'middle-east',
    order: 3,
    label: 'ئوتتۇرا شەرق ۋەزىيىتى ۋە دۆلەتلىرىدىكى ئۆزگىرىش',
    shortLabel: 'ئوتتۇرا شەرق',
    description: 'پەلەستىن، غەززە، سۈرىيە، لىۋان، ئىراق، يەمەن، مىسىر ۋە پارس قولتۇقى دۆلەتلىرى',
    keywords: [
      'middle east', 'gaza', 'palestine', 'palestinian', 'israel', 'israeli', 'netanyahu',
      'syria', 'syrian', 'damascus', 'lebanon', 'beirut', 'hezbollah', 'iraq', 'baghdad',
      'yemen', 'houthi', 'saudi', 'riyadh', 'egypt', 'cairo', 'jordan', 'qatar', 'doha',
      'uae', 'gulf', 'hamas', 'west bank', 'jerusalem', 'kurdish', 'ankara',
      'الشرق الأوسط', 'غزة', 'فلسطين', 'إسرائيل', 'الاحتلال', 'سوريا', 'دمشق', 'لبنان',
      'بيروت', 'حزب الله', 'العراق', 'بغداد', 'اليمن', 'الحوثي', 'السعودية', 'مصر', 'القاهرة',
      'الأردن', 'قطر', 'الإمارات', 'الخليج', 'حماس', 'الضفة', 'القدس',
      'orta doğu', 'ortadoğu', 'gazze', 'filistin', 'israil', 'suriye', 'şam', 'lübnan',
      'beyrut', 'irak', 'bağdat', 'yemen', 'husi', 'suudi', 'mısır', 'ürdün', 'katar',
      'körfez', 'kudüs', 'batı şeria',
      'ئوتتۇرا شەرق', 'غەززە', 'پەلەستىن', 'سۈرىيە', 'لىۋان', 'ئىراق', 'يەمەن', 'سەئۇدى', 'مىسىر',
    ],
  },
  {
    id: 'china-affairs',
    order: 4,
    label: 'خىتاينىڭ ھەر قانداق ۋەزىيىتى ۋە خەۋەرلىرى',
    shortLabel: 'خىتاي ۋەزىيىتى',
    description: 'بېيجىڭ سىياسىتى، خىتاي ئىقتىسادى، ھەربىي ھەرىكەتلىرى، تەيۋەن ۋە دىپلوماتىيەسى',
    keywords: [
      'china', 'chinese', 'beijing', 'xi jinping', 'ccp', 'pla', 'taiwan', 'taipei',
      'hong kong', 'shanghai', 'yuan', 'renminbi', 'belt and road', 'bri', 'huawei',
      'الصين', 'الصينية', 'الصيني', 'بكين', 'شي جين بينغ', 'تايوان', 'هونغ كونغ',
      'الحزام والطريق', 'الحزب الشيوعي الصيني',
      'çin', 'pekin', 'şi cinping', 'xi jinping', 'tayvan', 'hong kong', 'kuşak ve yol',
      'خىتاي', 'بېيجىڭ', 'شى جىنپىڭ', 'تەيۋەن',
    ],
  },
  {
    id: 'us-iran',
    order: 5,
    label: 'ئامېرىكا-ئىران ئۇرۇشى',
    shortLabel: 'ئامېرىكا-ئىران',
    description: 'ئامېرىكا ۋە ئىران ئوتتۇرىسىدىكى ھەربىي توقۇنۇش، يادرو مەسىلىسى ۋە جازا تەدبىرلىرى',
    keywords: [
      'iran', 'iranian', 'tehran', 'khamenei', 'irgc', 'revolutionary guard', 'iran nuclear',
      'us-iran', 'u.s.-iran', 'iran war', 'iran strike', 'persian gulf', 'pezeshkian',
      'إيران', 'الإيرانية', 'الإيراني', 'طهران', 'خامنئي', 'الحرس الثوري', 'النووي الإيراني',
      'أمريكا وإيران', 'واشنطن وطهران',
      'iran', 'tahran', 'hamaney', 'devrim muhafızları', 'abd-iran', 'abd ve iran',
      'ئىران', 'تېھران', 'ئامېرىكا-ئىران', 'ئىنقىلابىي مۇھاپىزەتچى',
    ],
  },
  {
    id: 'south-china-sea',
    order: 6,
    label: 'جەنۇبىي دېڭىز',
    shortLabel: 'جەنۇبىي دېڭىز',
    description: 'جەنۇبىي دېڭىز ئىگىلىك ھوقۇق تالاش-تارتىشى، فىلىپپىن، سپراتلى ۋە ھىندى-تىنچ ئوكيان',
    keywords: [
      'south china sea', 'spratly', 'paracel', 'scarborough shoal', 'second thomas shoal',
      'philippines sea', 'west philippine sea', 'indo-pacific', 'asean maritime', 'nine-dash line',
      'بحر الصين الجنوبي', 'المحيطين الهندي والهادئ', 'الفلبين', 'سبراتلي',
      'güney çin denizi', 'hint-pasifik', 'filipinler',
      'جەنۇبىي دېڭىز', 'جەنۇبىي خىتاي دېڭىزى', 'فىلىپپىن', 'ھىندى-تىنچ ئوكيان',
    ],
  },
  {
    id: 'central-asia',
    order: 7,
    label: 'ئوتتۇرا ئاسىيا خەۋەرلىرى',
    shortLabel: 'ئوتتۇرا ئاسىيا',
    description: 'قازاقىستان، ئۆزبېكىستان، قىرغىزىستان، تاجىكىستان، تۈركمەنىستان ۋە تۈرك دۆلەتلىرى',
    keywords: [
      'central asia', 'kazakhstan', 'astana', 'almaty', 'tokayev', 'uzbekistan', 'tashkent',
      'mirziyoyev', 'kyrgyzstan', 'bishkek', 'tajikistan', 'dushanbe', 'turkmenistan',
      'ashgabat', 'turkic states', 'caspian', 'afghanistan', 'kabul', 'taliban', 'fergana',
      'آسيا الوسطى', 'كازاخستان', 'أوزبكستان', 'قيرغيزستان', 'طاجيكستان', 'تركمانستان',
      'طشقند', 'أستانا', 'الدول التركية', 'بحر قزوين', 'أفغانستان', 'كابل',
      'orta asya', 'kazakistan', 'özbekistan', 'kırgızistan', 'tacikistan', 'türkmenistan',
      'türk devletleri', 'taşkent', 'astana', 'bişkek', 'hazar', 'afganistan',
      'ئوتتۇرا ئاسىيا', 'قازاقىستان', 'ئۆزبېكىستان', 'قىرغىزىستان', 'تاجىكىستان', 'تۈركمەنىستان', 'ئافغانىستان',
    ],
  },
  {
    id: 'east-turkistan',
    order: 8,
    label: 'شەرقىي تۈركىستان',
    shortLabel: 'شەرقىي تۈركىستان',
    description: 'شەرقىي تۈركىستان ۋە ئۇيغۇرلارغا مۇناسىۋەتلىك خەلقئارالىق دوكلات، سىياسەت ۋە ئانالىزلار',
    keywords: [
      'east turkistan', 'east turkestan', 'uyghur', 'uyghurs', 'uighur', 'uighurs',
      'urumqi', 'kashgar', 'hotan', 'ghulja', 'turpan', 'forced labor', 'uflpa',
      'xinjiang', // مەنبەدىكى ئىنگلىزچە ئىزدەش ئۈچۈنلا؛ ئۇيغۇرچىغا چىققاندا دائىم «شەرقىي تۈركىستان» قىلىنىدۇ
      'تركستان الشرقية', 'الإيغور', 'الأويغور', 'الأيغور', 'أورومتشي', 'كاشغر',
      'doğu türkistan', 'uygur', 'uygurlar', 'urumçi', 'kaşgar',
      'شەرقىي تۈركىستان', 'ئۇيغۇر', 'ئۈرۈمچى', 'قەشقەر', 'خوتەن', 'غۇلجا',
    ],
  },
];

/**
 * ئىجتىمائىي، ئائىلە، تەنتەربىيە، كۆڭۈل ئېچىش قاتارلىق غەيرىي سىياسىي سەھىپىلەرنى قەتئىي چەكلەش
 */
const EXCLUDED_URL_PATTERNS: RegExp[] = [
  /\/family\//i,
  /\/lifestyle\//i,
  /\/sport(s)?\//i,
  /\/football\//i,
  /\/soccer\//i,
  /\/entertainment\//i,
  /\/celebrity\//i,
  /\/culture\//i,
  /\/arts?\//i,
  /\/music\//i,
  /\/film\//i,
  /\/movie(s)?\//i,
  /\/fashion\//i,
  /\/food\//i,
  /\/travel\//i,
  /\/health\//i,
  /\/wellness\//i,
  /\/recipe(s)?\//i,
  /\/lifeandstyle\//i,
  /\/magazin\//i,
  /\/yasam\//i,
  /\/spor\//i,
  /\/saglik\//i,
  /\/kultur-sanat\//i,
  /\/misc\//i,
  /\/ebusiness\//i,
  /\/women\//i,
];

const EXCLUDED_CONTENT_KEYWORDS: string[] = [
  'recipe', 'horoscope', 'premier league', 'champions league', 'world cup match',
  'box office', 'celebrity wedding', 'fashion week', 'weight loss', 'dating advice',
  'شريك بلا طموح', 'الزواج', 'الطلاق', 'ريجيم', 'كرة القدم', 'الدوري الإسباني', 'الدوري الإنجليزي',
  'مباراة', 'مسلسل', 'أفلام', 'طبخ', 'موضة', 'نصائح أسرية', 'تربية الأطفال',
  'süper lig', 'galatasaray', 'fenerbahçe', 'beşiktaş', 'magazin', 'dizi', 'yemek tarifi', 'burç',
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(text: string, keyword: string): boolean {
  const isLatin = /^[a-z0-9\s.-]+$/i.test(keyword);
  if (isLatin) {
    const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}($|[^a-z0-9])`, 'i');
    return regex.test(text);
  }
  return text.includes(keyword.toLowerCase());
}

export interface TopicMatchResult {
  matched: boolean;
  topicId?: GeopoliticalTopicId;
  topicLabel?: string;
  matchedTopicIds: GeopoliticalTopicId[];
  excludedReason?: string;
}

/**
 * ماقالىنىڭ ماۋزۇسى، قىسقىچە مەزمۇنى ۋە URL ئادرېسىنى تەھلىل قىلىپ،
 * پەقەت 8 گېئوسىياسىي تېمىغا ماس كېلىدىغانلارنىلا قوبۇل قىلىدۇ.
 */
export function matchGeopoliticalTopic(
  title: string,
  excerpt: string,
  articleUrl: string,
  enabledTopicIds?: GeopoliticalTopicId[]
): TopicMatchResult {
  const safeUrl = (articleUrl || '').trim();
  const combined = `${title || ''} ${excerpt || ''}`.toLowerCase();

  for (const pattern of EXCLUDED_URL_PATTERNS) {
    if (pattern.test(safeUrl)) {
      return {
        matched: false,
        matchedTopicIds: [],
        excludedReason: 'ئىجتىمائىي ياكى تەنتەربىيە سەھىپىسى',
      };
    }
  }

  for (const blocked of EXCLUDED_CONTENT_KEYWORDS) {
    if (containsKeyword(combined, blocked.toLowerCase())) {
      return {
        matched: false,
        matchedTopicIds: [],
        excludedReason: 'غەيرىي گېئوسىياسىي مەزمۇن',
      };
    }
  }

  const activeSet =
    enabledTopicIds && enabledTopicIds.length > 0 ? new Set(enabledTopicIds) : null;

  // ئالدىنئالا ئەڭ خاس تېمىلارنى (شەرقىي تۈركىستان، 4 چوڭ بوغۇز، جەنۇبىي دېڭىز، ئامېرىكا-ئىران) تەكشۈرۈش تەرتىپى
  const priorityOrder: GeopoliticalTopicId[] = [
    'east-turkistan',
    'four-straits',
    'south-china-sea',
    'us-iran',
    'russia-ukraine',
    'central-asia',
    'china-affairs',
    'middle-east',
  ];

  const matchedIds: GeopoliticalTopicId[] = [];

  for (const id of priorityOrder) {
    if (activeSet && !activeSet.has(id)) continue;
    const topic = GEOPOLITICAL_TOPICS.find((t) => t.id === id);
    if (!topic) continue;

    // ئامېرىكا-ئىران ئۈچۈن: ئىران بىلەن بىللە ئۇرۇش/ئامېرىكا/يادرو/ھۇجۇم ياكى بىۋاسىتە ئىران ئىبارىسى بولسۇن
    const hit = topic.keywords.some((kw) => containsKeyword(combined, kw.toLowerCase()));
    if (hit) {
      matchedIds.push(id);
    }
  }

  if (matchedIds.length === 0) {
    return {
      matched: false,
      matchedTopicIds: [],
      excludedReason: 'بەلگىلەنگەن 8 گېئوسىياسىي تېمىغا ماس كەلمىدى',
    };
  }

  const primaryId = matchedIds[0];
  const primaryTopic = GEOPOLITICAL_TOPICS.find((t) => t.id === primaryId)!;

  return {
    matched: true,
    topicId: primaryId,
    topicLabel: primaryTopic.label,
    matchedTopicIds: matchedIds,
  };
}

export function getTopicById(id?: GeopoliticalTopicId): GeopoliticalTopic | undefined {
  if (!id) return undefined;
  return GEOPOLITICAL_TOPICS.find((t) => t.id === id);
}
