import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { AiEnginePreference, AppSettings, ServerEngineStatus } from '../types';
import { GEOPOLITICAL_TOPICS, GeopoliticalTopicId } from '../utils/topicFilter';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  engineStatus: ServerEngineStatus | null;
  openRouterKey: string;
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onSaveOpenRouterKey: (key: string) => void;
}

const RECOMMENDED_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash (تېز ۋە ئىقتىسادچان)' },
  { id: 'google/gemma-3-27b-it:free', label: 'Google Gemma 3 27B (ھەقسىز — Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta Llama 3.3 70B (ھەقسىز — Free)' },
  { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Anthropic Claude 3.5 Sonnet' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Meta Llama 3.3 70B Instruct' },
];

export function SettingsModal({
  isOpen,
  settings,
  engineStatus,
  openRouterKey,
  onClose,
  onUpdateSettings,
  onSaveOpenRouterKey,
}: SettingsModalProps) {
  const [draftKey, setDraftKey] = useState(openRouterKey);
  const [showKey, setShowKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraftKey(openRouterKey);
      setSaveMessage(null);
      setTestState('idle');
      setTestMessage('');
    }
  }, [isOpen, openRouterKey]);

  if (!isOpen) return null;

  const hasOpenRouterActive = Boolean(openRouterKey.trim() || engineStatus?.openRouterConfigured);
  const showOpenRouterBox = settings.preferredEngine === 'openrouter';

  const handleSaveKeyClick = () => {
    const cleaned = draftKey.trim();
    onSaveOpenRouterKey(cleaned);
    setTestState('idle');
    setTestMessage('');
    setSaveMessage(
      cleaned
        ? 'OpenRouter ئاچقۇچى يەرلىك كومپيۇتېرىڭىزغا بىخەتەر ساقلاندى.'
        : 'OpenRouter ئاچقۇچى ئۆچۈرۈلدى.'
    );
  };

  const handleClearKey = () => {
    setDraftKey('');
    onSaveOpenRouterKey('');
    setTestState('idle');
    setTestMessage('');
    setSaveMessage('OpenRouter ئاچقۇچى تازىلاندى.');
  };

  const handleTestConnection = async () => {
    const keyToTest = draftKey.trim();
    if (!keyToTest && !engineStatus?.openRouterConfigured) {
      setTestState('error');
      setTestMessage('ئاۋۋال OpenRouter ئاچقۇچىنى كىرگۈزۈڭ.');
      return;
    }

    // سىناشتىن بۇرۇن ئاچقۇچنى يەرلىك ساقلاپ قويۇش
    if (keyToTest) {
      onSaveOpenRouterKey(keyToTest);
    }

    setTestState('testing');
    setTestMessage('');
    try {
      const res = await fetch('/api/openrouter/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keyToTest ? { 'X-OpenRouter-Key': keyToTest } : {}),
        },
      });
      const data = (await res.json()) as { ok?: boolean; label?: string; error?: string };
      if (!res.ok || !data.ok) {
        setTestState('error');
        setTestMessage(data.error || 'OpenRouter ئۇلىنىشى مەغلۇپ بولدى.');
        return;
      }
      setTestState('ok');
      setTestMessage(`ئۇلىنىش مۇۋەپپەقىيەتلىك تەستىقلاندى (${data.label || 'OpenRouter'}).`);
    } catch {
      setTestState('error');
      setTestMessage('مۇلازىمېتىرغا ئۇلىنىشتا خاتالىق كۆرۈلدى.');
    }
  };

  const toggleTopic = (id: GeopoliticalTopicId) => {
    const exists = settings.enabledTopics.includes(id);
    if (exists && settings.enabledTopics.length <= 1) {
      return;
    }
    const nextTopics = exists
      ? settings.enabledTopics.filter((t) => t !== id)
      : [...settings.enabledTopics, id];
    onUpdateSettings({ ...settings, enabledTopics: nextTopics });
  };

  const selectAllTopics = () => {
    onUpdateSettings({
      ...settings,
      enabledTopics: GEOPOLITICAL_TOPICS.map((t) => t.id),
    });
  };

  const engineOptions: { id: AiEnginePreference; label: string; desc: string }[] = [
    {
      id: 'auto',
      label: 'ئاپتوماتىك تاللاش',
      desc: 'OpenRouter ئاچقۇچى بولسا شۇنى، بولمىسا Gemini نى ئىشلىتىدۇ',
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      desc: 'باسقاندا OpenRouter ئاچقۇچ سېلىش كۆزنىكى ئېچىلىدۇ',
    },
    {
      id: 'gemini',
      label: 'Gemini AI',
      desc: 'سىستېمىغا ئورنىتىلغان مۇلازىمېتىر Gemini ماتورىنى ئىشلىتىدۇ',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2
              id="settings-modal-title"
              className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]"
            >
              پىروگىرامما تەڭشەكلىرى
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              OpenRouter ئاچقۇچى، ئۇيغۇرچە تەرجىمە، كۈندىلىك يېڭىلاش ۋە 8 گېئوسىياسىي تېما سۈزگۈچى
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="تەڭشەكنى تاقاش"
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* 1. OpenRouter & Translation Engine Section */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Server className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>AI تەرجىمە ۋە خۇلاسە ماتورى (OpenRouter / Gemini)</span>
              </div>
              <span className="text-xs font-bold text-[var(--accent-primary)]">
                {hasOpenRouterActive ? 'OpenRouter تەييار' : 'Gemini ئاكتىپ'}
              </span>
            </div>

            <div className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-5 space-y-5">
              {/* Engine Preference Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {engineOptions.map((opt) => {
                  const selected = settings.preferredEngine === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, preferredEngine: opt.id })}
                      className={`text-right p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-[var(--bg-card)] border-[var(--accent-primary)]'
                          : 'bg-transparent border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <div
                        className={`text-sm font-bold mb-1 ${
                          selected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* OpenRouter Key Input Panel — opens immediately when OpenRouter is selected */}
              {showOpenRouterBox && (
                <div className="pt-5 border-t border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="openrouter-key-input"
                      className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"
                    >
                      <KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>ئاچقۇچ سېلىڭ (OpenRouter API Key)</span>
                    </label>
                    {openRouterKey && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        ئاچقۇچ ساقلانغان
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="openrouter-key-input"
                      type={showKey ? 'text' : 'password'}
                      dir="ltr"
                      value={draftKey}
                      onChange={(e) => {
                        setDraftKey(e.target.value);
                        setSaveMessage(null);
                      }}
                      placeholder="sk-or-v1-..."
                      autoComplete="off"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-left focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      aria-label={showKey ? 'ئاچقۇچنى يوشۇرۇش' : 'ئاچقۇچنى كۆرسىتىش'}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Model Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="openrouter-model-select"
                        className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                      >
                        تەۋسىيە قىلىنغان مودېللار
                      </label>
                      <select
                        id="openrouter-model-select"
                        value={
                          RECOMMENDED_MODELS.some((m) => m.id === settings.openRouterModel)
                            ? settings.openRouterModel
                            : '__custom__'
                        }
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') {
                            onUpdateSettings({ ...settings, openRouterModel: e.target.value });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      >
                        {RECOMMENDED_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                        <option value="__custom__">باشقا مودېل (ئۆزۈم كىرگۈزىمەن)</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="openrouter-model-input"
                        className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                      >
                        مودېل نامى (OpenRouter Model ID)
                      </label>
                      <input
                        id="openrouter-model-input"
                        type="text"
                        dir="ltr"
                        value={settings.openRouterModel}
                        onChange={(e) =>
                          onUpdateSettings({ ...settings, openRouterModel: e.target.value })
                        }
                        placeholder="google/gemini-2.5-flash"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] text-left focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    ئاچقۇچ پەقەت ئۆز كومپيۇتېرىڭىزنىڭ يەرلىك ساقلىغۇچىدا ساقلىنىدۇ؛ خالىسىڭىز
                    تۈر ئىچىدىكى .env ھۆججىتىدىكى OPENROUTER_API_KEY نىمۇ ئىشلىتەلەيسىز.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveKeyClick}
                      className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                    >
                      ئاچقۇچنى ساقلاش
                    </button>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testState === 'testing'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {testState === 'testing' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{testState === 'testing' ? 'سىناۋاتىدۇ...' : 'ئۇلىنىشنى سىناش'}</span>
                    </button>

                    {openRouterKey && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ئاچقۇچنى ئۆچۈرۈش</span>
                      </button>
                    )}
                  </div>

                  {saveMessage && (
                    <div className="text-xs font-medium text-[var(--accent-primary)]">
                      {saveMessage}
                    </div>
                  )}

                  {testState === 'ok' && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                      {testMessage}
                    </div>
                  )}

                  {testState === 'error' && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                      {testMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 2. Uyghur Auto-Translation & Daily Auto-Refresh */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-1.5">
                  <Languages className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>ئاپتوماتىك ئۇيغۇرچە تەرجىمە</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  يېڭى يىغىلغان ئەرەبچە، ئىنگلىزچە ۋە تۈركچە ماۋزۇ ۋە تېكىستلارنى دەرھال
                  ئەدەبىي ئۇيغۇر تىلىغا تەرجىمە قىلىپ كۆرسىتىدۇ.
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  ھالىتى: {settings.autoTranslateToUyghur ? 'ئېچىق' : 'تاقاق'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoTranslateToUyghur}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      autoTranslateToUyghur: !settings.autoTranslateToUyghur,
                    })
                  }
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    settings.autoTranslateToUyghur
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {settings.autoTranslateToUyghur ? 'ئاكتىپ' : 'ئېتىك'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-1.5">
                  <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>كۈندىلىك ئاپتوماتىك يېڭىلاش</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  ھەر كۈنى يېڭى كۈنگە ئۆتكەندە ياكى بەلگىلەنگەن سائەت ئارىلىقىدا يېڭى
                  ئانالىزلارنى ئۆزلۈكىدىن يىغىپ يېڭىلاپ تۇرىدۇ.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <select
                  value={settings.refreshIntervalHours}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      refreshIntervalHours: Number(e.target.value),
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value={3}>ھەر 3 سائەتتە</option>
                  <option value={6}>ھەر 6 سائەتتە</option>
                  <option value={12}>ھەر 12 سائەتتە</option>
                  <option value={24}>كۈندە بىر قېتىم (24 سائەت)</option>
                </select>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoDailyRefresh}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      autoDailyRefresh: !settings.autoDailyRefresh,
                    })
                  }
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    settings.autoDailyRefresh
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {settings.autoDailyRefresh ? 'ئاكتىپ' : 'ئېتىك'}
                </button>
              </div>
            </div>
          </section>

          {/* 3. 8 Geopolitical Topics Strict Filter */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Compass className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>8 مەركىزىي گېئوسىياسىي تېما سۈزگۈچى</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAllTopics}
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                >
                  ھەممىسىنى تاللاش
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.strictGeopoliticalFilter}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      strictGeopoliticalFilter: !settings.strictGeopoliticalFilter,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    settings.strictGeopoliticalFilter
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {settings.strictGeopoliticalFilter
                      ? 'قاتتىق سۈزۈش ئاكتىپ (ئىجتىمائىي چەكلەنگەن)'
                      : 'قاتتىق سۈزۈش ئېتىك'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GEOPOLITICAL_TOPICS.map((topic) => {
                const enabled = settings.enabledTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`text-right p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      enabled
                        ? 'bg-[var(--bg-card-soft)] border-[var(--accent-primary)]/60'
                        : 'bg-transparent border-[var(--border-subtle)] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        <span className="text-[var(--accent-primary)] tabular-nums ml-1.5">
                          {topic.order}.
                        </span>
                        {topic.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {topic.description}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold shrink-0 mt-0.5 ${
                        enabled ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {enabled ? 'ئاكتىپ' : 'تاقاق'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-7 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
          >
            ساقلاش ۋە تاقاش
          </button>
        </div>
      </div>
    </div>
  );
}
