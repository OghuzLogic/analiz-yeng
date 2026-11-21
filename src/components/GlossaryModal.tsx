import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { GlossaryRule } from '../types';
import {
  BUILTIN_ORTHOGRAPHY_RULES,
  enforceUyghurTerminology,
} from '../utils/terminology';

interface GlossaryModalProps {
  isOpen: boolean;
  customRules: GlossaryRule[];
  lastAppliedCount: number | null;
  onClose: () => void;
  onSaveRules: (nextRules: GlossaryRule[]) => Promise<number>;
  onReapplyAll: () => Promise<number>;
}

export function GlossaryModal({
  isOpen,
  customRules,
  lastAppliedCount,
  onClose,
  onSaveRules,
  onReapplyAll,
}: GlossaryModalProps) {
  const [activeTab, setActiveTab] = useState<'custom' | 'builtin'>('custom');
  const [wrongInput, setWrongInput] = useState('');
  const [correctInput, setCorrectInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testInput, setTestInput] = useState(
    'ئامېرىكا قوشما شتاتلىرى ۋە ئىران ئىسلام جۇمھۇرىيىتى، ئۇچقۇسىز ئايروپلان ھۇجۇمى، سۈرىيە پىرىزدېنتى، ھاقان فىدان، لاتاقىيە، خۇسىيلار، ۋاپات بولدى.'
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const livePreviewOutput = useMemo(
    () => enforceUyghurTerminology(testInput, customRules),
    [testInput, customRules]
  );

  const filteredBuiltin = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BUILTIN_ORTHOGRAPHY_RULES;
    return BUILTIN_ORTHOGRAPHY_RULES.filter((r) =>
      `${r.order} ${r.wrongLabel} ${r.correctLabel} ${r.note || ''}`.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredCustom = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customRules;
    return customRules.filter((r) =>
      `${r.wrong} ${r.correct} ${r.note || ''}`.toLowerCase().includes(q)
    );
  }, [customRules, searchQuery]);

  if (!isOpen) return null;

  const resetForm = () => {
    setWrongInput('');
    setCorrectInput('');
    setNoteInput('');
    setEditingRuleId(null);
    setFormError(null);
  };

  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const wrong = wrongInput.trim();
    const correct = correctInput.trim();
    const note = noteInput.trim();

    if (!wrong) {
      setFormError('تۈزىتىلىدىغان خاتا سۆز ياكى ئىبارىنى كىرگۈزۈڭ.');
      return;
    }
    if (!correct) {
      setFormError('توغرا يېزىلىش شەكلىنى كىرگۈزۈڭ.');
      return;
    }
    if (wrong === correct) {
      setFormError('خاتا سۆز بىلەن توغرا شەكلى ئوخشاش بولۇپ قالمىسۇن.');
      return;
    }

    setFormError(null);
    let nextRules: GlossaryRule[];

    if (editingRuleId) {
      nextRules = customRules.map((r) =>
        r.id === editingRuleId
          ? { ...r, wrong, correct, note: note || undefined, enabled: true }
          : r
      );
    } else {
      const existingSame = customRules.find((r) => r.wrong.trim() === wrong);
      if (existingSame) {
        nextRules = customRules.map((r) =>
          r.id === existingSame.id
            ? { ...r, correct, note: note || r.note, enabled: true }
            : r
        );
      } else {
        const newRule: GlossaryRule = {
          id: `gls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          wrong,
          correct,
          note: note || undefined,
          enabled: true,
        };
        nextRules = [newRule, ...customRules];
      }
    }

    const updatedCount = await onSaveRules(nextRules);
    resetForm();
    setActiveTab('custom');
    setFeedback(
      updatedCount > 0
        ? `قائىدە دەرھال ئىشلەشكە باشلىدى! ھازىرقى ${updatedCount} پارچە ئانالىز شۇ ھامان توغرىلاندى.`
        : 'قائىدە دەرھال ساقلاندى ۋە ئىشلەشكە باشلىدى (بارلىق يېڭى تەرجىمە، خۇلاسە ۋە تېلېگرامما ئۇچۇرلىرىدا ئاپتوماتىك قوللىنىلىدۇ).'
    );
  };

  const handleToggleRule = async (id: string) => {
    const next = customRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    const count = await onSaveRules(next);
    setFeedback(
      count > 0
        ? `لوغەت يېڭىلاندى ۋە ${count} پارچە ئانالىز شۇ ھامان توغرىلاندى.`
        : 'لوغەت ھالىتى يېڭىلاندى.'
    );
  };

  const handleDeleteRule = async (id: string) => {
    const next = customRules.filter((r) => r.id !== id);
    await onSaveRules(next);
    if (editingRuleId === id) {
      resetForm();
    }
    setFeedback('خاس ئىملا قائىدىسى ئۆچۈرۈلدى.');
  };

  const handleStartEdit = (rule: GlossaryRule) => {
    setEditingRuleId(rule.id);
    setWrongInput(rule.wrong);
    setCorrectInput(rule.correct);
    setNoteInput(rule.note || '');
    setFormError(null);
    setActiveTab('custom');
  };

  const handleReapplyClick = async () => {
    const count = await onReapplyAll();
    setFeedback(
      count > 0
        ? `بارلىق ئانالىزلار تەكشۈرۈلۈپ، ${count} پارچە ئانالىزنىڭ ئىملاسى شۇ ھامان توغرىلاندى.`
        : 'بارلىق ئانالىزلار ئاللىقاچان 15 مۇقىم قائىدە ۋە خاس لوغىتىڭىزگە تولۇق ئۇيغۇن.'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] mb-1">
              <BookOpenCheck className="w-4 h-4" />
              <span>دەرھال توغرىلاش سىستېمىسى</span>
            </div>
            <h2
              id="glossary-modal-title"
              className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]"
            >
              لوغەت ۋە ئىملا قائىدىلىرى
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              بۇ يەرگە قوشقان ياكى تۈزەتكەن ھەر قانداق ئىملا قائىدىسى شۇ ھامان بارلىق ئانالىزلار،
              تولۇق تەرجىمىلەر، خۇلاسىلەر ۋە تېلېگرامما ئۇچۇرلىرىدا ئىشلەشكە باشلايدۇ.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="تاقاش"
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add / Edit Rule Form */}
        <form
          onSubmit={handleSubmitRule}
          className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-5 mb-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {editingRuleId ? 'ئىملا قائىدىسىنى تەھرىرلەش' : 'يېڭى ئىملا تۈزىتىش قوشۇش'}
            </h3>
            {editingRuleId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                تەھرىرلەشنى بىكار قىلىش
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label
                htmlFor="glossary-wrong-input"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                خاتا سۆز / ئىبارە (ئالماشتۇرۇلىدىغىنى)
              </label>
              <input
                id="glossary-wrong-input"
                type="text"
                value={wrongInput}
                onChange={(e) => {
                  setWrongInput(e.target.value);
                  setFormError(null);
                }}
                placeholder="مەسىلەن: خۇسىيلار"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="glossary-correct-input"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                توغرا شەكلى (ئورنىغا قويۇلىدىغىنى)
              </label>
              <input
                id="glossary-correct-input"
                type="text"
                value={correctInput}
                onChange={(e) => {
                  setCorrectInput(e.target.value);
                  setFormError(null);
                }}
                placeholder="مەسىلەن: ھۇسىيلار"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="glossary-note-input"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                ئىزاھات (ئىختىيارىي)
              </label>
              <input
                id="glossary-note-input"
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="مەسىلەن: ئەرەبچە ئەسلى نامى"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {formError && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400">{formError}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[var(--text-secondary)]">
              قوشقان ھامان ھازىر ئېكراندا تۇرغان بارلىق ئانالىزلارمۇ دەرھال توغرىلىنىدۇ.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingRuleId ? 'ساقلاش ۋە دەرھال تەتبىقلاش' : 'قوشۇش ۋە دەرھال تەتبىقلاش'}</span>
            </button>
          </div>
        </form>

        {/* Feedback Banner */}
        {(feedback || (lastAppliedCount !== null && lastAppliedCount > 0)) && (
          <div className="mb-5 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {feedback ||
                  `${lastAppliedCount} پارچە ئانالىز ئىملا قائىدىسى بويىچە توغرىلاندى.`}
              </span>
            </div>
            {feedback && (
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs opacity-75 hover:opacity-100 cursor-pointer shrink-0"
              >
                تاقاش
              </button>
            )}
          </div>
        )}

        {/* Live Instant Orthography Tester */}
        <div className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-4 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>دەرھال سىناق كۆزنىكى (تېكىست كىرگۈزسىڭىز شۇ ھامان توغرىلاپ كۆرسىتىدۇ)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea
              rows={2}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="سىناق قىلىدىغان جۈملىنى يېزىڭ..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs leading-relaxed text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <div className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-emerald-500/35 text-xs leading-relaxed text-[var(--text-primary)]">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                توغرىلانغان نەتىجە:
              </div>
              <div>{livePreviewOutput || '—'}</div>
            </div>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              مېنىڭ خاس لوغىتىم ({customRules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('builtin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'builtin'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              15 مۇقىم ئىملا قائىدىسى ({BUILTIN_ORTHOGRAPHY_RULES.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="لوغەتتىن ئىزدەش..."
              className="w-full pr-9 pl-3.5 py-2 rounded-full bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Rules List */}
        {activeTab === 'custom' ? (
          filteredCustom.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {customRules.length === 0
                  ? 'ھازىرچە قوشۇلغان خاس ئىملا قائىدىسى يوق'
                  : 'ئىزدىگەن سۆز بويىچە خاس قائىدە تېپىلمىدى'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                يۇقىرىدىكى كۆزنەكتىن خاتا سۆز ۋە توغرا شەكلىنى كىرگۈزسىڭىزلا، شۇ ھامان بارلىق
                ئانالىزلارغا تەتبىقلىنىدۇ. 15 مۇقىم ئىملا قائىدىسى ئاللىقاچان ئاكتىپ ئىشلەۋاتىدۇ.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCustom.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                    rule.enabled
                      ? 'bg-[var(--bg-card-soft)] border-[var(--border-subtle)]'
                      : 'bg-transparent border-[var(--border-subtle)] opacity-60'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="line-through text-red-600/85 dark:text-red-400/85 font-medium">
                      {rule.wrong}
                    </span>
                    <ArrowLeft className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                    <span className="font-bold text-[var(--text-primary)]">{rule.correct}</span>
                    {rule.note && (
                      <span className="text-xs text-[var(--text-secondary)]">({rule.note})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        rule.enabled
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {rule.enabled ? 'ئاكتىپ' : 'تاقاق'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rule)}
                      aria-label="تەھرىرلەش"
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      aria-label="ئۆچۈرۈش"
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2.5">
            {filteredBuiltin.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-[var(--accent-primary)] tabular-nums mt-0.5 shrink-0">
                    {rule.order}.
                  </span>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-[var(--text-secondary)]">{rule.wrongLabel}</span>
                      <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                      <span className="font-bold text-[var(--text-primary)]">
                        {rule.correctLabel}
                      </span>
                    </div>
                    {rule.note && (
                      <div className="text-[11px] text-[var(--text-secondary)]">{rule.note}</div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 self-end sm:self-center">
                  دائىم ئاكتىپ
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-7 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleReapplyClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--accent-primary)] bg-[var(--accent-soft)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بارلىق ئانالىزلارنى قايتا توغرىلاش</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            تاقاش
          </button>
        </div>
      </div>
    </div>
  );
}
