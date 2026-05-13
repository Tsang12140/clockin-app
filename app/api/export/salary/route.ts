import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAttendanceForRange, getMonthlySalary } from '@/lib/queries';
import { monthRange } from '@/lib/utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = req.nextUrl;
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1));

  const { start, end } = monthRange(year, month);
  const lastDay = new Date(year, month, 0).getDate();

  const salaryData = await getMonthlySalary(year, month);
  const activeEmps = salaryData.filter(e => e.status === 'active');

  const allRecs = await getAttendanceForRange(start, end);

  type DayInfo = { hours: number | null; status: string | null; statusLabel: string | null };
  const recsByEmp: Record<number, Record<number, DayInfo>> = {};
  for (const r of allRecs) {
    if (!r.employeeId) continue;
    const day = parseInt(r.workDate!.slice(8, 10));
    (recsByEmp[r.employeeId] ??= {})[day] = {
      hours: r.hours ? parseFloat(String(r.hours)) : null,
      status: r.status,
      statusLabel: r.statusLabel,
    };
  }

  const STATUS_LABEL: Record<string, string> = {
    leave: '假', holiday: '休', sick: '病', absent: '旷',
  };

  const dayHeaders = Array.from({ length: lastDay }, (_, i) => i + 1);
  const header = ['姓名', ...dayHeaders.map(String), '总工时', '时薪', '总工资'];

  const rows = activeEmps.map(emp => {
    const dayMap = recsByEmp[emp.id] ?? {};
    return [
      emp.name,
      ...dayHeaders.map(d => {
        const info = dayMap[d];
        if (!info) return '';
        if (info.status === 'worked') return info.hours ?? '';
        if (info.status === 'custom') return info.statusLabel ?? '特';
        return STATUS_LABEL[info.status ?? ''] ?? '';
      }),
      emp.totalHours || '',
      emp.currentHourlyRate ?? '',
      emp.totalWage || '',
    ];
  });

  const totalRow = [
    '合计',
    ...dayHeaders.map(() => ''),
    activeEmps.reduce((s, e) => s + e.totalHours, 0),
    '',
    activeEmps.reduce((s, e) => s + e.totalWage, 0).toFixed(2),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows, totalRow]);
  ws['!cols'] = [{ wch: 8 }, ...dayHeaders.map(() => ({ wch: 5 })), { wch: 8 }, { wch: 6 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, `${year}年${month}月`);

  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = encodeURIComponent(`${year}年${month}月工资表.xlsx`);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
