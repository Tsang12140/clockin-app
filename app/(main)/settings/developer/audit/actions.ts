'use server';

import { updateAuditFingerprintNote } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function saveAuditNote(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const note = String(formData.get('note') ?? '');
  if (!id) return;
  await updateAuditFingerprintNote(id, note);
  revalidatePath('/settings/developer/audit');
}
