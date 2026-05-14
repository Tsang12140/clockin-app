import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DeveloperSettingsPage() {
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
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
            <Link
              href="/weather-preview"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">天气效果预览</div>
                <div className="text-[12px] text-gray-400 mt-0.5">晴天、雨天、雷阵雨</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link
              href="/settings/developer/attendance-preview"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">考勤卡片预览</div>
                <div className="text-[12px] text-gray-400 mt-0.5">保存完成效果</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link
              href="/settings/developer/attendance-desktop-preview"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">考勤卡片预览（桌面端）</div>
                <div className="text-[12px] text-gray-400 mt-0.5">桌面录入表保存效果</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link
              href="/settings/developer/ai-config"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">AI 助手配置</div>
                <div className="text-[12px] text-gray-400 mt-0.5">接口、模型与 API Key</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>

            <Link
              href="/settings/developer/audit"
              className="flex items-center justify-between px-4 py-4"
            >
              <div>
                <div className="text-[15px] font-medium text-gray-800">操作日志</div>
                <div className="text-[12px] text-gray-400 mt-0.5">登录、访问、工时和设备指纹</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
