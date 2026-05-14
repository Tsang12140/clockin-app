import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listAuditFingerprints, listAuditLogs, type AuditFingerprintItem, type AuditLogItem } from '@/lib/audit';
import { saveAuditNote } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{ view?: string }>;
};

const IMPORTANT_ACTIONS = new Set([
  'save_attendance',
  'unlock_attendance',
  'clear_attendance',
  'create_employee',
  'update_employee',
  'add_rate_history',
  'mark_employee_inactive',
  'save_ai_config',
  'save_ai_preset',
  'delete_ai_preset',
]);

const VISIT_ACTIONS = new Set(['page_view']);
const ACCOUNT_ACTIONS = new Set(['login', 'logout']);

function shortPhone(phone: string | null) {
  if (!phone) return null;
  return phone.length > 4 ? phone.slice(-4) : phone;
}

function shortCity(city: string | null) {
  if (!city || city === '未知') return '未知城市';
  return city
    .replace(/市/g, '')
    .replace(/省/g, '')
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

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function actorName(item: Pick<AuditFingerprintItem, 'note' | 'userPhone' | 'device' | 'city'>) {
  if (item.note) return item.note;
  const tail = shortPhone(item.userPhone);
  return [tail ? `尾号${tail}` : '未知账号', deviceType(item.device), shortCity(item.city)].join(' · ');
}

function actionTarget(label: string) {
  return label.includes('：') ? label.split('：').slice(1).join('：') : '';
}

function eventSentence(log: AuditLogItem) {
  const actor = actorName(log);
  const target = actionTarget(log.actionLabel);
  switch (log.action) {
    case 'login':
      return { icon: '🔐', text: `${actor} 登录了系统` };
    case 'logout':
      return { icon: '🚪', text: `${actor} 退出了系统` };
    case 'page_view':
      return { icon: '👀', text: `${actor} 打开了${pageName(log.pageUrl)}` };
    case 'save_attendance':
      return { icon: '📝', text: `${actor} 登记了工时${target ? `：${target}` : ''}` };
    case 'unlock_attendance':
      return { icon: '🔓', text: `${actor} 解锁了工时${target ? `：${target}` : ''}` };
    case 'clear_attendance':
      return { icon: '🧹', text: `${actor} 清空了工时${target ? `：${target}` : ''}` };
    case 'create_employee':
      return { icon: '➕', text: `${actor} 新增了员工${target ? `：${target}` : ''}` };
    case 'update_employee':
      return { icon: '✏️', text: `${actor} 修改了员工资料${target ? `：${target}` : ''}` };
    case 'add_rate_history':
      return { icon: '💰', text: `${actor} 修改了工资${target ? `：${target}` : ''}` };
    case 'mark_employee_inactive':
      return { icon: '📌', text: `${actor} 标记了员工离职${target ? `：${target}` : ''}` };
    case 'save_ai_config':
      return { icon: '🤖', text: `${actor} 修改了 AI 配置` };
    case 'save_ai_preset':
      return { icon: '💾', text: `${actor} 保存了 AI 预设` };
    case 'delete_ai_preset':
      return { icon: '🗑️', text: `${actor} 删除了 AI 预设` };
    default:
      return { icon: '📍', text: `${actor} 触发了${log.actionLabel || '未知事件'}` };
  }
}

function eventTone(action: string) {
  if (IMPORTANT_ACTIONS.has(action)) {
    return {
      border: 'border-[#DDE6FF]',
      bg: 'bg-[#F8FAFF]',
      icon: 'bg-[#EBF0FF]',
      text: 'text-[#1A3A8F]',
    };
  }
  if (ACCOUNT_ACTIONS.has(action)) {
    return {
      border: 'border-green-100',
      bg: 'bg-white',
      icon: 'bg-green-50',
      text: 'text-green-700',
    };
  }
  return {
    border: 'border-gray-100',
    bg: 'bg-white',
    icon: 'bg-gray-50',
    text: 'text-gray-700',
  };
}

function buildStats(logs: AuditLogItem[], fingerprints: AuditFingerprintItem[]) {
  const todayLogs = logs.filter(log => isToday(log.createdAt));
  return [
    { label: '今日事件', value: todayLogs.length },
    { label: '重点操作', value: todayLogs.filter(log => IMPORTANT_ACTIONS.has(log.action)).length },
    { label: '页面访问', value: todayLogs.filter(log => VISIT_ACTIONS.has(log.action)).length },
    { label: '设备指纹', value: fingerprints.length },
  ];
}

function Stats({ logs, fingerprints }: { logs: AuditLogItem[]; fingerprints: AuditFingerprintItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {buildStats(logs, fingerprints).map(item => (
        <div key={item.label} className="rounded-xl border border-white bg-white/80 px-3 py-3 shadow-sm">
          <div className="text-[12px] font-normal text-gray-400">{item.label}</div>
          <div className="mt-1 text-[20px] font-medium text-[#1A3A8F]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function EventStream({ logs }: { logs: AuditLogItem[] }) {
  return (
    <section className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-gray-800">事件动态</h2>
        <span className="text-[12px] font-normal text-gray-400">{logs.length} 条</span>
      </div>

      <div className="space-y-2">
        {logs.length === 0 && (
          <div className="rounded-xl bg-[#F8FAFF] px-3 py-8 text-center text-[13px] font-normal text-gray-400">
            暂无日志
          </div>
        )}
        {logs.map(log => {
          const sentence = eventSentence(log);
          const tone = eventTone(log.action);
          return (
            <div key={log.id} className={`flex gap-3 rounded-xl border ${tone.border} ${tone.bg} px-3 py-3`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon} text-[17px]`}>
                {sentence.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[13px] font-medium ${tone.text}`}>{sentence.text}</div>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] font-normal text-gray-400">
                  <span className="shrink-0">{relativeTime(log.createdAt)}</span>
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">{shortCity(log.city)}</span>
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">{deviceType(log.device)}</span>
                  <span className="shrink-0">·</span>
                  <span className="min-w-0 truncate">{pageName(log.pageUrl)}</span>
                </div>
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
                {actorName(item)}
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
            <div className="mt-0.5 text-[12px] font-normal text-gray-400">用人话看登录、访问和关键操作</div>
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
            <>
              <Stats logs={logs} fingerprints={fingerprints} />
              <EventStream logs={logs} />
            </>
          ) : (
            <FingerprintList fingerprints={fingerprints} />
          )}
        </div>
      </div>
    </div>
  );
}
