import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { listAuditFingerprints, listAuditLogs } from '@/lib/audit';
import { saveAuditNote } from './actions';

export const dynamic = 'force-dynamic';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatUser(name: string | null, phone: string | null) {
  if (name && phone) return `${name} / ${phone}`;
  return name || phone || '未知用户';
}

export default async function AuditPage() {
  const [fingerprints, logs] = await Promise.all([
    listAuditFingerprints(),
    listAuditLogs(),
  ]);

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <div className="mx-auto max-w-5xl md:px-6 md:py-5">
        <div className="flex items-center bg-white px-4 pb-4 pt-5 shadow-sm md:rounded-2xl">
          <Link href="/settings/developer" className="mr-3 p-1 text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-[17px] font-semibold text-[#1A3A8F]">操作日志</h1>
            <div className="mt-0.5 text-[12px] text-gray-400">登录、访问、登记工时和配置修改</div>
          </div>
        </div>

        <div className="grid gap-3 px-3 py-3 md:grid-cols-[360px_minmax(0,1fr)] md:px-0">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-gray-800">设备指纹</h2>
              <span className="text-[12px] text-gray-400">{fingerprints.length} 个</span>
            </div>
            <div className="space-y-2">
              {fingerprints.length === 0 && (
                <div className="rounded-xl bg-[#F8FAFF] px-3 py-6 text-center text-[13px] text-gray-400">
                  暂无日志
                </div>
              )}
              {fingerprints.map(item => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-[#F8FAFF] p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[18px] shadow-sm">
                      {item.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-gray-800">
                        {item.note || formatUser(item.userName, item.userPhone)}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-gray-400">
                        {item.id} · {item.city || '未知'} · {item.ip || '未知IP'}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-gray-400">{item.device || '未知设备'}</div>
                    </div>
                  </div>
                  <form action={saveAuditNote} className="mt-3 flex gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="note"
                      defaultValue={item.note ?? ''}
                      placeholder="备注，比如：老板手机"
                      className="h-9 min-w-0 flex-1 rounded-lg bg-white px-3 text-[13px] text-gray-700 outline-none ring-1 ring-gray-100 focus:ring-[#3370FF]/30"
                    />
                    <button className="h-9 rounded-lg bg-[#3370FF] px-3 text-[13px] font-medium text-white">
                      保存
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-gray-800">最近日志</h2>
              <span className="text-[12px] text-gray-400">最近 {logs.length} 条</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              {logs.length === 0 && (
                <div className="bg-[#F8FAFF] px-3 py-8 text-center text-[13px] text-gray-400">
                  暂无日志
                </div>
              )}
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className={`grid gap-2 px-3 py-3 md:grid-cols-[92px_minmax(0,1fr)_160px] ${index !== logs.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="text-[12px] text-gray-400">{formatTime(log.createdAt)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{log.emoji}</span>
                      <span className="text-[13px] font-semibold text-gray-800">{log.actionLabel}</span>
                    </div>
                    <div className="mt-1 truncate text-[12px] text-gray-400">
                      {formatUser(log.userName, log.userPhone)} · {log.city || '未知'} · {log.device || '未知设备'}
                    </div>
                    {log.pageUrl && (
                      <div className="mt-0.5 truncate text-[12px] text-gray-400">{log.pageUrl}</div>
                    )}
                  </div>
                  <div className="truncate text-[12px] text-gray-400 md:text-right">
                    {log.note || log.fingerprintId}
                    <div className="mt-0.5">{log.ip || '未知IP'}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
