import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { AssignmentFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type AssignmentRelationRow = {
  id: string;
  teacher_id: string;
  subject_id: string;
  classroom_id: string;
  academic_period_id: string;
  teachers: { full_name: string; teacher_code: string | null }[] | { full_name: string; teacher_code: string | null } | null;
  subjects: { subject_name: string; subject_code: string }[] | { subject_name: string; subject_code: string } | null;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
  academic_periods: { period_name: string; semester: number }[] | { period_name: string; semester: number } | null;
};

export type AssignmentListItem = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string | null;
  subjectName: string;
  subjectCode: string | null;
  classroomName: string;
  periodName: string;
  semester: number | null;
};

type AssignmentOption = {
  id: string;
  label: string;
};

type AssignmentOptions = {
  teachers: AssignmentOption[];
  subjects: AssignmentOption[];
  classrooms: AssignmentOption[];
  academicPeriods: AssignmentOption[];
};

function normalizeAssignmentInput(input: AssignmentFormInput) {
  const teacherId = input.teacherId.trim();
  const subjectId = input.subjectId.trim();
  const classroomId = input.classroomId.trim();
  const academicPeriodId = input.academicPeriodId.trim();
  const fieldErrors: Record<string, string> = {};

  if (!teacherId) fieldErrors.teacher_id = "Guru wajib dipilih.";
  if (!subjectId) fieldErrors.subject_id = "Mapel wajib dipilih.";
  if (!classroomId) fieldErrors.classroom_id = "Kelas wajib dipilih.";
  if (!academicPeriodId) fieldErrors.academic_period_id = "Periode wajib dipilih.";

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi assignment gagal.", fieldErrors);
  }

  return {
    teacherId,
    subjectId,
    classroomId,
    academicPeriodId,
  };
}

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function listAssignments(): Promise<AssignmentListItem[]> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("subject_teacher_assignments")
    .select(
      "id, teacher_id, subject_id, classroom_id, academic_period_id, teachers(full_name, teacher_code), subjects(subject_name, subject_code), classrooms(classroom_name), academic_periods(period_name, semester)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const rows = (data ?? []) as AssignmentRelationRow[];

  return rows.map((row) => {
    const teacher = pickRelation(row.teachers);
    const subject = pickRelation(row.subjects);
    const classroom = pickRelation(row.classrooms);
    const period = pickRelation(row.academic_periods);

    return {
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: teacher?.full_name ?? "-",
      teacherCode: teacher?.teacher_code ?? null,
      subjectName: subject?.subject_name ?? "-",
      subjectCode: subject?.subject_code ?? null,
      classroomName: classroom?.classroom_name ?? "-",
      periodName: period?.period_name ?? "-",
      semester: period?.semester ?? null,
    };
  });
}

export async function getAssignmentOptions(): Promise<AssignmentOptions> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const [teachersResult, subjectsResult, classroomsResult, periodsResult] = await Promise.all([
    admin.from("teachers").select("id, full_name, teacher_code").order("full_name", { ascending: true }),
    admin
      .from("subjects")
      .select("id, subject_name, subject_code")
      .eq("is_active", true)
      .order("subject_name", { ascending: true }),
    admin
      .from("classrooms")
      .select("id, classroom_name")
      .eq("is_active", true)
      .order("classroom_name", { ascending: true }),
    admin
      .from("academic_periods")
      .select("id, period_name, semester, start_date")
      .order("start_date", { ascending: false }),
  ]);

  if (teachersResult.error) throw new Error(mapPostgresError(teachersResult.error.message));
  if (subjectsResult.error) throw new Error(mapPostgresError(subjectsResult.error.message));
  if (classroomsResult.error) throw new Error(mapPostgresError(classroomsResult.error.message));
  if (periodsResult.error) throw new Error(mapPostgresError(periodsResult.error.message));

  return {
    teachers: (teachersResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.teacher_code ? `${row.full_name} (${row.teacher_code})` : row.full_name,
    })),
    subjects: (subjectsResult.data ?? []).map((row) => ({
      id: row.id,
      label: `${row.subject_name} (${row.subject_code})`,
    })),
    classrooms: (classroomsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.classroom_name,
    })),
    academicPeriods: (periodsResult.data ?? []).map((row) => ({
      id: row.id,
      label: `${row.period_name} (Semester ${row.semester})`,
    })),
  };
}

export async function createAssignment(input: AssignmentFormInput) {
  await requireAdminContext();
  const normalized = normalizeAssignmentInput(input);
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("subject_teacher_assignments").insert({
    teacher_id: normalized.teacherId,
    subject_id: normalized.subjectId,
    classroom_id: normalized.classroomId,
    academic_period_id: normalized.academicPeriodId,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function deleteAssignment(assignmentId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("subject_teacher_assignments").delete().eq("id", assignmentId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
