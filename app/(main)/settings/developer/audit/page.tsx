import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listAuditFingerprints, listAuditLogs, type AuditFingerprintItem, type AuditLogItem } from '@/lib/audit';
import { saveAuditNote } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{ view?: string }>;
};

const WRITE_ACTIONS = new Set([
  'save_attendance',
  'unlock_attendance',
  'clear_attendance',
  'create_employee',
  'update_employee',
  'add_rate_history',
  'mark_employee_inactive',
]);

const CONFIG_ACTIONS = new Set(['save_ai_config', 'save_ai_preset', 'delete_ai_preset']);

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

function shortPhone(phone: string | null) {
  if (!phone) return null;
  return phone.length > 4 ? phone.slice(-4) : phone;
}

function shortCity(city: string | null) {
  if (!city || city === '未知') return '未知城市';
  return city
    .replace(/市$/, '')
    .replace(/省$/, '')
    .replace(/壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, '');
}

function deviceType(device: string | null) {
  if (!device) return '未知设备';
  return device.split('·')[0]?.trim() || device;
}

function pageName(pageUrl: string | null) {
  if (!pageUrl) return '未知页面';
  if (pageUrl === '/') return '首页';
  if (pageUrl.startsWith('/salary/')) return '工资条';
  if (pageUrl.startsWith('/salary')) return '月度工资';
  if (pageUrl.startsWith('/employees/')) return '员工详情';
  if (pageUrl.startsWith('/employees')) return '员工管理';
  if (pageUrl.startsWith('/settings/developer/audit')) return '操作日志';
  if (pageUrl.startsWith('/settings/developer/ai-config')) return 'AI 配置';
  if (pageUrl.startsWith('/settings/developer')) return '开发人员选项';
  if (pageUrl.startsWith('/settings')) return '设置';
  if (pageUrl.startsWith('/login')) return '登录页';
  return pageUrl;
}

function actionTone(action: string) {
  if (WRITE_ACTIONS.has(action)) {
    return {
      label: '重点',
      dot: 'bg-[#3370FF]',
      row: 'bg-[#F8FAFF]',
      text: 'text-[#1A3A8F]',
    };
  }
  if (CONFIG_ACTIONS.has(action)) {
    return {
      label: '配置',
      dot: 'bg-purple-400',
      row: 'bg-purple-50/40',
      text: 'text-purple-700',
    };
  }
  if (action === 'login' || action === 'logout') {
    return {
      label: '账号',
      dot: 'bg-green-500',
      row: 'bg-white',
      text: 'text-green-700',
    };
  }
  return {
    label: '访问',
    dot: 'bg-gray-300',
    row: 'bg-white',
    text: 'text-gray-500',
  };
}

function fingerprintSummary(item: Pick<AuditFingerprintItem, 'note' | 'userPhone' | 'device' | 'city'>) {
  if (item.note) return item.note;
  const tail = shortPhone(item.userPhone);
  return [tail ? `尾号${tail}` : '未知账号', deviceType(item.device), shortCity(item.city)].join(' · ');
}

function logActor(log: AuditLogItem) {
  if (log.note) return log.note;
  return fingerprintSummary(log);
}

