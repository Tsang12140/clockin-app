import { answerAttendanceAssistantStream, type AssistantPlan } from '@/lib/ai/attendanceAssistant';
import { saveAIChatLog } from '@/lib/ai/history';
import { getSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const aiUserId = session.userId ?? session.userPhone ?? 'user';
    const rateKey = `ai:${aiUserId}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateKey);
    if (!allowed) {
      return Response.json(
        { reply: `发送太频繁了，请 ${Math.ceil(retryAfterMs / 1000)} 秒后再试。`, actions: [], mode: 'rules' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }
    const body = await request.json() as {
      message?: unknown;
      history?: unknown;
      pageUrl?: unknown;
      lastPlan?: unknown;
    };
    const message = typeof body.message === 'string' ? body.message : '';
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : null;
    const history = Array.isArray(body.history)
      ? body.history
        .filter((item): item is { role: 'user' | 'assistant'; text: string } => {
          if (!item || typeof item !== 'object') return false;
          const record = item as Record<string, unknown>;
          return (record.role === 'user' || record.role === 'assistant') && typeof record.text === 'string';
        })
        .slice(-20)
      : [];
    const lastPlan = body.lastPlan && typeof body.lastPlan === 'object'
      ? body.lastPlan as AssistantPlan
      : null;

    const encoder = new TextEncoder();
    const userPhone = session.userPhone ?? null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const result of answerAttendanceAssistantStream(message, history, lastPlan, pageUrl)) {
            const event = `data: ${JSON.stringify({ type: 'answer', ...result })}\n\n`;
            controller.enqueue(encoder.encode(event));
            if (message) {
              saveAIChatLog({
                userId: aiUserId,
                userPhone,
                userMessage: message,
                assistantReply: result.reply,
                mode: result.mode,
                pageUrl,
                actions: result.actions,
              }).catch(() => {});
            }
          }
        } catch (error) {
          console.error('[ai-assistant] stream error', error);
          const errorEvent = `data: ${JSON.stringify({ type: 'answer', reply: '刚才没有查成功，稍后再试一下。', actions: [], mode: 'rules' })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[ai-assistant] request failed', error);
    return Response.json(
      { reply: '刚才没有查成功，稍后再试一下。', actions: [], mode: 'rules' },
      { status: 500 },
    );
  }
}
