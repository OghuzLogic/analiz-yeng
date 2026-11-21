import { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Languages,
  Loader2,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { AnalysisItem } from '../types';
import { formatUyghurDate, getLanguageLabel, getRelativeDayBadge } from '../utils/terminology';

interface ReaderDrawerProps {
  item: AnalysisItem | null;
  isSummarizing: boolean;
  isTranslating: boolean;
  isSendingTelegram: boolean;
  telegramSentSuccess?: boolean;
  onClose: () => void;
  onSummarize: (item: AnalysisItem) => void;
  onTranslateFull: (item: AnalysisItem) => void;
  onSendTelegram: (item: AnalysisItem) => void;
  onEdit: (item: AnalysisItem) => void;
  onDelete: (id: string) => void;
}

export function ReaderDrawer({
  item,
  isSummarizing,
  isTranslating,
  isSendingTelegram,
  telegramSentSuccess,
  onClose,
  onSummarize,
  onTranslateFull,
  onSendTelegram,
  onEdit,
  onDelete,
}: ReaderDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const hasSummary = Boolean(item.summaryParagraphs && item.summaryParagraphs.length > 0);
  const fullParagraphs = item.uyghurFullParagraphs || [];
  const hasFullParagraphs = fullParagraphs.length > 0;
  const sourceDir = item.language === 'ar' ? 'rtl' : 'ltr';
  const exactDateTime = formatUyghurDate(item.publishedAt);
  const relativeDay = getRelativeDayBadge(item.publishedAt);

  const handleCopy = async () => {
    const title = item.uyghurTitle || item.originalTitle;
    const body = hasSummary
      ? item.summaryParagraphs!.join('\n\n')
      : hasFullParagraphs
        ? fullParagraphs.join('\n\n')
        : item.uyghurExcerpt || item.originalExcerpt;
    const formatted = `${title}\nۋاقىت: ${exactDateTime}\n\n${body}\n\nمەنبەسى: ${item.sourceName}\nئۇلانما ئادرېسى: ${item.articleUrl}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl h-full overflow-y-auto bg-[var(--bg-card)] border-l border-[var(--border-subtle)] shadow-[var(--shadow-soft)] p-6 sm:p-10 flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 pb-5 mb-7 border-b border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-primary)]">
                {getLanguageLabel(item.language)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{item.sourceName}</span>
              {item.topic && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--accent-primary)] font-medium">{item.topic}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                {relativeDay ? `${relativeDay} · ` : ''}
                {exactDateTime}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ئوقۇش كۆزنىكىنى تاقاش"
              className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reading Column */}
          <div className="max-w-2xl mx-auto">
            {item.uyghurTitle && (
              <h2 className="text-2xl sm:text-3xl font-bold leading-[1.4] text-[var(--text-primary)] mb-3">
                {item.uyghurTitle}
              </h2>
            )}

            <p
              dir={sourceDir}
              className={`text-sm sm:text-base font-semibold text-[var(--text-secondary)] leading-relaxed mb-7 ${
                sourceDir === 'ltr' ? 'text-left' : 'text-right'
              }`}
            >
              {item.originalTitle}
            </p>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pb-6 mb-7 border-b border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => onSendTelegram(item)}
                disabled={isSendingTelegram || isTranslating}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-65 ${
                  telegramSentSuccess
                    ? 'bg-emerald-700'
                    : 'bg-[#1D72B8] hover:bg-[#175E99]'
                }`}
              >
                {isSendingTelegram ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : telegramSentSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isSendingTelegram
                    ? 'يوللاۋاتىدۇ...'
                    : telegramSentSuccess
                      ? 'تېلېگراممىغا يوللاندى'
                      : 'تېلېگراممىغا يوللاش'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSummarize(item)}
                disabled={isSummarizing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-65 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isSummarizing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>
                  {isSummarizing
                    ? 'خۇلاسىلەۋاتىدۇ...'
                    : hasSummary
                      ? 'قايتا خۇلاسىلەش'
                      : 'ئۇيغۇرچە خۇلاسە'}
                </span>
              </button>

              {!item.isFullTranslated && (
                <button
                  type="button"
                  onClick={() => onTranslateFull(item)}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isTranslating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4" />
                  )}
                  <span>{isTranslating ? 'پۈتۈن تەرجىمە قىلىۋاتىدۇ...' : 'پۈتۈن تەرجىمە'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Pencil className="w-4 h-4" />
                <span>تەھرىرلەش</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'كۆچۈرۈلدى' : 'مەنبە بىلەن كۆچۈرۈش'}</span>
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ئۆچۈرۈش</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(item.id);
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-red-700 hover:bg-red-800 cursor-pointer"
                  >
                    ئۆچۈرۈشنى جەزملەش
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3.5 py-2.5 rounded-full text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] cursor-pointer"
                  >
                    بىكار قىلىش
                  </button>
                </div>
              )}
            </div>

            {/* Uyghur Summary Section */}
            {hasSummary && (
              <section className="mb-8">
                <h3 className="text-sm font-bold text-[var(--accent-primary)] mb-3">
                  ئۇيغۇرچە ئىلمىي خۇلاسە
                </h3>
                <div className="uyghur-prose text-base text-[var(--text-primary)]">
                  {item.summaryParagraphs!.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Complete Full Uyghur Translation */}
            {hasFullParagraphs ? (
              <section
                className={`mb-8 ${hasSummary ? 'pt-6 border-t border-[var(--border-subtle)]' : ''}`}
              >
                <h3 className="text-sm font-bold text-[var(--accent-primary)] mb-3">
                  پۈتۈن ئۇيغۇرچە تەرجىمىسى ({fullParagraphs.length} ئابزاس)
                </h3>
                <div className="uyghur-prose text-base text-[var(--text-primary)]">
                  {fullParagraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            ) : item.uyghurExcerpt ? (
              <section
                className={`mb-8 ${hasSummary ? 'pt-6 border-t border-[var(--border-subtle)]' : ''}`}
              >
                <h3 className="text-sm font-bold text-[var(--accent-primary)] mb-3">
                  ئۇيغۇرچە تەرجىمىسى
                </h3>
                <div className="uyghur-prose text-base text-[var(--text-primary)]">
                  <p>{item.uyghurExcerpt}</p>
                </div>
              </section>
            ) : null}

            {/* Key Takeaways */}
            {item.keyTakeaways && item.keyTakeaways.length > 0 && (
              <section className="mb-8 pt-6 border-t border-[var(--border-subtle)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                  يادرولۇق نۇقتىلار
                </h3>
                <ol className="space-y-2.5 text-[15px] text-[var(--text-secondary)] list-decimal list-inside leading-loose">
                  {item.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ol>
              </section>
            )}

            {/* Original Excerpt */}
            <section className="mb-8 pt-6 border-t border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-3">
                ئەسلى مەنبەدىن ئېلىنغان تېكىست
              </h3>
              <p
                dir={sourceDir}
                className={`text-[15px] leading-[1.9] text-[var(--text-secondary)] ${
                  sourceDir === 'ltr' ? 'text-left' : 'text-right'
                }`}
              >
                {item.originalExcerpt}
              </p>
            </section>

            {/* Personal Notes */}
            {item.notes && (
              <section className="mb-8 pt-6 border-t border-[var(--border-subtle)]">
                <h3 className="text-sm font-bold text-[var(--accent-primary)] mb-2">
                  شەخسىي ئىزاھات
                </h3>
                <div className="uyghur-prose text-[15px] text-[var(--text-primary)]">
                  <p>{item.notes}</p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Source Attribution & Direct Website Link */}
        <div className="max-w-2xl mx-auto w-full pt-6 mt-6 border-t border-[var(--border-subtle)] space-y-2 text-sm">
          <div>
            <span className="font-bold text-[var(--text-primary)]">مەنبەسى: </span>
            <span className="text-[var(--text-secondary)]">{item.sourceName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[var(--text-primary)]">ئەسلى تور بەت ئۇلانمىسى:</span>
            <a
              href={item.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-1.5 text-[var(--accent-primary)] hover:underline break-all"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>{item.articleUrl}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