function LogList({ logs }: { logs: AuditLogItem[] }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-medium text-gray-800">最近日志</h2>
          <div className="mt-0.5 text-[12px] font-normal text-gray-400">优先看登记、修改、配置，其次再看登录和访问</div>
        </div>
        <span className="text-[12px] font-normal text-gray-400">{logs.length} 条</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        {logs.length === 0 && (
          <div className="bg-[#F8FAFF] px-3 py-8 text-center text-[13px] font-normal text-gray-400">
            暂无日志
          </div>
        )}
        {logs.map((log, index) => {
          const tone = actionTone(log.action);
          return (
            <div
              key={log.id}
              className={`px-3 py-3 ${tone.row} ${index !== logs.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                <span className="shrink-0 text-[12px] font-normal text-gray-400">{formatTime(log.createdAt)}</span>
                <span className="shrink-0 text-[15px] leading-none">{log.emoji}</span>
                <span className={`min-w-0 truncate text-[13px] font-medium ${tone.text}`}>{log.actionLabel}</span>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] font-normal text-gray-400">
                <span className="truncate">{logActor(log)}</span>
                <span className="shrink-0">·</span>
                <span className="shrink-0">{shortCity(log.city)}</span>
                <span className="shrink-0">·</span>
                <span className="shrink-0">{deviceType(log.device)}</span>
                <span className="shrink-0">·</span>
                <span className="min-w-0 truncate">{pageName(log.pageUrl)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FingerprintList({ fingerprints }: { fingerprints: AuditFingerprintItem[] }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-medium text-gray-800">设备指纹</h2>
          <div className="mt-0.5 text-[12px] font-normal text-gray-400">有备注时只显示备注，展开后看完整信息</div>
        </div>
        <span className="text-[12px] font-normal text-gray-400">{fingerprints.length} 个</span>
      </div>

      <div className="space-y-2">
        {fingerprints.length === 0 && (
          <div className="rounded-xl bg-[#F8FAFF] px-3 py-8 text-center text-[13px] font-normal text-gray-400">
            暂无设备指纹
          </div>
        )}
        {fingerprints.map(item => (
          <details key={item.id} className="group rounded-xl border border-gray-100 bg-[#F8FAFF] p-3">
            <summary className="flex cursor-pointer list-none items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[17px] shadow-sm">
                {item.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-800">
                {fingerprintSummary(item)}
              </span>
              <ChevronRight size={16} className="shrink-0 text-gray-300 transition group-open:rotate-90" />
            </summary>

            <div className="mt-3 rounded-lg bg-white px-3 py-2 text-[12px] font-normal leading-6 text-gray-500">
              <div>账号：{item.userName || '未知'} {item.userPhone ? `/${item.userPhone}` : ''}</div>
              <div>位置：{item.city || '未知'} · {item.ip || '未知IP'}</div>
              <div>设备：{item.device || '未知设备'}</div>
              <div className="truncate">指纹：{item.id}</div>
            </div>

            <form action={saveAuditNote} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={item.id} />
              <input
                name="note"
                defaultValue={item.note ?? ''}
                placeholder="备注，比如：老板手机"
                className="h-9 min-w-0 flex-1 rounded-lg bg-white px-3 text-[13px] font-normal text-gray-700 outline-none ring-1 ring-gray-100 focus:ring-[#3370FF]/30"
              />
              <button className="h-9 rounded-lg bg-[#3370FF] px-3 text-[13px] font-medium text-white">
                保存
              </button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params?.view === 'fingerprints' ? 'fingerprints' : 'logs';
  const [fingerprints, logs] = await Promise.all([
    listAuditFingerprints(),
    listAuditLogs(),
  ]);

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <div className="mx-auto max-w-3xl md:px-6 md:py-5">
        <div className="flex items-center bg-white px-4 pb-4 pt-5 shadow-sm md:rounded-2xl">
          <Link href="/settings/developer" className="mr-3 p-1 text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-semibold text-[#1A3A8F]">操作日志</h1>
            <div className="mt-0.5 text-[12px] font-normal text-gray-400">重点动作优先扫，设备指纹单独查看</div>
          </div>
          <Link
            href={view === 'logs' ? '/settings/developer/audit?view=fingerprints' : '/settings/developer/audit'}
            className="rounded-lg bg-[#E8EEF8] px-3 py-2 text-[13px] font-medium text-[#1A3A8F]"
          >
            {view === 'logs' ? '设备指纹' : '返回日志'}
          </Link>
        </div>

        <div className="px-3 py-3 md:px-0">
          {view === 'logs' ? (
            <LogList logs={logs} />
          ) : (
            <FingerprintList fingerprints={fingerprints} />
          )}
        </div>
      </div>
    </div>
  );
}
