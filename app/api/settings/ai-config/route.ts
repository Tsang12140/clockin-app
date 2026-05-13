import {
  getAIConfigStatus,
  saveAIProviderConfig,
  testAIProviderConfig,
  verifyDeveloperPassword,
  listPresets,
  savePreset,
  deletePreset,
} from '@/lib/ai/config';

export const dynamic = 'force-dynamic';

type AIConfigRequest = {
  action?: 'status' | 'save' | 'test' | 'list-presets' | 'save-preset' | 'delete-preset';
  password?: unknown;
  enabled?: unknown;
  provider?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  rulesPrompt?: unknown;
  apiKey?: unknown;
  presetId?: unknown;
  notes?: unknown;
  id?: unknown;
};

function badRequest(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as AIConfigRequest;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!verifyDeveloperPassword(password)) {
      return badRequest('开发者密码不正确。', 401);
    }

    if (body.action === 'save') {
      const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl : '';
      const model = typeof body.model === 'string' ? body.model : '';
      if (!baseUrl.trim() || !model.trim()) {
        return badRequest('Base URL 和模型不能为空。');
      }

      const status = await saveAIProviderConfig({
        enabled: body.enabled === true,
        provider: typeof body.provider === 'string' ? body.provider : 'custom',
        baseUrl,
        model,
        rulesPrompt: typeof body.rulesPrompt === 'string' ? body.rulesPrompt : '',
        apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
        presetId: typeof body.presetId === 'string' ? body.presetId : undefined,
      });
      return Response.json({ ok: true, status });
    }

    if (body.action === 'test') {
      const result = await testAIProviderConfig({
        enabled: true,
        provider: typeof body.provider === 'string' ? body.provider : undefined,
        baseUrl: typeof body.baseUrl === 'string' ? body.baseUrl : undefined,
        model: typeof body.model === 'string' ? body.model : undefined,
        apiKey: typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey : undefined,
        presetId: typeof body.presetId === 'string' ? body.presetId : undefined,
      });
      return Response.json(result);
    }

    if (body.action === 'list-presets') {
      const presets = await listPresets();
      return Response.json({ ok: true, presets });
    }

    if (body.action === 'save-preset') {
      const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl : '';
      const model = typeof body.model === 'string' ? body.model : '';
      if (!baseUrl.trim() || !model.trim()) {
        return badRequest('Base URL 和模型不能为空。');
      }
      const preset = await savePreset({
        notes: typeof body.notes === 'string' ? body.notes : '',
        provider: typeof body.provider === 'string' ? body.provider : 'custom',
        baseUrl,
        model,
        rulesPrompt: typeof body.rulesPrompt === 'string' ? body.rulesPrompt : '',
        apiKey: typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey : undefined,
        fromPresetId: typeof body.presetId === 'string' ? body.presetId : undefined,
      });
      return Response.json({ ok: true, preset });
    }

    if (body.action === 'delete-preset') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!id) return badRequest('缺少预设 ID。');
      await deletePreset(id);
      return Response.json({ ok: true });
    }

    const status = await getAIConfigStatus();
    return Response.json({ ok: true, status });
  } catch (error) {
    console.error('[ai-config] request failed', error);
    return badRequest('AI 配置处理失败。', 500);
  }
}
