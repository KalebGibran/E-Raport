import "server-only";

import { createManagedUser } from "@/lib/actions/createUser";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { TeacherFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type TeacherRow = {
  id: string;
  profile_id: string | null;
  teacher_code: string | null;
  full_name: string;
  created_at: string;
};

function normalizeTeacherInput(input: TeacherFormInput) {
  const teacherCode = input.teacherCode.trim();
  const fullName = input.fullName.trim();
  const fieldErrors: Record<string, string> = {};

  if (!teacherCode) fieldErrors.teacher_code = "Kode guru wajib diisi.";
  if (!fullName) fieldErrors.full_name = "Nama lengkap wajib diisi.";

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi data guru gagal.", fieldErrors);
  }

  return {
    teacherCode,
    fullName,
  };
}

async function syncTeacherProfile(profileId: string | null, fullName: string) {
  if (!profileId) return;

  const admin = createAdminSupabaseClient();
  await admin.from("profiles").update({ full_name: fullName }).eq("id", profileId);
  await admin.auth.admin.updateUserById(profileId, {
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });
}

export async function listTeachers() {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("teachers")
    .select("id, profile_id, teacher_code, full_name, created_at")
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  return (data ?? []) as TeacherRow[];
}

export async function createTeacher(input: TeacherFormInput) {
  await requireAdminContext();
  const normalized = normalizeTeacherInput(input);

  await createManagedUser({
    type: "teacher",
    fullName: normalized.fullName,
    teacherCode: normalized.teacherCode,
  });
}

export async function updateTeacher(teacherId: string, input: TeacherFormInput) {
  await requireAdminContext();
  const normalized = normalizeTeacherInput(input);
  const admin = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await admin
    .from("teachers")
    .select("profile_id")
    .eq("id", teacherId)
    .single<{ profile_id: string | null }>();

  if (existingError) {
    throw new Error(mapPostgresError(existingError.message));
  }

  const { error } = await admin
    .from("teachers")
    .update({
      teacher_code: normalized.teacherCode,
      full_name: normalized.fullName,
    })
    .eq("id", teacherId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  await syncTeacherProfile(existing.profile_id, normalized.fullName);
}

export async function deleteTeacher(teacherId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("teachers").delete().eq("id", teacherId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

