import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type AuditRequest = {
  action?: unknown;
  actionLabel?: unknown;
  pageUrl?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as AuditRequest;
    const action = typeof body.action === 'string' ? body.action : 'page_view';
    const actionLabel = typeof body.actionLabel === 'string' ? body.actionLabel : '访问页面';
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : null;

    await recordAuditLog({ action, actionLabel, pageUrl });
    return Response.json({ ok: true });
  } catch (error) {
    console.warn('[audit] api log failed', error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
