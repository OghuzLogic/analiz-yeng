import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnalysisItem, GlossaryRule, LanguageCode } from '../types';
import { enforceUyghurTerminology } from '../utils/terminology';
import { GEOPOLITICAL_TOPICS, GeopoliticalTopicId } from '../utils/topicFilter';

interface AnalysisModalProps {
  isOpen: boolean;
  editingItem: AnalysisItem | null;
  customGlossaryRules?: GlossaryRule[];
  onClose: () => void;
  onSave: (item: AnalysisItem) => void;
}

export function AnalysisModal({
  isOpen,
  editingItem,
  customGlossaryRules,
  onClose,
  onSave,
}: AnalysisModalProps) {
  const [uyghurTitle, setUyghurTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('ar');
  const [topicId, setTopicId] = useState<GeopoliticalTopicId | ''>('');
  const [topic, setTopic] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [uyghurExcerpt, setUyghurExcerpt] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [originalExcerpt, setOriginalExcerpt] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setUyghurTitle(editingItem.uyghurTitle || '');
      setOriginalTitle(editingItem.originalTitle || '');
      setLanguage(editingItem.language);
      setTopicId(editingItem.topicId || '');
      setTopic(editingItem.topic || '');
      setSourceName(editingItem.sourceName || '');
      setArticleUrl(editingItem.articleUrl || '');
      setUyghurExcerpt(
        editingItem.uyghurFullParagraphs && editingItem.uyghurFullParagraphs.length > 0
          ? editingItem.uyghurFullParagraphs.join('\n\n')
          : editingItem.uyghurExcerpt || ''
      );
      setSummaryText((editingItem.summaryParagraphs || []).join('\n\n'));
      setOriginalExcerpt(editingItem.originalExcerpt || '');
      setNotes(editingItem.notes || '');
    } else {
      setUyghurTitle('');
      setOriginalTitle('');
      setLanguage('ar');
      setTopicId('east-turkistan');
      setTopic('شەرقىي تۈركىستان');
      setSourceName('');
      setArticleUrl('');
      setUyghurExcerpt('');
      setSummaryText('');
      setOriginalExcerpt('');
      setNotes('');
    }
    setFormError('');
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleTopicSelect = (value: string) => {
    const id = value as GeopoliticalTopicId | '';
    setTopicId(id);
    const matched = GEOPOLITICAL_TOPICS.find((t) => t.id === id);
    if (matched) {
      setTopic(matched.label);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedOriginalTitle = originalTitle.trim() || uyghurTitle.trim();
    const cleanedSource = sourceName.trim();
    const cleanedUrl = articleUrl.trim();

    if (!cleanedOriginalTitle) {
      setFormError('ماقالە ماۋزۇسىنى كىرگۈزۈڭ.');
      return;
    }
    if (!cleanedSource) {
      setFormError('مەنبە نامىنى كىرگۈزۈڭ.');
      return;
    }
    if (!cleanedUrl || !cleanedUrl.startsWith('http')) {
      setFormError('توغرا تور بەت ئۇلانما ئادرېسىنى (https://...) كىرگۈزۈڭ.');
      return;
    }

    const fix = (val: string) => enforceUyghurTerminology(val, customGlossaryRules);

    const paragraphs = summaryText
      .split(/\n+/)
      .map((p) => fix(p.trim()))
      .filter(Boolean);

    const translatedParagraphs = uyghurExcerpt
      .split(/\n+/)
      .map((p) => fix(p.trim()))
      .filter(Boolean);

    const nowIso = new Date().toISOString();
    let originSite = cleanedUrl;
    try {
      originSite = new URL(cleanedUrl).origin;
    } catch {
      originSite = cleanedUrl;
    }

    const saved: AnalysisItem = editingItem
      ? {
          ...editingItem,
          uyghurTitle: uyghurTitle.trim() ? fix(uyghurTitle.trim()) : undefined,
          uyghurExcerpt: translatedParagraphs.length > 0 ? translatedParagraphs.slice(0, 2).join('\n\n') : undefined,
          uyghurFullParagraphs: translatedParagraphs.length > 0 ? translatedParagraphs : undefined,
          isFullTranslated: translatedParagraphs.length > 0 ? true : editingItem.isFullTranslated,
          originalTitle: cleanedOriginalTitle,
          language,
          topicId: topicId || undefined,
          topic: topic.trim() ? fix(topic.trim()) : undefined,
          sourceName: fix(cleanedSource),
          sourceSiteUrl: originSite,
          articleUrl: cleanedUrl,
          summaryParagraphs: paragraphs.length > 0 ? paragraphs : undefined,
          originalExcerpt: originalExcerpt.trim() || cleanedOriginalTitle,
          notes: notes.trim() ? fix(notes.trim()) : undefined,
        }
      : {
          id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          uyghurTitle: uyghurTitle.trim() ? fix(uyghurTitle.trim()) : undefined,
          uyghurExcerpt: translatedParagraphs.length > 0 ? translatedParagraphs.slice(0, 2).join('\n\n') : undefined,
          uyghurFullParagraphs: translatedParagraphs.length > 0 ? translatedParagraphs : undefined,
          isFullTranslated: translatedParagraphs.length > 0,
          originalTitle: cleanedOriginalTitle,
          language,
          topicId: topicId || undefined,
          topic: topic.trim() ? fix(topic.trim()) : undefined,
          sourceName: fix(cleanedSource),
          sourceSiteUrl: originSite,
          articleUrl: cleanedUrl,
          summaryParagraphs: paragraphs.length > 0 ? paragraphs : undefined,
          originalExcerpt: originalExcerpt.trim() || cleanedOriginalTitle,
          notes: notes.trim() ? fix(notes.trim()) : undefined,
          publishedAt: nowIso,
          collectedAt: nowIso,
          bookmarked: false,
          isManual: true,
        };

    onSave(saved);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--border-subtle)]">
          <h2 id="analysis-modal-title" className="text-xl font-bold text-[var(--text-primary)]">
            {editingItem ? 'ئانالىزنى تەھرىرلەش' : 'يېڭى ئانالىز قوشۇش'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="تاقاش"
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                ئۇيغۇرچە ماۋزۇ
              </label>
              <input
                type="text"
                value={uyghurTitle}
                onChange={(e) => setUyghurTitle(e.target.value)}
                placeholder="ئانالىزنىڭ ئۇيغۇرچە ماۋزۇسى"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                ئەسلى ماۋزۇ
              </label>
              <input
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder="ئەرەبچە، ئىنگلىزچە ياكى تۈركچە ماۋزۇ"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                مەنبە تىلى
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="ar">ئەرەبچە</option>
                <option value="en">ئىنگلىزچە</option>
                <option value="tr">تۈركچە</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                مەنبەسى (قانال نامى)
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="مەسىلەن: ئەلجەزىرە"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                8 گېئوسىياسىي تېما
              </label>
              <select
                value={topicId}
                onChange={(e) => handleTopicSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">باشقا / تاللانمىغان</option>
                {GEOPOLITICAL_TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.order}. {t.shortLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              تور بەت ئۇلانما ئادرېسى (URL)
            </label>
            <input
              type="url"
              dir="ltr"
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              placeholder="https://www.aljazeera.net/..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-left focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              ئۇيغۇرچە تەرجىمە تېكىستى
            </label>
            <textarea
              rows={3}
              value={uyghurExcerpt}
              onChange={(e) => setUyghurExcerpt(e.target.value)}
              placeholder="ئانالىزنىڭ ئۇيغۇرچە تەرجىمە مەزمۇنى..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              ئۇيغۇرچە خۇلاسە (ھەر بىر ئابزاسنى يېڭى قۇردىن يېزىڭ)
            </label>
            <textarea
              rows={4}
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="ئانالىزنىڭ ئۇيغۇرچە خۇلاسىسىنى يېزىڭ ياكى تەھرىرلەڭ..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              ئەسلى قىسقىچە مەزمۇن
            </label>
            <textarea
              rows={2}
              value={originalExcerpt}
              onChange={(e) => setOriginalExcerpt(e.target.value)}
              placeholder="ئەسلى تىلدىكى ماقالە ئۈزۈندىسى..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              شەخسىي ئىزاھات ۋە باھا (ئىختىيارىي)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ئۆزىڭىزنىڭ تەتقىقات خاتىرىسى..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              بىكار قىلىش
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              يەرلىك ساقلاش
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
