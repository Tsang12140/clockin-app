'use server';

import { db, employees, hourlyRateHistory, positions } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/requireAuth';

async function resolvePositionId(name: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await db.select({ id: positions.id }).from(positions)
    .where(eq(positions.name, trimmed)).limit(1);
  if (existing[0]) return existing[0].id;
  const [created] = await db.insert(positions).values({ name: trimmed }).returning({ id: positions.id });
  return created?.id ?? null;
}

export async function updateEmployee(id: number, data: {
  name: string; gender: string; phone: string; idCard: string;
  positionName: string; hireDate: string; leaveDate: string; notes: string;
}) {
  await requireAuth();
  try {
    const positionId = await resolvePositionId(data.positionName);
    await db.update(employees).set({
      name:       data.name,
      gender:     data.gender,
      phone:      data.phone || null,
      idCard:     data.idCard || null,
      positionId,
      hireDate:   data.hireDate || undefined,
      leaveDate:  data.leaveDate || null,
      notes:      data.notes || null,
    }).where(eq(employees.id, id));
    revalidatePath(`/employees/${id}`);
    revalidatePath('/employees');
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

export async function addRateHistory(employeeId: number, data: {
  rate: string; effectiveDate: string; notes: string;
}) {
  await requireAuth();
  try {
    await db.insert(hourlyRateHistory).values({
      employeeId,
      rate:          data.rate,
      effectiveDate: data.effectiveDate,
      notes:         data.notes || null,
    });
    // Sync currentHourlyRate to the most recent rate in history (not necessarily the one just inserted)
    const [latest] = await db
      .select({ rate: hourlyRateHistory.rate })
      .from(hourlyRateHistory)
      .where(eq(hourlyRateHistory.employeeId, employeeId))
      .orderBy(desc(hourlyRateHistory.effectiveDate))
      .limit(1);
    if (latest) {
      await db.update(employees)
        .set({ currentHourlyRate: latest.rate })
        .where(eq(employees.id, employeeId));
    }
    revalidatePath(`/employees/${employeeId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

export async function markInactive(id: number, leaveDate: string) {
  await requireAuth();
  try {
    await db.update(employees)
      .set({ status: 'inactive', leaveDate })
      .where(eq(employees.id, id));
    revalidatePath('/employees');
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}
