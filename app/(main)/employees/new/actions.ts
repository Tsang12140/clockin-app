'use server';

import { db, employees, hourlyRateHistory, positions } from '@/db';
import { eq } from 'drizzle-orm';
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

export async function createEmployee(data: {
  name: string; gender: string; phone: string; idCard: string;
  positionName: string; hireDate: string; hourlyRate: string; notes: string;
}) {
  await requireAuth();
  try {
    const positionId = await resolvePositionId(data.positionName);
    const [emp] = await db.insert(employees).values({
      name:             data.name.trim(),
      gender:           data.gender,
      phone:            data.phone || null,
      idCard:           data.idCard || null,
      positionId,
      status:           'active',
      hireDate:         data.hireDate,
      currentHourlyRate: data.hourlyRate,
      notes:            data.notes || null,
    }).returning({ id: employees.id });

    if (data.hourlyRate) {
      await db.insert(hourlyRateHistory).values({
        employeeId:    emp.id,
        rate:          data.hourlyRate,
        effectiveDate: data.hireDate,
        notes:         '初始时薪',
      });
    }

    revalidatePath('/employees');
    return { ok: true, id: emp.id };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}
