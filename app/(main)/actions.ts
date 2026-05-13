'use server';

import { db, attendanceRecords } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getAttendanceForRange } from '@/lib/queries';
import { addDays } from '@/lib/utils';
import { requireAuth } from '@/lib/requireAuth';
import { invalidateCacheForDate } from '@/lib/ai/factsCache';

interface AttendanceEntry {
  employeeId: number;
  workDate: string;
  hours: number | null;
  status: string;
  statusLabel: string | null;
}

export async function saveAttendance(entries: AttendanceEntry[]) {
  await requireAuth();
  try {
    for (const entry of entries) {
      await db
        .insert(attendanceRecords)
        .values({
          employeeId:  entry.employeeId,
          workDate:    entry.workDate,
          hours:       entry.hours !== null ? String(entry.hours) : null,
          status:      entry.status,
          statusLabel: entry.statusLabel,
          isLocked:    true,
          updatedAt:   new Date(),
        })
        .onConflictDoUpdate({
          target: [attendanceRecords.employeeId, attendanceRecords.workDate],
          set: {
            hours:       sql`excluded.hours`,
            status:      sql`excluded.status`,
            statusLabel: sql`excluded.status_label`,
            isLocked:    true,
            updatedAt:   new Date(),
          },
        });
    }
    const uniqueDates = [...new Set(entries.map(e => e.workDate))];
    await Promise.all(uniqueDates.map(d => invalidateCacheForDate(d)));
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

export async function unlockDay(workDate: string) {
  await requireAuth();
  try {
    await db
      .update(attendanceRecords)
      .set({ isLocked: false })
      .where(eq(attendanceRecords.workDate, workDate));
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

export async function clearAttendanceDay(workDate: string) {
  await requireAuth();
  try {
    await db
      .delete(attendanceRecords)
      .where(eq(attendanceRecords.workDate, workDate));
    await invalidateCacheForDate(workDate);
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

export async function loadMonthData(year: number, month: number) {
  await requireAuth();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const recs = await getAttendanceForRange(start, end);
  return recs.map(r => ({
    employeeId:  r.employeeId,
    workDate:    r.workDate,
    hours:       r.hours,
    status:      r.status,
    statusLabel: r.statusLabel,
    isLocked:    r.isLocked,
  }));
}

export async function loadWeekData(weekStart: string) {
  await requireAuth();
  const weekEnd = addDays(weekStart, 6);
  const recs = await getAttendanceForRange(weekStart, weekEnd);
  return recs.map(r => ({
    employeeId:  r.employeeId,
    workDate:    r.workDate,
    hours:       r.hours,
    status:      r.status,
    statusLabel: r.statusLabel,
    isLocked:    r.isLocked,
  }));
}
