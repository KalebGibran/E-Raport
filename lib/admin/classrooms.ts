import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { ClassroomFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type ClassroomRow = {
  id: string;
  school_level: "sd" | "smp" | "sma";
  grade_level: number;
  section: string;
  classroom_name: string;
  next_classroom_id: string | null;
  is_active: boolean;
};

export type ClassroomListItem = ClassroomRow & {
  next_classroom_name: string | null;
};

export type ClassroomOption = {
  id: string;
  label: string;
};

function normalizeClassroomInput(input: ClassroomFormInput) {
  const schoolLevel = input.schoolLevel;
  const gradeLevel = Number(input.gradeLevel);
  const section = input.section.trim();
  const classroomName = input.classroomName.trim();
  const nextClassroomId = input.nextClassroomId?.trim() || null;
  const fieldErrors: Record<string, string> = {};

  if (!["sd", "smp", "sma"].includes(schoolLevel)) {
    fieldErrors.school_level = "Level sekolah harus sd/smp/sma.";
  }
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1) {
    fieldErrors.grade_level = "Tingkat kelas harus angka >= 1.";
  }
  if (!section) {
    fieldErrors.section = "Rombel/section wajib diisi.";
  }
  if (!classroomName) {
    fieldErrors.classroom_name = "Nama kelas wajib diisi.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi data kelas gagal.", fieldErrors);
  }

  return {
    schoolLevel,
    gradeLevel,
    section,
    classroomName,
    nextClassroomId,
    isActive: input.isActive,
  };
}

async function validateNextClassroomRelation(
  schoolLevel: "sd" | "smp" | "sma",
  gradeLevel: number,
  nextClassroomId: string | null
) {
  if (!nextClassroomId) return;

  const admin = createAdminSupabaseClient();
  const { data: nextClassroom, error } = await admin
    .from("classrooms")
    .select("id, school_level, grade_level")
    .eq("id", nextClassroomId)
    .single<{ id: string; school_level: "sd" | "smp" | "sma"; grade_level: number }>();

  if (error || !nextClassroom) {
    throw new AdminValidationError("Validasi data kelas gagal.", {
      next_classroom_id: "Next classroom tidak ditemukan.",
    });
  }

  if (nextClassroom.school_level !== schoolLevel) {
    throw new AdminValidationError("Validasi data kelas gagal.", {
      next_classroom_id: "Next classroom harus di level sekolah yang sama.",
    });
  }

  if (nextClassroom.grade_level !== gradeLevel + 1) {
    throw new AdminValidationError("Validasi data kelas gagal.", {
      next_classroom_id: "Next classroom harus tepat satu tingkat di atas kelas saat ini.",
    });
  }
}

export async function listClassrooms(): Promise<ClassroomListItem[]> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("classrooms")
    .select("id, school_level, grade_level, section, classroom_name, next_classroom_id, is_active")
    .order("school_level", { ascending: true })
    .order("grade_level", { ascending: true })
    .order("section", { ascending: true });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const rows = (data ?? []) as ClassroomRow[];
  const mapName = new Map(rows.map((row) => [row.id, row.classroom_name]));

  return rows.map((row) => ({
    ...row,
    next_classroom_name: row.next_classroom_id ? mapName.get(row.next_classroom_id) ?? null : null,
  }));
}

export async function getClassroomOptions(): Promise<ClassroomOption[]> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("classrooms")
    .select("id, classroom_name")
    .order("classroom_name", { ascending: true });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.classroom_name,
  }));
}

export async function createClassroom(input: ClassroomFormInput) {
  await requireAdminContext();
  const normalized = normalizeClassroomInput(input);
  await validateNextClassroomRelation(
    normalized.schoolLevel,
    normalized.gradeLevel,
    normalized.nextClassroomId
  );
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("classrooms").insert({
    school_level: normalized.schoolLevel,
    grade_level: normalized.gradeLevel,
    section: normalized.section,
    classroom_name: normalized.classroomName,
    next_classroom_id: normalized.nextClassroomId,
    is_active: normalized.isActive,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function updateClassroom(classroomId: string, input: ClassroomFormInput) {
  await requireAdminContext();
  const normalized = normalizeClassroomInput(input);
  await validateNextClassroomRelation(
    normalized.schoolLevel,
    normalized.gradeLevel,
    normalized.nextClassroomId
  );
  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from("classrooms")
    .update({
      school_level: normalized.schoolLevel,
      grade_level: normalized.gradeLevel,
      section: normalized.section,
      classroom_name: normalized.classroomName,
      next_classroom_id: normalized.nextClassroomId,
      is_active: normalized.isActive,
    })
    .eq("id", classroomId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function deactivateClassroom(classroomId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("classrooms").update({ is_active: false }).eq("id", classroomId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
