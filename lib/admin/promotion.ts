import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { PromotionFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type AcademicPeriodRow = {
  id: string;
  academic_year_id: string;
  semester: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "closed";
  is_current: boolean;
};

type EnrollmentPreviewRow = {
  student_id: string;
  classroom_id: string;
  classrooms:
    | {
        next_classroom_id: string | null;
      }[]
    | {
        next_classroom_id: string | null;
      }
    | null;
};

type PromotionRpcRow = {
  total_candidates: number;
  inserted_count: number;
  skipped_existing_count: number;
  moved_class_count: number;
  stayed_class_count: number;
};

export type PromotionPeriod = {
  id: string;
  academicYearId: string;
  semester: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "closed";
  isCurrent: boolean;
  label: string;
};

export type PromotionPreview = {
  transitionType: "same_year" | "new_year";
  totalInCurrent: number;
  eligibleCount: number;
  alreadyInTargetCount: number;
  willMoveClassCount: number;
  willStayClassCount: number;
};

export type PromotionResult = {
  totalCandidates: number;
  insertedCount: number;
  skippedExistingCount: number;
  movedClassCount: number;
  stayedClassCount: number;
};

function toPeriod(row: AcademicPeriodRow): PromotionPeriod {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    semester: row.semester,
    periodName: row.period_name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    isCurrent: row.is_current,
    label: `${row.period_name} (Semester ${row.semester})`,
  };
}

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizePromotionInput(input: PromotionFormInput) {
  const currentPeriodId = input.currentPeriodId.trim();
  const targetPeriodId = input.targetPeriodId.trim();
  const excludedStudentIds = (input.excludedStudentIds ?? []).map((value) => value.trim()).filter(Boolean);

  const fieldErrors: Record<string, string> = {};

  if (!currentPeriodId) fieldErrors.current_period_id = "Periode saat ini wajib diisi.";
  if (!targetPeriodId) fieldErrors.target_period_id = "Periode target wajib dipilih.";
  if (currentPeriodId && targetPeriodId && currentPeriodId === targetPeriodId) {
    fieldErrors.target_period_id = "Periode target tidak boleh sama dengan periode saat ini.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi promotion gagal.", fieldErrors);
  }

  return {
    currentPeriodId,
    targetPeriodId,
    excludedStudentIds,
  };
}

export async function listPromotionPeriods() {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("academic_periods")
    .select("id, academic_year_id, semester, period_name, start_date, end_date, status, is_current")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const periods = ((data ?? []) as AcademicPeriodRow[]).map(toPeriod);
  const currentPeriod = periods.find((period) => period.isCurrent) ?? null;

  return {
    periods,
    currentPeriod,
  };
}

export async function getPromotionPreview(input: PromotionFormInput): Promise<PromotionPreview> {
  await requireAdminContext();
  const normalized = normalizePromotionInput(input);
  const admin = createAdminSupabaseClient();

  const [periodsResult, currentEnrollmentsResult, targetEnrollmentsResult] = await Promise.all([
    admin
      .from("academic_periods")
      .select("id, academic_year_id, semester, period_name, start_date, end_date, status, is_current")
      .in("id", [normalized.currentPeriodId, normalized.targetPeriodId]),
    admin
      .from("enrollments")
      .select("student_id, classroom_id, classrooms(next_classroom_id)")
      .eq("academic_period_id", normalized.currentPeriodId)
      .in("status", ["active", "completed", "promoted", "retained"]),
    admin.from("enrollments").select("student_id").eq("academic_period_id", normalized.targetPeriodId),
  ]);

  if (periodsResult.error) throw new Error(mapPostgresError(periodsResult.error.message));
  if (currentEnrollmentsResult.error) throw new Error(mapPostgresError(currentEnrollmentsResult.error.message));
  if (targetEnrollmentsResult.error) throw new Error(mapPostgresError(targetEnrollmentsResult.error.message));

  const periodRows = (periodsResult.data ?? []) as AcademicPeriodRow[];
  const currentPeriod = periodRows.find((period) => period.id === normalized.currentPeriodId);
  const targetPeriod = periodRows.find((period) => period.id === normalized.targetPeriodId);

  if (!currentPeriod) {
    throw new Error("Periode saat ini tidak ditemukan.");
  }
  if (!targetPeriod) {
    throw new Error("Periode target tidak ditemukan.");
  }

  const transitionType =
    currentPeriod.academic_year_id === targetPeriod.academic_year_id ? "same_year" : "new_year";

  const excluded = new Set(normalized.excludedStudentIds);
  const existingTargetStudents = new Set(
    (targetEnrollmentsResult.data ?? [])
      .map((row) => row.student_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  const currentRows = (currentEnrollmentsResult.data ?? []) as EnrollmentPreviewRow[];
  const scopedCurrentRows = currentRows.filter((row) => excluded.has(row.student_id) === false);

  let alreadyInTargetCount = 0;
  let willMoveClassCount = 0;

  for (const row of scopedCurrentRows) {
    if (existingTargetStudents.has(row.student_id)) {
      alreadyInTargetCount += 1;
      continue;
    }

    if (transitionType === "new_year") {
      const classroom = pickRelation(row.classrooms);
      const nextClassroomId = classroom?.next_classroom_id ?? null;
      if (nextClassroomId && nextClassroomId !== row.classroom_id) {
        willMoveClassCount += 1;
      }
    }
  }

  const eligibleCount = scopedCurrentRows.length - alreadyInTargetCount;

  return {
    transitionType,
    totalInCurrent: scopedCurrentRows.length,
    eligibleCount,
    alreadyInTargetCount,
    willMoveClassCount,
    willStayClassCount: Math.max(eligibleCount - willMoveClassCount, 0),
  };
}

export async function promoteStudents(input: PromotionFormInput): Promise<PromotionResult> {
  await requireAdminContext();
  const normalized = normalizePromotionInput(input);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin.rpc("promote_students", {
    p_current_period_id: normalized.currentPeriodId,
    p_next_period_id: normalized.targetPeriodId,
    p_excluded_student_ids: normalized.excludedStudentIds,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const rpcRows = (data ?? []) as PromotionRpcRow[];
  const row = rpcRows[0];

  if (!row) {
    throw new Error("Promotion tidak mengembalikan hasil.");
  }

  return {
    totalCandidates: Number(row.total_candidates ?? 0),
    insertedCount: Number(row.inserted_count ?? 0),
    skippedExistingCount: Number(row.skipped_existing_count ?? 0),
    movedClassCount: Number(row.moved_class_count ?? 0),
    stayedClassCount: Number(row.stayed_class_count ?? 0),
  };
}
