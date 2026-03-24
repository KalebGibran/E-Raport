import "server-only";

import { createManagedUser } from "@/lib/actions/createUser";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { StudentFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type StudentRow = {
  id: string;
  profile_id: string | null;
  nis: string | null;
  nisn: string | null;
  full_name: string;
  gender: "male" | "female" | null;
  birth_date: string | null;
  is_active: boolean;
  created_at: string;
  current_classroom_name?: string | null;
  current_period_name?: string | null;
  current_semester?: number | null;
};

type StudentEnrollmentRow = {
  student_id: string;
  enrolled_at: string;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
  academic_periods:
    | { period_name: string; semester: number; start_date: string }[]
    | { period_name: string; semester: number; start_date: string }
    | null;
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeStudentInput(input: StudentFormInput) {
  const nis = input.nis.trim();
  const fullName = input.fullName.trim();
  const nisn = input.nisn?.trim() || null;
  const gender = input.gender ?? null;
  const birthDate = input.birthDate?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!nis) fieldErrors.nis = "NIS wajib diisi.";
  if (!fullName) fieldErrors.full_name = "Nama lengkap wajib diisi.";
  if (gender && gender !== "male" && gender !== "female") {
    fieldErrors.gender = "Gender harus male/female.";
  }
  if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) === false) {
    fieldErrors.birth_date = "Format tanggal lahir harus YYYY-MM-DD.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi data siswa gagal.", fieldErrors);
  }

  return {
    nis,
    nisn,
    fullName,
    gender,
    birthDate,
    isActive: input.isActive,
  };
}

async function syncProfileName(profileId: string | null, fullName: string) {
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

export async function listStudents() {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data: studentsData, error: studentsError } = await admin
    .from("students")
    .select("id, profile_id, nis, nisn, full_name, gender, birth_date, is_active, created_at")
    .order("full_name", { ascending: true });

  if (studentsError) {
    throw new Error(mapPostgresError(studentsError.message));
  }

  const students = (studentsData ?? []) as StudentRow[];

  if (students.length === 0) {
    return students.map((row) => ({
      ...row,
      current_classroom_name: null,
      current_period_name: null,
      current_semester: null,
    }));
  }

  const studentIds = students.map((student) => student.id);

  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("student_id, enrolled_at, classrooms(classroom_name), academic_periods(period_name, semester, start_date)")
    .in("student_id", studentIds);

  if (enrollmentError) {
    throw new Error(mapPostgresError(enrollmentError.message));
  }

  const enrollmentRows = (enrollmentData ?? []) as StudentEnrollmentRow[];
  const latestEnrollmentMap = new Map<
    string,
    {
      classroomName: string | null;
      periodName: string | null;
      semester: number | null;
      sortKey: string;
    }
  >();

  for (const row of enrollmentRows) {
    const classroom = pickRelation(row.classrooms);
    const period = pickRelation(row.academic_periods);
    const sortKey = period?.start_date ?? row.enrolled_at;
    const existing = latestEnrollmentMap.get(row.student_id);
    if (!existing || sortKey > existing.sortKey) {
      latestEnrollmentMap.set(row.student_id, {
        classroomName: classroom?.classroom_name ?? null,
        periodName: period?.period_name ?? null,
        semester: period?.semester ?? null,
        sortKey,
      });
    }
  }

  return students.map((row) => ({
    ...row,
    current_classroom_name: latestEnrollmentMap.get(row.id)?.classroomName ?? null,
    current_period_name: latestEnrollmentMap.get(row.id)?.periodName ?? null,
    current_semester: latestEnrollmentMap.get(row.id)?.semester ?? null,
  }));
}

export async function createStudent(input: StudentFormInput) {
  await requireAdminContext();
  const normalized = normalizeStudentInput(input);
  const admin = createAdminSupabaseClient();

  const account = await createManagedUser({
    type: "student",
    fullName: normalized.fullName,
    nis: normalized.nis,
    nisn: normalized.nisn ?? undefined,
  });

  const { error } = await admin
    .from("students")
    .update({
      full_name: normalized.fullName,
      nis: normalized.nis,
      nisn: normalized.nisn,
      gender: normalized.gender,
      birth_date: normalized.birthDate,
      is_active: normalized.isActive,
    })
    .eq("profile_id", account.authUserId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function updateStudent(studentId: string, input: StudentFormInput) {
  await requireAdminContext();
  const normalized = normalizeStudentInput(input);
  const admin = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await admin
    .from("students")
    .select("profile_id")
    .eq("id", studentId)
    .single<{ profile_id: string | null }>();

  if (existingError) {
    throw new Error(mapPostgresError(existingError.message));
  }

  const { error } = await admin
    .from("students")
    .update({
      nis: normalized.nis,
      nisn: normalized.nisn,
      full_name: normalized.fullName,
      gender: normalized.gender,
      birth_date: normalized.birthDate,
      is_active: normalized.isActive,
    })
    .eq("id", studentId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  await syncProfileName(existing.profile_id, normalized.fullName);
}

export async function deactivateStudent(studentId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("students").update({ is_active: false }).eq("id", studentId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
