import { getActiveEmployees, getAttendanceForRange, getLastWorkedHours, getMonthHolidayDates } from '@/lib/queries';

import TodayEntry from './TodayEntry';
import DesktopView from './DesktopView';
import { todayString, getMonday, addDays } from '@/lib/utils';
import { fetchWeatherSnapshot } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today     = todayString();
  const weekStart = getMonday(today);
  const weekEnd   = addDays(weekStart, 6);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const [employees, monthRecs, lastWorkedHours, weatherSnapshot, holidayDates] = await Promise.all([
    getActiveEmployees(),
    getAttendanceForRange(startOfMonth, endOfMonth),
    getLastWorkedHours(),
    fetchWeatherSnapshot(),
    getMonthHolidayDates(year, month),
  ]);
  // Week data is a subset of month data — no second DB query needed
  const weekRecs = monthRecs.filter(r => r.workDate != null && r.workDate >= weekStart && r.workDate <= weekEnd);

  // Compute most recent unrecorded weekday this month (skip Sundays)
  const yesterday = addDays(today, -1);
  let missedDate: string | null = null;
  if (yesterday >= startOfMonth) {
    const datesWithRecs = new Set(
      monthRecs.map(r => r.workDate).filter((d): d is string => d !== null)
    );
    let check = yesterday;
    while (check >= startOfMonth) {
      const [y, m, d] = check.split('-').map(Number);
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      const isWorkday = dow !== 0 && !holidayDates.has(check);
      if (isWorkday && !datesWithRecs.has(check)) { missedDate = check; break; }
      check = addDays(check, -1);
    }
  }

  const shapeRec = (r: typeof monthRecs[0]) => ({
    employeeId:  r.employeeId,
    workDate:    r.workDate,
    hours:       r.hours,
    status:      r.status,
    statusLabel: r.statusLabel,
    isLocked:    r.isLocked,
  });

  const commonProps = {
    employees,
    today,
    missedDate,
    lastWorkedHours,
    weatherSnapshot,
  };

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden">
        <TodayEntry
          {...commonProps}
          initialAttendance={weekRecs.map(shapeRec)}
          initialWeekStart={weekStart}
        />
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <DesktopView
          {...commonProps}
          initialMonthData={monthRecs.map(shapeRec)}
          initialYear={year}
          initialMonth={month}
        />
      </div>
    </>
  );
}
