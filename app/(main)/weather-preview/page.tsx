import WeatherBg from '../WeatherBg';
import type { WeatherCategory } from '@/lib/weather';

const samples: Array<{
  category: WeatherCategory;
  title: string;
  detail: string;
}> = [
  { category: 'sunny',  title: '晴天', detail: '明日 晴・24~31°C' },
  { category: 'cloudy', title: '多云', detail: '明日 多云・23~29°C' },
  { category: 'rainy',  title: '雨天', detail: '明日 小雨・24~29°C' },
  { category: 'thunderstorm', title: '雷阵雨', detail: '明日 雷阵雨・24~29°C' },
  { category: 'snowy',  title: '雪天', detail: '明日 小雪・-2~4°C' },
  { category: 'foggy',  title: '雾天', detail: '明日 雾・18~24°C' },
];

export default function WeatherPreviewPage() {
  return (
    <div className="min-h-screen bg-[#F0F4FA] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-white shadow-sm rounded-2xl px-4 py-4 mb-4">
          <h1 className="text-[17px] font-semibold text-[#1A3A8F]">天气样式预览</h1>
          <p className="text-[12px] text-gray-400 mt-1">不读取或写入考勤数据</p>
        </div>

        <div className="space-y-3">
          {samples.map(sample => (
            <section key={sample.category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-gray-800">{sample.title}</div>
                <div className="text-[12px] text-gray-400">{sample.detail}</div>
              </div>
              <div className="relative h-20 overflow-hidden">
                <WeatherBg category={sample.category} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
