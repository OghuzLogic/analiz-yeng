import { useState } from 'react';
import {
  Bookmark,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Languages,
  Loader2,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { AnalysisItem } from '../types';
import {
  extractDomain,
  formatUyghurDate,
  getLanguageLabel,
  getRelativeDayBadge,
} from '../utils/terminology';

interface AnalysisCardProps {
  item: AnalysisItem;
  isSummarizing: boolean;
  isTranslating: boolean;
  isSendingTelegram: boolean;
  telegramSentSuccess?: boolean;
  actionError?: string;
  onSummarize: (item: AnalysisItem) => void;
  onTranslateFull: (item: AnalysisItem) => void;
  onSendTelegram: (item: AnalysisItem) => void;
  onEdit: (item: AnalysisItem) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (item: AnalysisItem) => void;
  onOpenReader: (item: AnalysisItem) => void;
}

export function AnalysisCard({
  item,
  isSummarizing,
  isTranslating,
  isSendingTelegram,
  telegramSentSuccess,
  actionError,
  onSummarize,
  onTranslateFull,
  onSendTelegram,
  onEdit,
  onDelete,
  onToggleBookmark,
  onOpenReader,
}: AnalysisCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [expandedFullText, setExpandedFullText] = useState(false);

  const hasSummary = Boolean(item.summaryParagraphs && item.summaryParagraphs.length > 0);
  const fullParagraphs = item.uyghurFullParagraphs || [];
  const hasFullParagraphs = fullParagraphs.length > 0;
  const hasAnyTranslation = Boolean(item.uyghurTitle && (hasFullParagraphs || item.uyghurExcerpt));
  const sourceDir = item.language === 'ar' ? 'rtl' : 'ltr';
  const relativeDay = getRelativeDayBadge(item.publishedAt);
  const exactDateTime = formatUyghurDate(item.publishedAt);

  const visibleFullParagraphs = expandedFullText ? fullParagraphs : fullParagraphs.slice(0, 3);

  const handleCopy = async () => {
    const titleLine = item.uyghurTitle || item.originalTitle;
    const bodyText = hasSummary
      ? item.summaryParagraphs!.join('\n\n')
      : hasFullParagraphs
        ? fullParagraphs.join('\n\n')
        : item.uyghurExcerpt || item.originalExcerpt;
    const takeawaysBlock =
      item.keyTakeaways && item.keyTakeaways.length > 0
        ? `\n\nيادرولۇق نۇقتىلار:\n${item.keyTakeaways.map((k, idx) => `${idx + 1}. ${k}`).join('\n')}`
        : '';

    const formatted = `${titleLine}\nۋاقىت: ${exactDateTime}\n\n${bodyText}${takeawaysBlock}\n\nمەنبەسى: ${item.sourceName}\nئۇلانما ئادرېسى: ${item.articleUrl}`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="editorial-card rounded-[24px] p-6 sm:p-7 flex flex-col justify-between">
      <div>
        {/* Clean Unboxed Metadata Row with Exact Date & Time */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-primary)]">
                {getLanguageLabel(item.language)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[var(--text-primary)]">{item.sourceName}</span>
              {item.topic && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--accent-primary)] font-medium">{item.topic}</span>
                </>
              )}
              {item.isFullTranslated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    پۈتۈن تەرجىمە قىلىنغان
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              {relativeDay && (
                <>
                  <span className="font-semibold text-[var(--text-primary)]">{relativeDay}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{exactDateTime}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleBookmark(item)}
            aria-label={item.bookmarked ? 'ساقلانغانلاردىن چىقىرىش' : 'ساقلاپ قويۇش'}
            className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
              item.bookmarked
                ? 'text-[var(--accent-primary)] bg-[var(--accent-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${item.bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title: Prioritize Uyghur Translation */}
        <div className="mb-4">
          {item.uyghurTitle ? (
            <h3 className="text-xl sm:text-[22px] font-bold leading-[1.48] text-[var(--text-primary)]">
              <button
                type="button"
                onClick={() => onOpenReader(item)}
                className="text-right hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
              >
                {item.uyghurTitle}
              </button>
            </h3>
          ) : (
            <h3
              dir={sourceDir}
              className={`text-lg sm:text-xl font-bold leading-[1.45] text-[var(--text-primary)] ${
                sourceDir === 'ltr' ? 'text-left' : 'text-right'
              }`}
            >
              <button
                type="button"
                onClick={() => onOpenReader(item)}
                className={`hover:text-[var(--accent-primary)] transition-colors cursor-pointer ${
                  sourceDir === 'ltr' ? 'text-left' : 'text-right'
                }`}
              >
                {item.originalTitle}
              </button>
            </h3>
          )}
        </div>

        {/* Body Prose: Summary OR Complete Translated Uyghur Paragraphs OR Excerpt */}
        {hasSummary ? (
          <div className="mb-4">
            <div className="text-xs font-bold text-[var(--accent-primary)] mb-1.5">
              ئۇيغۇرچە خۇلاسە
            </div>
            <div className="uyghur-prose text-[15px] text-[var(--text-primary)]">
              {item.summaryParagraphs!.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {item.keyTakeaways && item.keyTakeaways.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="text-xs font-bold text-[var(--text-secondary)] mb-2">
                  يادرولۇق نۇقتىلار
                </div>
                <ol className="space-y-1.5 text-sm text-[var(--text-secondary)] list-decimal list-inside leading-relaxed">
                  {item.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : hasFullParagraphs ? (
          <div className="mb-4">
            <div className="uyghur-prose text-[15px] text-[var(--text-primary)]">
              {visibleFullParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {fullParagraphs.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandedFullText((v) => !v)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                {expandedFullText ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>تېكىستنى يىغىش</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      پۈتۈن تەرجىمىنى كېڭەيتىپ ئوقۇش (جەمئىي {fullParagraphs.length} ئابزاس)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : item.uyghurExcerpt ? (
          <div className="mb-4 uyghur-prose text-[15px] text-[var(--text-secondary)]">
            <p>{item.uyghurExcerpt}</p>
          </div>
        ) : (
          <div className="mb-4">
            <p
              dir={sourceDir}
              className={`text-sm leading-[1.8] text-[var(--text-secondary)] line-clamp-4 ${
                sourceDir === 'ltr' ? 'text-left' : 'text-right'
              }`}
            >
              {item.originalExcerpt}
            </p>
          </div>
        )}

        {/* Collapsible Original Text Toggle when Translated */}
        {hasAnyTranslation && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            >
              {showOriginal ? 'ئەسلى تىلدىكى تېكىستنى يوشۇرۇش' : 'ئەسلى تىلدىكى ماۋزۇ ۋە تېكىستنى كۆرۈش'}
            </button>
            {showOriginal && (
              <div
                dir={sourceDir}
                className={`mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5 ${
                  sourceDir === 'ltr' ? 'text-left' : 'text-right'
                }`}
              >
                <div className="font-semibold text-[var(--text-primary)]">{item.originalTitle}</div>
                <p className="leading-relaxed">{item.originalExcerpt}</p>
              </div>
            )}
          </div>
        )}

        {/* Personal Notes if edited */}
        {item.notes && item.notes.trim() !== '' && (
          <div className="mb-4 pt-3.5 border-t border-[var(--border-subtle)]">
            <div className="text-xs font-bold text-[var(--accent-primary)] mb-1">
              شەخسىي ئىزاھات
            </div>
            <div className="uyghur-prose text-sm text-[var(--text-secondary)]">
              <p>{item.notes}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {actionError && (
          <div
            role="alert"
            className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300"
          >
            خاتالىق كۆرۈلدى: {actionError}
          </div>
        )}
      </div>

      {/* Bottom Action Controls + Source Attribution Footer */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* تېلېگراممىغا يوللاش كۇنۇپكىسى */}
          <button
            type="button"
            onClick={() => onSendTelegram(item)}
            disabled={isSendingTelegram || isTranslating}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-65 ${
              telegramSentSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1D72B8] hover:bg-[#175E99] text-white'
            }`}
          >
            {isSendingTelegram ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : telegramSentSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {isSendingTelegram
                ? 'تېلېگراممىغا يوللاۋاتىدۇ...'
                : telegramSentSuccess
                  ? 'تېلېگراممىغا يوللاندى'
                  : 'تېلېگراممىغا يوللاش'}
            </span>
          </button>

          {/* خۇلاسە كۇنۇپكىسى */}
          <button
            type="button"
            onClick={() => onSummarize(item)}
            disabled={isSummarizing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-65 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSummarizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>
              {isSummarizing
                ? 'خۇلاسىلەۋاتىدۇ...'
                : hasSummary
                  ? 'قايتا خۇلاسىلەش'
                  : 'خۇلاسە'}
            </span>
          </button>

          {/* پۈتۈن تەرجىمە كۇنۇپكىسى */}
          {!item.isFullTranslated && (
            <button
              type="button"
              onClick={() => onTranslateFull(item)}
              disabled={isTranslating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5" />
              )}
              <span>{isTranslating ? 'پۈتۈن تەرجىمە قىلىۋاتىدۇ...' : 'پۈتۈن تەرجىمە'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>تەھرىرلەش</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReader(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpenText className="w-3.5 h-3.5" />
            <span>تولۇق كۆرۈش</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'كۆچۈرۈلدى' : 'كۆچۈرۈش'}</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:text-red-700 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ئۆچۈرۈش</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                جەزملەش
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-full text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                بىكار قىلىش
              </button>
            </div>
          )}
        </div>

        {/* Source Attribution & Direct Link Underneath Every Analysis */}
        <footer className="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)] shrink-0">مەنبەسى:</span>
            <span className="truncate">{item.sourceName}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[var(--text-primary)] shrink-0">
              ئۇلانما ئادرېسى:
            </span>
            <a
              href={item.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-1.5 text-[var(--accent-primary)] hover:underline truncate max-w-full"
              title={item.articleUrl}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {extractDomain(item.articleUrl)} — {item.articleUrl}
              </span>
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
}
