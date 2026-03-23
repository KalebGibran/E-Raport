import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { SubjectFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type SubjectRow = {
  id: string;
  subject_code: string;
  subject_name: string;
  is_active: boolean;
  created_at: string;
};

function normalizeSubjectInput(input: SubjectFormInput) {
  const subjectCode = input.subjectCode.trim();
  const subjectName = input.subjectName.trim();
  const fieldErrors: Record<string, string> = {};

  if (!subjectCode) fieldErrors.subject_code = "Kode mapel wajib diisi.";
  if (!subjectName) fieldErrors.subject_name = "Nama mapel wajib diisi.";

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi data mapel gagal.", fieldErrors);
  }

  return {
    subjectCode,
    subjectName,
    isActive: input.isActive,
  };
}

export async function listSubjects() {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("subjects")
    .select("id, subject_code, subject_name, is_active, created_at")
    .order("subject_name", { ascending: true });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  return (data ?? []) as SubjectRow[];
}

export async function createSubject(input: SubjectFormInput) {
  await requireAdminContext();
  const normalized = normalizeSubjectInput(input);
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("subjects").insert({
    subject_code: normalized.subjectCode,
    subject_name: normalized.subjectName,
    is_active: normalized.isActive,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function updateSubject(subjectId: string, input: SubjectFormInput) {
  await requireAdminContext();
  const normalized = normalizeSubjectInput(input);
  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from("subjects")
    .update({
      subject_code: normalized.subjectCode,
      subject_name: normalized.subjectName,
      is_active: normalized.isActive,
    })
    .eq("id", subjectId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function deactivateSubject(subjectId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("subjects").update({ is_active: false }).eq("id", subjectId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

