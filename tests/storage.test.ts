import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildChromeManifestV3Json,
  clearOpenRouterKey,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_SETTINGS,
  loadAppSettings,
  loadCustomGlossaryRules,
  loadOpenRouterKey,
  saveAppSettings,
  saveCustomGlossaryRules,
  saveOpenRouterKey,
} from '../src/utils/storage';
import type { AppSettings, GlossaryRule } from '../src/types';

/**
 * يەرلىك تەڭشەك ساقلاش (localStorage Stub) ۋە Chrome Manifest V3 بىخەتەرلىك تېستلىرى
 */
describe('storage — تەڭشەكلەر ۋە Chrome MV3 مەخپىيەتلىك ئۆلچىمى', () => {
  const memoryStore = new Map<string, string>();

  beforeEach(() => {
    memoryStore.clear();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => memoryStore.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        memoryStore.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        memoryStore.delete(key);
      }),
      clear: vi.fn(() => {
        memoryStore.clear();
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('TC-ST-01: ساقلانغان تەڭشەك بولمىغاندا سۈكۈتتىكى تەڭشەكلەرنى قايتۇرۇشى كېرەك', () => {
    const loaded = loadAppSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
    expect(loaded.enabledTopics).toHaveLength(8);
    expect(loaded.autoTranslateToUyghur).toBe(true);
    expect(loaded.strictGeopoliticalFilter).toBe(true);
  });

  it('TC-ST-02: ئىشلەتكۈچى تەڭشەكلىرىنى يەرلىكتە ساقلاش ۋە قايتا ئوقۇش (Happy Path)', () => {
    const custom: AppSettings = {
      autoTranslateToUyghur: false,
      autoDailyRefresh: true,
      refreshIntervalHours: 12,
      strictGeopoliticalFilter: true,
      enabledTopics: ['east-turkistan', 'central-asia', 'four-straits'],
      preferredEngine: 'openrouter',
      openRouterModel: 'openai/gpt-4o-mini',
    };

    saveAppSettings(custom);
    const loaded = loadAppSettings();
    expect(loaded).toEqual(custom);
    expect(DEFAULT_SETTINGS.openRouterModel).toBe(DEFAULT_OPENROUTER_MODEL);
  });

  it('TC-ST-03: بۇزۇلغان JSON ياكى ناتوغرا قىممەتلەردە بىخەتەر ئەسلىگە قايتىش (Error Case)', () => {
    memoryStore.set('analizlar_settings_v1', '{invalid-json');
    expect(loadAppSettings()).toEqual(DEFAULT_SETTINGS);

    memoryStore.set(
      'analizlar_settings_v1',
      JSON.stringify({
        refreshIntervalHours: -10,
        enabledTopics: [],
        preferredEngine: 'unknown_engine',
      })
    );
    const sanitized = loadAppSettings();
    expect(sanitized.refreshIntervalHours).toBe(DEFAULT_SETTINGS.refreshIntervalHours);
    expect(sanitized.enabledTopics).toEqual(DEFAULT_SETTINGS.enabledTopics);
    expect(sanitized.preferredEngine).toBe('auto');
  });

  it('TC-ST-04: Chrome Manifest V3 قېلىپى ئەڭ ئاز ئىجازەت ۋە مەخپىيەتلىك قائىدىسىگە ئۇيغۇن بولۇشى كېرەك', () => {
    const manifest = JSON.parse(buildChromeManifestV3Json()) as {
      manifest_version: number;
      name: string;
      permissions: string[];
      host_permissions: string[];
      content_security_policy: { extension_pages: string };
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('ئانالىزلار');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.host_permissions).not.toContain('<all_urls>');
    expect(manifest.content_security_policy.extension_pages).toContain("script-src 'self'");

    // خىتاي شىركەتلىرىنىڭ تور دائىرىلىرى قەتئىي بولماسلىقى كېرەك
    const joinedHosts = manifest.host_permissions.join(' ').toLowerCase();
    expect(joinedHosts).not.toMatch(/baidu|tencent|alibaba|aliyun|sina|weibo/);
  });

  it('TC-ST-05: OpenRouter ئاچقۇچىنى يەرلىكتە ساقلاش، ئوقۇش ۋە بىخەتەر ئۆچۈرۈش', () => {
    expect(loadOpenRouterKey()).toBe('');

    saveOpenRouterKey('  sk-or-v1-sample-test-key  ');
    expect(loadOpenRouterKey()).toBe('sk-or-v1-sample-test-key');

    clearOpenRouterKey();
    expect(loadOpenRouterKey()).toBe('');

    // قۇرۇق بوشلۇق ساقلانسا ئاچقۇچ ئۆچۈرۈلىدۇ
    saveOpenRouterKey('sk-or-v1-temp');
    saveOpenRouterKey('   ');
    expect(loadOpenRouterKey()).toBe('');
  });

  it('TC-ST-06: خاس لوغەت ۋە ئىملا قائىدىلىرىنى يەرلىكتە ساقلاش ۋە بۇزۇلغان سانداندىن قوغدىنىش', () => {
    expect(loadCustomGlossaryRules()).toEqual([]);

    const rules: GlossaryRule[] = [
      { id: 'r1', wrong: '  خاتا سۆز  ', correct: '  توغرا سۆز  ', enabled: true },
    ];
    saveCustomGlossaryRules(rules);
    expect(loadCustomGlossaryRules()).toEqual([
      { id: 'r1', wrong: 'خاتا سۆز', correct: 'توغرا سۆز', note: undefined, enabled: true },
    ]);

    memoryStore.set('analizlar_glossary_rules_v1', '{broken-json');
    expect(loadCustomGlossaryRules()).toEqual([]);
  });
});
