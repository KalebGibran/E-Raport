import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { mapPostgresError } from "@/lib/admin/validation";

type RelationValue<T> = T | T[] | null;

type HomeroomRow = {
  id: string;
  teacher_id: string;
  classroom_id: string;
  academic_period_id: string;
  teachers: RelationValue<{ full_name: string; teacher_code: string | null }>;
  classrooms: RelationValue<{ classroom_name: string }>;
  academic_periods: RelationValue<{ period_name: string; semester: number; start_date: string }>;
};

type OptionRow = {
  id: string;
  label: string;
};

export type HomeroomAssignmentItem = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string | null;
  classroomId: string;
  classroomName: string;
  periodId: string;
  periodName: string;
  semester: number;
  periodStartDate: string;
};

export type HomeroomOptions = {
  teachers: OptionRow[];
  classrooms: OptionRow[];
  periods: Array<OptionRow & { isCurrent: boolean; startDate: string }>;
};

function pickRelation<T>(value: RelationValue<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function parseClassroomSortValue(classroomName: string) {
  const normalized = classroomName.trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^(\d+)([A-Z].*)?$/);
  if (!match) {
    return {
      grade: Number.POSITIVE_INFINITY,
      section: normalized,
    };
  }

  return {
    grade: Number(match[1]),
    section: match[2] ?? "",
  };
}

function compareClassroomName(a: string, b: string) {
  const aKey = parseClassroomSortValue(a);
  const bKey = parseClassroomSortValue(b);

  if (aKey.grade !== bKey.grade) {
    return aKey.grade - bKey.grade;
  }

  return aKey.section.localeCompare(bKey.section);
}

function validateInput(input: {
  teacherId: string;
  classroomId: string;
  periodId: string;
}) {
  const teacherId = input.teacherId.trim();
  const classroomId = input.classroomId.trim();
  const periodId = input.periodId.trim();
  const fieldErrors: Record<string, string> = {};

  if (!teacherId) fieldErrors.teacher_id = "Guru wajib dipilih.";
  if (!classroomId) fieldErrors.classroom_id = "Kelas wajib dipilih.";
  if (!periodId) fieldErrors.academic_period_id = "Periode wajib dipilih.";

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi wali kelas gagal.", fieldErrors);
  }

  return { teacherId, classroomId, periodId };
}

export async function getHomeroomOptions(): Promise<HomeroomOptions> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const [teachersResult, classroomsResult, periodsResult] = await Promise.all([
    admin.from("teachers").select("id, full_name, teacher_code").order("full_name", { ascending: true }),
    admin.from("classrooms").select("id, classroom_name").eq("is_active", true).order("classroom_name", { ascending: true }),
    admin
      .from("academic_periods")
      .select("id, period_name, semester, is_current, start_date")
      .order("start_date", { ascending: false }),
  ]);

  if (teachersResult.error) throw new Error(mapPostgresError(teachersResult.error.message));
  if (classroomsResult.error) throw new Error(mapPostgresError(classroomsResult.error.message));
  if (periodsResult.error) throw new Error(mapPostgresError(periodsResult.error.message));

  return {
    teachers: (teachersResult.data ?? []).map((row) => ({
      id: row.id,
      label: row.teacher_code ? `${row.full_name} (${row.teacher_code})` : row.full_name,
    })),
    classrooms: (classroomsResult.data ?? [])
      .map((row) => ({
        id: row.id,
        label: row.classroom_name,
      }))
      .sort((a, b) => compareClassroomName(a.label, b.label)),
    periods: (periodsResult.data ?? []).map((row) => ({
      id: row.id,
      label: `${row.period_name} (Semester ${row.semester})`,
      isCurrent: row.is_current,
      startDate: row.start_date,
    })),
  };
}

export async function listHomeroomAssignments(periodId?: string | null): Promise<HomeroomAssignmentItem[]> {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("homeroom_assignments")
    .select(
      "id, teacher_id, classroom_id, academic_period_id, teachers(full_name, teacher_code), classrooms(classroom_name), academic_periods(period_name, semester, start_date)"
    )
    .order("created_at", { ascending: false });

  if (periodId?.trim()) {
    query = query.eq("academic_period_id", periodId.trim());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  return ((data ?? []) as HomeroomRow[])
    .map((row) => {
      const teacher = pickRelation(row.teachers);
      const classroom = pickRelation(row.classrooms);
      const period = pickRelation(row.academic_periods);

      return {
        id: row.id,
        teacherId: row.teacher_id,
        teacherName: teacher?.full_name ?? "-",
        teacherCode: teacher?.teacher_code ?? null,
        classroomId: row.classroom_id,
        classroomName: classroom?.classroom_name ?? "-",
        periodId: row.academic_period_id,
        periodName: period?.period_name ?? "-",
        semester: period?.semester ?? 0,
        periodStartDate: period?.start_date ?? "",
      };
    })
    .sort((a, b) => {
      if (a.periodStartDate !== b.periodStartDate) {
        return b.periodStartDate.localeCompare(a.periodStartDate);
      }
      const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
      if (classroomOrder !== 0) {
        return classroomOrder;
      }
      return a.teacherName.localeCompare(b.teacherName);
    });
}

export async function createHomeroomAssignment(input: {
  teacherId: string;
  classroomId: string;
  periodId: string;
}) {
  await requireAdminContext();
  const normalized = validateInput(input);
  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("homeroom_assignments").insert({
    teacher_id: normalized.teacherId,
    classroom_id: normalized.classroomId,
    academic_period_id: normalized.periodId,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function deleteHomeroomAssignment(assignmentId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const id = assignmentId.trim();
  if (!id) {
    throw new AdminValidationError("ID assignment tidak valid.", {
      assignment_id: "ID assignment tidak valid.",
    });
  }

  const { error } = await admin.from("homeroom_assignments").delete().eq("id", id);
  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
