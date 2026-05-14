'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ChevronLeft, EyeOff, Loader2, Save, ShieldCheck, TestTube2, Trash2 } from 'lucide-react';

type AIConfigStatus = {
  enabled: boolean;
  provider: string;
  apiStyle: 'openai-chat';
  baseUrl: string;
  model: string;
  rulesPrompt: string;
  hasApiKey: boolean;
  updatedAt: string | null;
};

type PresetSummary = {
  id: string;
  notes: string;
  provider: string;
  baseUrl: string;
  model: string;
  rulesPrompt: string;
  hasApiKey: boolean;
  createdAt: string;
};

const providerOptions = [
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
  { value: 'custom', label: '自定义', baseUrl: '', model: '' },
];

export default function AIConfigPage() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(true);
  const [status, setStatus] = useState<AIConfigStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState('deepseek');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');
  const [model, setModel] = useState('deepseek-v4-flash');
  const [rulesPrompt, setRulesPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Preset state
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetNotes, setPresetNotes] = useState('');

  const applyStatus = (next: AIConfigStatus) => {
    setStatus(next);
    setEnabled(next.enabled);
    setProvider(next.provider);
    setBaseUrl(next.baseUrl);
    setModel(next.model);
    setRulesPrompt(next.rulesPrompt);
    setApiKey('');
    setSelectedPresetId(null);
  };

  const callApi = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/settings/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.message || '操作失败');
    return data;
  };

  useEffect(() => {
    let active = true;
    setBusy(true);
    setMessage('');
    Promise.all([
      callApi({ action: 'status' }),
      callApi({ action: 'list-presets' }),
    ]).then(([statusData, presetsData]) => {
      if (!active) return;
      applyStatus(statusData.status);
      setPresets(presetsData.presets ?? []);
    }).catch(error => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : '加载 AI 配置失败。');
    }).finally(() => {
      if (active) setBusy(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const [statusData, presetsData] = await Promise.all([
        callApi({ action: 'status' }),
        callApi({ action: 'list-presets' }),
      ]);
      applyStatus(statusData.status);
      setPresets(presetsData.presets ?? []);
      setUnlocked(true);
      setMessage('已进入 AI 配置。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '开发者密码不正确。');
    } finally {
      setBusy(false);
    }
  };

  const changeProvider = (value: string) => {
    setProvider(value);
    const opt = providerOptions.find(item => item.value === value);
    if (!opt || value === 'custom') return;
    setBaseUrl(opt.baseUrl);
    setModel(opt.model);
  };

  const loadPreset = (preset: PresetSummary) => {
    setProvider(preset.provider);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setRulesPrompt(preset.rulesPrompt);
    setApiKey(preset.hasApiKey ? '****' : '');
    setSelectedPresetId(preset.id);
    setMessage(`已载入预设 ${preset.id}${preset.notes ? ' · ' + preset.notes : ''}。`);
  };

  const save = async () => {
    setBusy(true);
    setMessage('');
    const nextEnabled = enabled || Boolean(apiKey.trim() && apiKey !== '****');
    const isKeyPlaceholder = apiKey === '****';
    try {
      const data = await callApi({
        action: 'save',
        enabled: nextEnabled || enabled,
        provider,
        baseUrl,
        model,
        rulesPrompt,
        apiKey: isKeyPlaceholder ? '' : apiKey,
        presetId: isKeyPlaceholder && selectedPresetId ? selectedPresetId : undefined,
      });
      applyStatus(data.status);
      setMessage(data.status.enabled ? '已保存，聊天会调用 AI。' : '已保存，AI 仍处于关闭状态。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败。');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setMessage('');
    try {
      const isKeyPlaceholder = apiKey === '****';
      const data = await callApi({
        action: 'test',
        provider,
        baseUrl,
        model,
        apiKey: isKeyPlaceholder ? '' : apiKey,
        presetId: isKeyPlaceholder && selectedPresetId ? selectedPresetId : undefined,
      });
      setMessage(data.message || '测试完成。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '测试失败。');
    } finally {
      setBusy(false);
    }
  };

  const savePreset = async () => {
    setBusy(true);
    setMessage('');
    const isKeyPlaceholder = apiKey === '****';
    try {
      const data = await callApi({
        action: 'save-preset',
        notes: presetNotes,
        provider,
        baseUrl,
        model,
        rulesPrompt,
        apiKey: isKeyPlaceholder ? '' : apiKey,
        presetId: isKeyPlaceholder && selectedPresetId ? selectedPresetId : undefined,
      });
      setPresets(prev => [...prev, data.preset]);
      setPresetNotes('');
      setShowSavePreset(false);
      setMessage(`预设 ${data.preset.id} 已保存。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存预设失败。');
    } finally {
      setBusy(false);
    }
  };

  const deletePreset = async (id: string) => {
    setBusy(true);
    setMessage('');
    try {
      await callApi({ action: 'delete-preset', id });
      setPresets(prev => prev.filter(p => p.id !== id));
      if (selectedPresetId === id) {
        setSelectedPresetId(null);
        setApiKey('');
      }
      setDeleteConfirmId(null);
      setMessage(`预设 ${id} 已删除。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <div className="mx-auto max-w-2xl md:px-6 md:py-5">
        <div className="flex items-center bg-white px-4 pb-4 pt-5 shadow-sm md:rounded-2xl">
          <Link href="/settings/developer" className="mr-3 p-1 text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1A3A8F]">AI 助手配置</h1>
        </div>

        <div className="space-y-3 px-3 py-3 md:px-0">
          {!unlocked ? (
            <form onSubmit={unlock} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF0FF] text-[#3370FF]">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-gray-800">开发者验证</div>
                  <div className="text-[12px] text-gray-400">输入 4 位密码后才能查看和修改 AI 配置</div>
                </div>
              </div>
              <input
                value={password}
                onChange={event => setPassword(event.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                type="password"
                autoComplete="off"
                className="h-12 w-full rounded-xl bg-[#F0F4FA] px-4 text-center text-[20px] font-semibold tracking-[0.35em] text-[#1A3A8F] outline-none"
                placeholder="••••"
              />
              <button
                type="submit"
                disabled={busy || password.length !== 4}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#3370FF] text-[15px] font-semibold text-white shadow-sm disabled:opacity-40"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : '进入配置'}
              </button>
            </form>
          ) : (
            <>
              {/* Saved presets */}
              {presets.length > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-3 text-[13px] font-semibold text-gray-700">已保存配置</div>
                  <div className="space-y-2">
                    {presets.map(preset => (
                      <div
                        key={preset.id}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${selectedPresetId === preset.id ? 'bg-[#EBF0FF]' : 'bg-[#F0F4FA]'}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                            <span className="font-mono text-[12px] text-[#3370FF]">{preset.id}</span>
                            {preset.notes && (
                              <span className="truncate text-gray-500">· {preset.notes}</span>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-gray-400">
                            {preset.model}{preset.hasApiKey ? ' · Key: ****' : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadPreset(preset)}
                          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-[#3370FF] shadow-sm"
                        >
                          加载
                        </button>
                        {deleteConfirmId === preset.id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => deletePreset(preset.id)}
                              disabled={busy}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
                            >
                              确认删除
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg bg-white px-2 py-1.5 text-[12px] text-gray-400 shadow-sm"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(preset.id)}
                            className="shrink-0 rounded-lg bg-white p-1.5 text-gray-400 shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main config form */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-gray-800">AI 开关</div>
                    <div className="text-[12px] text-gray-400">
                      {enabled ? '聊天会调用已配置的 AI' : '关闭后聊天只使用本地规则'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnabled(value => !value)}
                    className={`relative h-7 w-[52px] rounded-full transition-colors ${enabled ? 'bg-[#3370FF]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {status?.hasApiKey && !enabled && (
                  <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-700">
                    API Key 已保存，但 AI 开关还没打开；现在聊天仍然是本地规则。
                  </div>
                )}

                <div className="grid gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-gray-600">Provider</span>
                    <select
                      value={provider}
                      onChange={event => changeProvider(event.target.value)}
                      className="h-11 rounded-xl bg-[#F0F4FA] px-3 text-[14px] text-gray-800 outline-none"
                    >
                      {providerOptions.map(item => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-gray-600">Base URL</span>
                    <input
                      value={baseUrl}
                      onChange={event => setBaseUrl(event.target.value)}
                      className="h-11 rounded-xl bg-[#F0F4FA] px-3 text-[14px] text-gray-800 outline-none"
                      placeholder="https://api.deepseek.com"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-gray-600">Model</span>
                    <input
                      value={model}
                      onChange={event => setModel(event.target.value)}
                      className="h-11 rounded-xl bg-[#F0F4FA] px-3 text-[14px] text-gray-800 outline-none"
                      placeholder="deepseek-v4-flash"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="flex items-center justify-between text-[13px] font-medium text-gray-600">
                      <span>API Key</span>
                      <span className="flex items-center gap-1 text-[12px] font-normal text-gray-400">
                        <EyeOff size={13} />
                        {status?.hasApiKey ? '已配置，留空则保留' : '尚未配置'}
                      </span>
                    </span>
                    <input
                      value={apiKey}
                      onChange={event => {
                        setApiKey(event.target.value);
                        if (event.target.value !== '****') setSelectedPresetId(null);
                      }}
                      type="password"
                      autoComplete="off"
                      className="h-11 rounded-xl bg-[#F0F4FA] px-3 text-[14px] text-gray-800 outline-none"
                      placeholder={status?.hasApiKey ? '输入新 Key 才会覆盖' : '填入 API Key'}
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-gray-600">助手规则 Prompt</span>
                    <textarea
                      value={rulesPrompt}
                      onChange={event => setRulesPrompt(event.target.value)}
                      rows={8}
                      className="min-h-38 resize-y rounded-xl bg-[#F0F4FA] px-3 py-3 text-[13px] leading-5 text-gray-800 outline-none placeholder:text-gray-400"
                      placeholder={'回答必须简短，先说结论。\n问异常时，休息日不算异常。\n没有数据就说未查询到。'}
                    />
                    <span className="text-[11px] leading-4 text-gray-400">
                      这里适合写表达风格和业务口径。安全限制、数据库查询和页面跳转仍由后端固定控制。
                    </span>
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={test}
                    disabled={busy}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F0F4FA] text-[14px] font-semibold text-[#1A3A8F] disabled:opacity-40"
                  >
                    <TestTube2 size={16} />
                    测试连接
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3370FF] text-[14px] font-semibold text-white shadow-sm disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    保存
                  </button>
                </div>

                {/* Save as preset */}
                <div className="mt-3 border-t border-gray-50 pt-3">
                  {!showSavePreset ? (
                    <button
                      type="button"
                      onClick={() => setShowSavePreset(true)}
                      className="w-full rounded-xl bg-[#F0F4FA] py-2.5 text-[13px] font-medium text-gray-500"
                    >
                      另存为预设…
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={presetNotes}
                        onChange={event => setPresetNotes(event.target.value)}
                        placeholder="备注（可选）"
                        className="h-10 flex-1 rounded-xl bg-[#F0F4FA] px-3 text-[13px] text-gray-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={savePreset}
                        disabled={busy}
                        className="h-10 rounded-xl bg-[#3370FF] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : '保存'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSavePreset(false); setPresetNotes(''); }}
                        className="h-10 rounded-xl bg-[#F0F4FA] px-3 text-[13px] text-gray-400"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-[12px] leading-5 text-gray-500 shadow-sm">
                API Key 加密保存在服务器本地，不会再次显示在页面里。当前协议使用 OpenAI Chat Completions 兼容格式，DeepSeek 这类兼容接口可以直接用。
                {status?.updatedAt && (
                  <div className="mt-2 text-gray-400">上次保存：{new Date(status.updatedAt).toLocaleString('zh-CN')}</div>
                )}
              </div>
            </>
          )}

          {message && (
            <div className="rounded-xl bg-white px-4 py-3 text-[13px] text-[#1A3A8F] shadow-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
