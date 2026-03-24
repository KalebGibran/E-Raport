import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/admin/auth";
import { AdminValidationError } from "@/lib/admin/errors";
import { AcademicPeriodFormInput } from "@/lib/admin/types";
import { mapPostgresError } from "@/lib/admin/validation";

type AcademicYearRow = {
  id: string;
  year_name: string;
};

type AcademicPeriodRow = {
  id: string;
  academic_year_id: string;
  semester: 1 | 2;
  period_name: string;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "closed";
  is_current: boolean;
  academic_years: { year_name: string }[] | { year_name: string } | null;
};

export type AcademicYearOption = {
  id: string;
  label: string;
};

export type AcademicPeriodListItem = {
  id: string;
  academicYearId: string;
  academicYearName: string;
  semester: 1 | 2;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "closed";
  isCurrent: boolean;
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getCurrentAcademicStartYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // School year starts in July.
  return month >= 6 ? year : year - 1;
}

async function ensureAcademicYearsSeeded(minFutureYears = 5) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("academic_years").select("year_name");

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const existing = new Set((data ?? []).map((row) => row.year_name));
  const baseStartYear = getCurrentAcademicStartYear();
  const rowsToInsert: Array<{
    year_name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  }> = [];

  for (let offset = 0; offset <= minFutureYears; offset += 1) {
    const startYear = baseStartYear + offset;
    const endYear = startYear + 1;
    const yearName = `${startYear}/${endYear}`;

    if (existing.has(yearName)) continue;

    rowsToInsert.push({
      year_name: yearName,
      start_date: `${startYear}-07-01`,
      end_date: `${endYear}-06-30`,
      is_active: false,
    });
  }

  if (rowsToInsert.length === 0) return;

  const { error: insertError } = await admin.from("academic_years").insert(rowsToInsert);
  if (insertError) {
    throw new Error(mapPostgresError(insertError.message));
  }
}

function normalizeAcademicPeriodInput(input: AcademicPeriodFormInput) {
  const academicYearId = input.academicYearId.trim();
  const semester = Number(input.semester);
  const periodName = input.periodName.trim();
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  const status = input.status;
  const fieldErrors: Record<string, string> = {};

  if (!academicYearId) fieldErrors.academic_year_id = "Tahun ajaran wajib dipilih.";
  if (!(semester === 1 || semester === 2)) fieldErrors.semester = "Semester harus 1 atau 2.";
  if (!periodName) fieldErrors.period_name = "Nama periode wajib diisi.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) fieldErrors.start_date = "Format tanggal mulai harus YYYY-MM-DD.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) fieldErrors.end_date = "Format tanggal akhir harus YYYY-MM-DD.";
  if (!["planned", "active", "closed"].includes(status)) fieldErrors.status = "Status periode tidak valid.";

  if (startDate && endDate && startDate >= endDate) {
    fieldErrors.end_date = "Tanggal akhir harus lebih besar dari tanggal mulai.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError("Validasi periode akademik gagal.", fieldErrors);
  }

  return {
    academicYearId,
    semester: semester as 1 | 2,
    periodName,
    startDate,
    endDate,
    status,
    isCurrent: input.isCurrent,
  };
}

export async function getAcademicYearOptions(): Promise<AcademicYearOption[]> {
  await requireAdminContext();
  await ensureAcademicYearsSeeded(5);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("academic_years")
    .select("id, year_name")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  return ((data ?? []) as AcademicYearRow[]).map((row) => ({
    id: row.id,
    label: row.year_name,
  }));
}

export async function listAcademicPeriods(): Promise<AcademicPeriodListItem[]> {
  await requireAdminContext();
  await ensureAcademicYearsSeeded(5);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("academic_periods")
    .select("id, academic_year_id, semester, period_name, start_date, end_date, status, is_current, academic_years(year_name)")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }

  const rows = (data ?? []) as AcademicPeriodRow[];

  return rows.map((row) => ({
    id: row.id,
    academicYearId: row.academic_year_id,
    academicYearName: pickRelation(row.academic_years)?.year_name ?? "-",
    semester: row.semester,
    periodName: row.period_name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    isCurrent: row.is_current,
  }));
}

export async function createAcademicPeriod(input: AcademicPeriodFormInput) {
  await requireAdminContext();
  await ensureAcademicYearsSeeded(5);
  const normalized = normalizeAcademicPeriodInput(input);
  const admin = createAdminSupabaseClient();

  if (normalized.isCurrent) {
    const { error: unsetError } = await admin.from("academic_periods").update({ is_current: false }).eq("is_current", true);
    if (unsetError) {
      throw new Error(mapPostgresError(unsetError.message));
    }
  }

  const { error } = await admin.from("academic_periods").insert({
    academic_year_id: normalized.academicYearId,
    semester: normalized.semester,
    period_name: normalized.periodName,
    start_date: normalized.startDate,
    end_date: normalized.endDate,
    status: normalized.status,
    is_current: normalized.isCurrent,
  });

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function updateAcademicPeriod(periodId: string, input: AcademicPeriodFormInput) {
  await requireAdminContext();
  await ensureAcademicYearsSeeded(5);
  const normalized = normalizeAcademicPeriodInput(input);
  const admin = createAdminSupabaseClient();

  if (normalized.isCurrent) {
    const { error: unsetError } = await admin
      .from("academic_periods")
      .update({ is_current: false })
      .eq("is_current", true)
      .neq("id", periodId);
    if (unsetError) {
      throw new Error(mapPostgresError(unsetError.message));
    }
  }

  const { error } = await admin
    .from("academic_periods")
    .update({
      academic_year_id: normalized.academicYearId,
      semester: normalized.semester,
      period_name: normalized.periodName,
      start_date: normalized.startDate,
      end_date: normalized.endDate,
      status: normalized.status,
      is_current: normalized.isCurrent,
    })
    .eq("id", periodId);

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}

export async function setCurrentAcademicPeriod(periodId: string) {
  await requireAdminContext();
  const admin = createAdminSupabaseClient();

  const { error: unsetError } = await admin.from("academic_periods").update({ is_current: false }).eq("is_current", true);
  if (unsetError) {
    throw new Error(mapPostgresError(unsetError.message));
  }

  const { error } = await admin.from("academic_periods").update({ is_current: true }).eq("id", periodId);
  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
