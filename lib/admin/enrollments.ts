import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { EnrollmentFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type EnrollmentRelationRow = {
  id: string;
  student_id: string;
  status: "active" | "completed" | "promoted" | "retained" | "transferred";
  enrolled_at: string;
  students: { full_name: string; nis: string | null }[] | { full_name: string; nis: string | null } | null;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
  academic_periods:
    | { period_name: string; semester: number; start_date: string }[]
    | { period_name: string; semester: number; start_date: string }
    | null;
};

type Option = {
  id: string;
  label: string;
};

export type EnrollmentListItem = {
  id: string;
  studentId: string;
  studentName: string;
  nis: string | null;
  classroomName: string;
  periodName: string;
  semester: number | null;
  periodStartDate: string | null;
  status: string;
  enrolledAt: string;
};

export type EnrollmentOptions = {
  students: Option[];
  classrooms: Option[];
  academicPeriods: Option[];
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeEnrollmentInput(input: EnrollmentFormInput) {
  const studentId = input.studentId.trim();
  const classroomId = input.classroomId.trim();
  const academicPeriodId = input.academicPeriodId.trim();
  const status = input.status ?? "active";
  const fieldErrors: Record<string, string> = {};

  if (!studentId) fieldErrors.student_id = "Siswa wajib dipilih.";
  if (!classroomId) fieldErrors.classroom_id = "Kelas wajib dipilih.";
  if (!academicPeriodId) fieldErrors.academic_period_id = "Periode wajib dipilih.";

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi enrollment gagal.", fieldErrors);
  }

  return {
    studentId,
    classroomId,
    academicPeriodId,
    status,
  };
}

export async function listEnrollments(): Promise<EnrollmentListItem[]> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("enrollments")
    .select(
      "id, student_id, status, enrolled_at, students(full_name, nis), classrooms(classroom_name), academic_periods(period_name, semester, start_date)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const rows = (data ?? []) as EnrollmentRelationRow[];

  return rows.map((row) => {
    const student = pickRelation(row.students);
    const classroom = pickRelation(row.classrooms);
    const period = pickRelation(row.academic_periods);
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: student?.full_name ?? "-",
      nis: student?.nis ?? null,
      classroomName: classroom?.classroom_name ?? "-",
      periodName: period?.period_name ?? "-",
      semester: period?.semester ?? null,
      periodStartDate: period?.start_date ?? null,
      status: row.status,
      enrolledAt: row.enrolled_at,
    };
  });
}

export async function getEnrollmentOptions(): Promise<EnrollmentOptions> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const [studentsResult, classroomsResult, periodsResult] = await Promise.all([
    admin
      .from("students")
      .select("id, full_name, nis")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
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

  if (studentsResult.error) throw new Error(mapPostgresError(studentsResult.error.message));
  if (classroomsResult.error) throw new Error(mapPostgresError(classroomsResult.error.message));
  if (periodsResult.error) throw new Error(mapPostgresError(periodsResult.error.message));

  return {
    students: (studentsResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.nis ? `${row.full_name} (${row.nis})` : row.full_name,
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

export async function createEnrollment(input: EnrollmentFormInput) {
  await requireAdminContext();
  const normalized = normalizeEnrollmentInput(input);
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("enrollments").insert({
    student_id: normalized.studentId,
    classroom_id: normalized.classroomId,
    academic_period_id: normalized.academicPeriodId,
    status: normalized.status,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function deleteEnrollment(enrollmentId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("enrollments").delete().eq("id", enrollmentId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
