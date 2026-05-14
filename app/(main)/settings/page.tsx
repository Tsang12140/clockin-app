'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { logout } from '@/app/login/actions';

export default function SettingsPage() {
  const [boldMode, setBoldMode] = useState(true);
  const [fontLevel, setFontLevelState] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBoldMode(localStorage.getItem('clockin_bold') !== '0');
      setFontLevelState(parseInt(localStorage.getItem('clockin_fontsize') ?? '0'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setFontLevel = (level: number) => {
    setFontLevelState(level);
    localStorage.setItem('clockin_fontsize', String(level));
  };

  const toggleBold = (on: boolean) => {
    setBoldMode(on);
    localStorage.setItem('clockin_bold', on ? '1' : '0');
    document.documentElement.classList.toggle('bold-mode', on);
  };

  const handleLogout = () => {
    if (!confirm('确认退出登录？')) return;
    startTransition(async () => {
      await logout();
      router.push('/login');
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <div className="max-w-2xl mx-auto md:px-6 md:py-5">
        <div className="bg-white shadow-sm px-4 pt-5 pb-4 md:rounded-2xl">
          <h1 className="text-[17px] font-semibold text-[#1A3A8F]">设置</h1>
        </div>

        <div className="px-3 mt-3 space-y-3 md:px-0">
          {/* Display */}
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-[15px] font-medium text-gray-800">大字模式</div>
                <div className="text-[12px] text-gray-400 mt-0.5">加粗所有文字，更易阅读</div>
              </div>
              <button
                onClick={() => toggleBold(!boldMode)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${boldMode ? 'bg-[#3370FF]' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${boldMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="px-4 py-4">
              <div className="text-[15px] font-medium text-gray-800 mb-3">考勤卡片字号</div>
              <div className="flex gap-2">
                {(['标准', '较大', '大', '超大'] as const).map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setFontLevel(i)}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-colors
                      ${fontLevel === i ? 'bg-[#3370FF] text-white' : 'bg-[#F0F4FA] text-gray-500'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Developer */}
          <div className="bg-white rounded-2xl shadow-sm">
            <Link
              href="/settings/developer"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">开发人员选项</div>
                <div className="text-[12px] text-gray-400 mt-0.5">预览与调试</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl shadow-sm">
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center px-4 py-4 text-[15px] font-medium text-red-500 disabled:opacity-60"
            >
              {isPending ? '退出中…' : '退出登录'}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-gray-300 mt-6 pb-4">v1.96</div>
      </div>
    </div>
  );
}
