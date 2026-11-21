import { useState } from 'react';
import { Compass } from 'lucide-react';

interface PrinciplesBannerProps {
  onJumpToChannels: () => void;
}

export function PrinciplesBanner({ onJumpToChannels }: PrinciplesBannerProps) {
  const [imgError, setImgError] = useState(false);

  const pillars = [
    {
      index: '01',
      title: 'تولۇق يەرلىك مەخپىيەتلىك',
      desc: 'نۆل ئىز قوغلاش؛ بارلىق ئانالىز ۋە خۇلاسىلىرىڭىز ئۆز كومپيۇتېرىڭىزدىكى IndexedDB ئامبىرىدا ساقلىنىدۇ.',
    },
    {
      index: '02',
      title: 'ئىلمىي ئۇيغۇرچە خۇلاسە',
      desc: 'ھەر بىر ئانالىزنى بىرلا كۇنۇپكا بىلەن ساپ ئەدەبىي ئۇيغۇر تىلىدا، مۇستەقىل ئاتالغۇ ئۆلچىمى بىلەن خۇلاسىلەڭ.',
    },
    {
      index: '03',
      title: 'ئېنىق مەنبە ۋە ئۇلانما',
      desc: 'ھەر بىر تەھلىلنىڭ ئاستىدا ئەسلى مەنبە قانىلى ۋە بىۋاسىتە تور بەت ئادرېسى ئېنىق كۆرسىتىلىدۇ.',
    },
  ];

  return (
    <section className="pb-12">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="editorial-card rounded-[28px] p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Editorial Photo */}
          <div className="lg:col-span-4">
            <div className="aspect-[4/3] rounded-[20px] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card-soft)]">
              {!imgError ? (
                <img
                  src="/src/assets/images/editorial_cartography_study_1795280629032.jpg"
                  alt="خەلقئارا تەتقىقات ۋە خەرىتە ئۈستىلى"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-card-soft)] to-[var(--accent-soft)]">
                  <Compass className="w-10 h-10 text-[var(--accent-primary)]" />
                </div>
              )}
            </div>
          </div>

          {/* Editorial Mission */}
          <div className="lg:col-span-4">
            <span className="editorial-eyebrow editorial-eyebrow-start mb-2">
              پرىنسىپ ۋە ئۆلچەم
            </span>
            <h2 className="text-2xl sm:text-[28px] font-bold leading-[1.3] text-[var(--text-primary)] mb-3">
              مۇستەقىل، ئىلمىي ۋە <span className="text-[var(--accent-primary)]">بىخەتەر</span>{' '}
              ئانالىز سۇپىسى
            </h2>
            <div className="uyghur-prose text-sm text-[var(--text-secondary)] mb-5">
              <p>
                دۇنيادىكى ئىشەنچلىك ئەرەبچە، ئىنگلىزچە ۋە تۈركچە تەتقىقات مەركەزلىرىنىڭ
                كۈندىلىك ماقالىلىرىنى خىتاي مۇلازىمەتلىرىدىن تامامەن خالىي مۇھىتتا
                بىخەتەر يىغىڭ ۋە تەھرىرلەڭ.
              </p>
            </div>
            <button
              type="button"
              onClick={onJumpToChannels}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--bg-dark)] hover:opacity-90 dark:bg-[var(--accent-primary)] dark:hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
            >
              <span>قاناللارنى باشقۇرۇش</span>
            </button>
          </div>

          {/* 3 Clean Numbered Pillars */}
          <div className="lg:col-span-4 space-y-5 lg:border-r lg:border-[var(--border-subtle)] lg:pr-7">
            {pillars.map((pillar) => (
              <div key={pillar.index} className="flex items-start gap-3.5">
                <span className="text-xs font-bold text-[var(--accent-primary)] tabular-nums pt-1 shrink-0">
                  {pillar.index}.
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
