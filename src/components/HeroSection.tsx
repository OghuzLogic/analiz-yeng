import { useState } from 'react';
import { BookOpen, BookOpenCheck, Moon, Plus, RefreshCw, Settings, Sun } from 'lucide-react';

interface HeroSectionProps {
  totalCount: number;
  translatedCount: number;
  activeChannelCount: number;
  lastFetchedAt: string | null;
  autoDailyRefresh: boolean;
  isFetching: boolean;
  isTranslating: boolean;
  isDark: boolean;
  customGlossaryCount: number;
  onToggleTheme: () => void;
  onFetchDaily: () => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenGlossary: () => void;
}

export function HeroSection({
  totalCount,
  translatedCount,
  activeChannelCount,
  lastFetchedAt,
  autoDailyRefresh,
  isFetching,
  isTranslating,
  isDark,
  customGlossaryCount,
  onToggleTheme,
  onFetchDaily,
  onOpenAddModal,
  onOpenSettings,
  onOpenGlossary,
}: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section id="home" className="pt-10 pb-14 md:pt-14 md:pb-16">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Leading Editorial Column (Right in RTL) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="mb-4">
              <span className="editorial-eyebrow editorial-eyebrow-start">
                8 مەركىزىي گېئوسىياسىي تېما · كۈندىلىك ئۇيغۇرچە تەرجىمە
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold leading-[1.24] text-[var(--text-primary)] mb-6 [text-wrap:balance]">
              خەلقئارا ئىستراتېگىيەلىك{' '}
              <span className="text-[var(--accent-primary)]">ئانالىزلار</span> ھەر كۈنى
              ئۇيغۇرچە يېڭىلىنىدۇ
            </h1>

            <div className="uyghur-prose text-base text-[var(--text-secondary)] max-w-2xl mb-8">
              <p>
                دۇنيادىكى نوپۇزلۇق ئەرەبچە، ئىنگلىزچە ۋە تۈركچە ئانالىز قاناللىرىدىن پەقەت
                4 چوڭ بوغۇز، روسىيە-ئۇكرائىنا ئۇرۇشى، ئوتتۇرا شەرق، خىتاي ۋەزىيىتى،
                ئامېرىكا-ئىران ئۇرۇشى، جەنۇبىي دېڭىز، ئوتتۇرا ئاسىيا ۋە شەرقىي تۈركىستان
                تېمىلىرى بويىچە كۈندىلىك ئانالىزلارنى سۈزۈپ يىغىدۇ، ماۋزۇ ۋە تېكىستلارنى
                ئاپتوماتىك ئۇيغۇرچىگە تەرجىمە قىلىدۇ.
              </p>
            </div>

            {/* Primary & Secondary Workspace Controls including Settings button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onFetchDaily}
                disabled={isFetching || isTranslating}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-65 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_10px_24px_rgba(184,75,39,0.24)]"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching || isTranslating ? 'animate-spin' : ''}`} />
                <span>
                  {isFetching
                    ? 'ئانالىزلار يىغىلىۋاتىدۇ...'
                    : isTranslating
                      ? 'ئۇيغۇرچىگە تەرجىمە قىلىۋاتىدۇ...'
                      : 'كۈندىلىك يېڭىلاش'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenGlossary}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpenCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>
                  لوغەت ۋە ئىملا
                  {customGlossaryCount > 0 ? ` (${15 + customGlossaryCount})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Settings className="w-4 h-4" />
                <span>تەڭشەك</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>قولدا قوشۇش</span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'يورۇق كۆرۈنۈشكە ئالماشتۇرۇش' : 'قاراڭغۇ كۆرۈنۈشكە ئالماشتۇرۇش'}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? 'يورۇق' : 'قاراڭغۇ'}</span>
              </button>
            </div>
          </div>

          {/* Editorial Visual Arch Frame (Left in RTL) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute -top-4 -left-3 w-36 h-36 rounded-full bg-[var(--accent-soft)] opacity-80 blur-2xl pointer-events-none"
            />
            <div className="relative w-full max-w-[440px] lg:max-w-none h-[340px] sm:h-[400px] lg:h-full min-h-[340px]">
              <div className="hero-arch-frame w-full h-full border border-[var(--border-subtle)] bg-[var(--bg-card-soft)] relative">
                {!imgError ? (
                  <img
                    src="/src/assets/images/editorial_hero_desk_1795280629551.jpg"
                    alt="ئانالىز ۋە تەتقىقات ئۈستىلى"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center bg-gradient-to-br from-[var(--bg-card-soft)] to-[var(--accent-soft)]">
                    <BookOpen className="w-10 h-10 text-[var(--accent-primary)]" />
                    <span className="text-lg font-bold text-[var(--text-primary)]">
                      ئانالىزلار مەجمۇئەسى
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute -bottom-4 right-4 sm:right-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[20px] px-5 py-3.5 shadow-[var(--shadow-soft)] flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums leading-tight">
                    {activeChannelCount}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    نوپۇزلۇق ئاكتىپ قانال
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Unboxed Editorial Summary Strip with Clear Date & Time */}
        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-[var(--text-secondary)] mb-1">يەرلىك ئارخىپتىكى ئانالىزلار</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {totalCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] mb-1">ئۇيغۇرچە تەرجىمە قىلىنغانلار</div>
            <div className="text-2xl font-bold text-[var(--accent-primary)] tabular-nums">
              {translatedCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] mb-1">كۈندىلىك ئاپتوماتىك يېڭىلاش</div>
            <div className="text-sm font-semibold text-[var(--text-primary)] mt-1.5">
              {autoDailyRefresh ? 'ھەر كۈنى ئاكتىپ' : 'قولدا يېڭىلاش'}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] mb-1">ئەڭ ئاخىرقى يېڭىلىنىش ۋاقتى</div>
            <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums mt-1.5">
              {lastFetchedAt || 'تېخى يىغىلمىدى'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
