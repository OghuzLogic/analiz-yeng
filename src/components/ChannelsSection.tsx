import { useState, useRef } from 'react';
import {
  Download,
  ExternalLink,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { AnalysisItem, ChannelConfig, LanguageCode } from '../types';
import { buildChromeManifestV3Json } from '../utils/storage';
import { enforceUyghurTerminology } from '../utils/terminology';

interface ChannelsSectionProps {
  channels: ChannelConfig[];
  analyses: AnalysisItem[];
  onToggleChannel: (id: string) => void;
  onAddChannel: (channel: ChannelConfig) => void;
  onDeleteChannel: (id: string) => void;
  onImportAnalyses: (items: AnalysisItem[]) => void;
}

export function ChannelsSection({
  channels,
  analyses,
  onToggleChannel,
  onAddChannel,
  onDeleteChannel,
  onImportAnalyses,
}: ChannelsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('ar');
  const [rssUrl, setRssUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [focus, setFocus] = useState('');
  const [formError, setFormError] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [bannerError, setBannerError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped: { lang: LanguageCode; title: string; list: ChannelConfig[] }[] = [
    {
      lang: 'ar',
      title: 'ئەرەبچە نوپۇزلۇق قاناللار',
      list: channels.filter((c) => c.language === 'ar'),
    },
    {
      lang: 'en',
      title: 'ئىنگلىزچە نوپۇزلۇق قاناللار',
      list: channels.filter((c) => c.language === 'en'),
    },
    {
      lang: 'tr',
      title: 'تۈركچە نوپۇزلۇق قاناللار',
      list: channels.filter((c) => c.language === 'tr'),
    },
  ];

  const handleAddChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rssUrl.trim().startsWith('http')) {
      setFormError('قانال نامى ۋە توغرا RSS/Atom ئادرېسىنى (https://...) كىرگۈزۈڭ.');
      return;
    }
    let resolvedSite = siteUrl.trim();
    if (!resolvedSite) {
      try {
        resolvedSite = new URL(rssUrl.trim()).origin;
      } catch {
        resolvedSite = rssUrl.trim();
      }
    }

    const newChannel: ChannelConfig = {
      id: `custom_${Date.now()}`,
      name: enforceUyghurTerminology(name.trim()),
      nativeName: name.trim(),
      language,
      rssUrl: rssUrl.trim(),
      siteUrl: resolvedSite,
      focus: enforceUyghurTerminology(focus.trim() || 'ئىختىيارىي ئانالىز قانىلى'),
      enabled: true,
      isCustom: true,
    };

    onAddChannel(newChannel);
    setName('');
    setRssUrl('');
    setSiteUrl('');
    setFocus('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleExportArchive = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'ئانالىزلار',
        analyses,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analizlar-archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadManifestV3 = () => {
    const manifestJson = buildChromeManifestV3Json();
    const blob = new Blob([manifestJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { analyses?: AnalysisItem[] } | AnalysisItem[];
      const list = Array.isArray(parsed) ? parsed : parsed.analyses;
      if (!Array.isArray(list)) {
        setImportNotice('ھۆججەت فورماتى توغرا ئەمەس.');
        return;
      }
      onImportAnalyses(list);
      setImportNotice(`${list.length} پارچە ئانالىز يەرلىك ئارخىپقا مۇۋەپپەقىيەتلىك كىرگۈزۈلدى.`);
    } catch {
      setImportNotice('JSON ھۆججىتىنى ئوقۇشتا خاتالىق كۆرۈلدى.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section id="channels" className="py-16 border-t border-[var(--border-subtle)]">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="editorial-eyebrow editorial-eyebrow-start mb-2">
              نوپۇزلۇق مەنبەلەر
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              ئانالىز <span className="text-[var(--accent-primary)]">قاناللىرى</span> ۋە
              يەرلىك مەخپىيەتلىك
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer self-start md:self-auto whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'جەدۋەلنى يېپىش' : 'يېڭى RSS قانال قوشۇش'}</span>
          </button>
        </div>

        {/* Custom Channel Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddChannelSubmit}
            className="editorial-card rounded-[24px] p-6 mb-10 space-y-4"
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              يېڭى ئانالىز قانىلى قوشۇش
            </h3>
            {formError && (
              <div className="text-sm text-red-700 dark:text-red-300">{formError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="قانال نامى (ئۇيغۇرچە)"
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="ar">ئەرەبچە</option>
                <option value="en">ئىنگلىزچە</option>
                <option value="tr">تۈركچە</option>
              </select>
              <input
                type="url"
                dir="ltr"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="https://example.com/rss"
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-left focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="تەتقىقات يۆنىلىشى"
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] cursor-pointer"
              >
                بىكار قىلىش
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                قانال قوشۇش
              </button>
            </div>
          </form>
        )}

        {/* 3 Language Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 mb-14">
          {grouped.map((group) => (
            <div key={group.lang} className="editorial-card rounded-[24px] p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{group.title}</h3>
                <span className="text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
                  {group.list.filter((c) => c.enabled).length} / {group.list.length}
                </span>
              </div>

              <ul className="divide-y divide-[var(--border-subtle)]">
                {group.list.map((ch) => (
                  <li key={ch.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          {ch.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                          {ch.focus}
                        </div>
                        <a
                          href={ch.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-primary)] hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{ch.nativeName}</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ch.isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteChannel(ch.id)}
                            aria-label="قانالنى ئۆچۈرۈش"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={ch.enabled}
                          onClick={() => onToggleChannel(ch.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            ch.enabled
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {ch.enabled ? 'ئاكتىپ' : 'تاقاق'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Privacy, Local Storage & Chrome MV3 Export Editorial Banner */}
        <div className="editorial-card rounded-[28px] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 relative min-h-[220px] bg-[var(--bg-card-soft)]">
            {!bannerError ? (
              <img
                src="/src/assets/images/editorial_archive_library_1795280670702.jpg"
                alt="يەرلىك تەتقىقات ئارخىپخانىسى"
                referrerPolicy="no-referrer"
                onError={() => setBannerError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[var(--bg-card-soft)] to-[var(--accent-soft)]">
                <ShieldCheck className="w-12 h-12 text-[var(--accent-primary)]" />
              </div>
            )}
          </div>

          <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-center">
            <div className="text-xs font-bold text-[var(--accent-primary)] mb-2">
              مەخپىيەتلىك ۋە يەرلىك ساقلاش ئامبىرى
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              تولۇق يەرلىك IndexedDB ئارخىپى ۋە Chrome MV3 قېلىپى
            </h3>
            <div className="uyghur-prose text-sm text-[var(--text-secondary)] mb-6">
              <p>
                بارلىق ئانالىز، خۇلاسە، تەھرىر ۋە قانال تەڭشەكلىرىڭىز پەقەت ئۆز
                كومپيۇتېرىڭىزنىڭ IndexedDB ئامبىرىدا ساقلىنىدۇ. ھېچقانداق ئىز قوغلاش
                كودى ياكى تاشقى خىتاي مۇلازىمىتى يوق. خالىغان چاغدا ئارخىپىڭىزنى JSON
                ھۆججىتى قىلىپ زاپاسلىيالايسىز ياكى Chrome Manifest V3 قېلىپىنى چۈشۈرۈپ
                ئىشلىتەلەيسىز.
              </p>
            </div>

            {importNotice && (
              <div className="mb-4 text-xs font-semibold text-[var(--accent-primary)]">
                {importNotice}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportArchive}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ئارخىپنى زاپاسلاش (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>زاپاسنى ئەسلىگە كەلتۈرۈش</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleDownloadManifestV3}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card-soft)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Chrome MV3 (manifest.json)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
