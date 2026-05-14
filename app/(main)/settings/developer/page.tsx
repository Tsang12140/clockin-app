import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/session';
import { unlockDeveloperOptions } from './actions';

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function DeveloperUnlock({ hasError }: { hasError: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF0FF] text-[#3370FF]">
          <ShieldCheck size={20} />
        </span>
        <div>
          <div className="text-[15px] font-medium text-gray-800">开发者验证</div>
          <div className="mt-0.5 text-[12px] font-normal text-gray-400">进入后可查看日志、预览和 AI 配置</div>
        </div>
      </div>
      <form action={unlockDeveloperOptions}>
        <input
          name="password"
          inputMode="numeric"
          type="password"
          autoComplete="off"
          maxLength={4}
          className="h-12 w-full rounded-xl bg-[#F0F4FA] px-4 text-center text-[20px] font-medium tracking-[0.35em] text-[#1A3A8F] outline-none"
          placeholder="••••"
        />
        {hasError && (
          <div className="mt-2 text-center text-[12px] font-normal text-red-500">密码不正确</div>
        )}
        <button className="mt-4 h-12 w-full rounded-xl bg-[#3370FF] text-[15px] font-medium text-white shadow-sm">
          进入开发人员选项
        </button>
      </form>
    </div>
  );
}

function DeveloperLinks() {
  const items = [
    { href: '/weather-preview', title: '天气效果预览', desc: '晴天、雨天、雷阵雨' },
    { href: '/settings/developer/attendance-preview', title: '考勤卡片预览', desc: '保存完成效果' },
    { href: '/settings/developer/attendance-desktop-preview', title: '考勤卡片预览（桌面端）', desc: '桌面录入表保存效果' },
    { href: '/settings/developer/ai-config', title: 'AI 助手配置', desc: '接口、模型与 API Key' },
    { href: '/settings/developer/audit', title: '操作日志', desc: '登录、访问、工时和设备指纹' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-between px-4 py-4"
        >
          <div>
            <div className="text-[15px] font-medium text-gray-800">{item.title}</div>
            <div className="text-[12px] font-normal text-gray-400 mt-0.5">{item.desc}</div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
      ))}
    </div>
  );
}

export default async function DeveloperSettingsPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const unlocked = session.developerUnlocked === true;

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <div className="max-w-2xl mx-auto md:px-6 md:py-5">
        <div className="bg-white shadow-sm px-4 pt-5 pb-4 flex items-center md:rounded-2xl">
          <Link href="/settings" className="p-1 mr-3 text-gray-400">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[17px] font-semibold text-[#1A3A8F]">开发人员选项</h1>
        </div>

        <div className="px-3 mt-3 md:px-0">
          {unlocked ? <DeveloperLinks /> : <DeveloperUnlock hasError={params?.error === '1'} />}
        </div>
      </div>
    </div>
  );
}
