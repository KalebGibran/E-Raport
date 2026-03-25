import "server-only";

import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DashboardRole } from "@/lib/auth/roles";
import { getDashboardSession } from "@/lib/auth/dashboard";
import { mapPostgresError } from "@/lib/admin/validation";

export type AttendanceStatus = "present" | "sick" | "permission" | "absent";

type CurrentPeriodRow = {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "closed";
};

type TeacherRow = {
  id: string;
  full_name: string;
};

type ClassroomEnrollmentRow = {
  id: string;
  classroom_id: string;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
};

type EnrollmentStudentRow = {
  id: string;
  student_id: string;
  students: { full_name: string; nis: string | null }[] | { full_name: string; nis: string | null } | null;
};

type AttendanceDailyRow = {
  enrollment_id: string;
  status: AttendanceStatus;
  notes: string | null;
};

type AttendanceSummaryRow = {
  enrollment_id: string;
  status: AttendanceStatus;
};

type HistoryRow = {
  enrollment_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  updated_at: string;
  input_by_teacher_id: string;
  teachers: { full_name: string }[] | { full_name: string } | null;
  enrollments:
    | {
        classroom_id: string;
        classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
      }[]
    | {
        classroom_id: string;
        classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
      }
    | null;
};

export type ClassroomOption = {
  id: string;
  classroomName: string;
  label: string;
};

export type StudentAttendanceItem = {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  nis: string | null;
  status: AttendanceStatus;
  notes: string;
  summary: {
    present: number;
    sick: number;
    permission: number;
    absent: number;
    attendanceRate: number;
    effectiveSchoolDays: number;
  };
};

export type AttendanceRecapItem = {
  classroomName: string;
  totalRecords: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  attendanceRate: number;
};

export type AttendanceHistoryItem = {
  attendanceDate: string;
  inputAt: string;
  classroomName: string;
  teacherName: string;
  totalStudents: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
};

export type AttendanceMonthOption = {
  value: string;
  label: string;
};

export type AttendanceMonthlyDayColumn = {
  date: string;
  dayNumber: number;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
};

export type AttendanceMonthlyStudentRow = {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  nis: string | null;
  dayStatuses: (AttendanceStatus | null)[];
  summary: {
    present: number;
    sick: number;
    permission: number;
    absent: number;
    attendanceRate: number;
  };
};

export type AttendanceTopAbsence = {
  studentName: string;
  initials: string;
  absentCount: number;
};

export type AttendanceMonthlyStats = {
  averageAttendance: number;
  totalStudents: number;
  totalAbsences: number;
  totalSickLeaves: number;
  trendDelta: number | null;
};

export type AttendanceAdminMonthlyRecap = {
  monthLabel: string;
  classroomLabel: string;
  monthStartDate: string;
  monthEndDate: string;
  schoolDays: number;
  dayColumns: AttendanceMonthlyDayColumn[];
  students: AttendanceMonthlyStudentRow[];
  stats: AttendanceMonthlyStats;
  topAbsences: AttendanceTopAbsence[];
  quickNote: string;
};

export type AttendancePageData = {
  role: DashboardRole;
  currentPeriod: {
    id: string;
    periodName: string;
    startDate: string;
    endDate: string;
    status: "planned" | "active" | "closed";
  } | null;
  selectedDate: string;
  selectedMonth: string;
  selectedClassroom: ClassroomOption | null;
  classrooms: ClassroomOption[];
  monthOptions: AttendanceMonthOption[];
  students: StudentAttendanceItem[];
  adminRecap: AttendanceRecapItem[];
  adminMonthlyRecap: AttendanceAdminMonthlyRecap | null;
  history: AttendanceHistoryItem[];
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
};

export type AttendanceEntryInput = {
  enrollmentId: string;
  status: AttendanceStatus;
  notes?: string;
};

export type SubmitAttendanceInput = {
  classroomId: string;
  attendanceDate: string;
  entries: AttendanceEntryInput[];
};

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "sick", "permission", "absent"];
const DAILY_ATTENDANCE_SUBJECT_CODE = "ATT_DAILY";
const DAILY_ATTENDANCE_SUBJECT_NAME = "Absensi Harian (Sistem)";

const holidayCache = new Map<number, Promise<Map<string, string>>>();

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isWeekendDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map((value) => Number(value));
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function resolveDefaultDate(startDate: string, endDate: string, selectedDate?: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  const raw = selectedDate && isValidDate(selectedDate) ? selectedDate : today;

  if (raw < startDate) return startDate;
  if (raw > endDate) return endDate;
  return raw;
}

function fallbackFixedHolidays(year: number) {
  return new Map<string, string>([
    [`${year}-01-01`, "Tahun Baru Masehi"],
    [`${year}-05-01`, "Hari Buruh Internasional"],
    [`${year}-08-17`, "Hari Kemerdekaan RI"],
    [`${year}-12-25`, "Hari Raya Natal"],
  ]);
}

async function fetchIndonesiaHolidaysByYear(year: number) {
  if (!holidayCache.has(year)) {
    holidayCache.set(
      year,
      (async () => {
        const fallback = fallbackFixedHolidays(year);

        try {
          const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`, {
            next: { revalidate: 86400 },
          });
          if (!response.ok) {
            return fallback;
          }

          const payload = (await response.json()) as Array<{
            date: string;
            localName?: string;
            name?: string;
          }>;

          const mapped = new Map<string, string>();
          for (const item of payload) {
            if (!item.date) continue;
            mapped.set(item.date, item.localName ?? item.name ?? "Hari Libur Nasional");
          }

          for (const [date, name] of fallback.entries()) {
            if (!mapped.has(date)) {
              mapped.set(date, name);
            }
          }

          return mapped;
        } catch {
          return fallback;
        }
      })()
    );
  }

  return holidayCache.get(year)!;
}

async function getHolidayMapInRange(startDate: string, endDate: string) {
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));
  const merged = new Map<string, string>();

  for (let year = startYear; year <= endYear; year += 1) {
    const yearMap = await fetchIndonesiaHolidaysByYear(year);
    for (const [date, name] of yearMap.entries()) {
      if (date >= startDate && date <= endDate) {
        merged.set(date, name);
      }
    }
  }

  return merged;
}

function countEffectiveSchoolDays(startDate: string, endDate: string, holidayMap: Map<string, string>) {
  if (endDate < startDate) return 0;

  let count = 0;
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const last = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= last) {
    const isoDate = cursor.toISOString().slice(0, 10);
    if (!isWeekendDate(isoDate) && !holidayMap.has(isoDate)) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

function monthValueFromDate(dateValue: string) {
  return dateValue.slice(0, 7);
}

function toIsoDate(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function startOfMonth(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  return toIsoDate(year, month, 1);
}

function endOfMonth(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toIsoDate(year, month, lastDay);
}

function toMonthLabel(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function buildPeriodMonthOptions(startDate: string, endDate: string): AttendanceMonthOption[] {
  const options: AttendanceMonthOption[] = [];
  let cursor = new Date(`${startDate}T00:00:00.000Z`);
  const limit = new Date(`${endDate}T00:00:00.000Z`);
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));

  while (cursor <= limit) {
    const value = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    options.push({
      value,
      label: toMonthLabel(value),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return options;
}

function resolveSelectedMonth(
  monthOptions: AttendanceMonthOption[],
  selectedDate: string,
  selectedMonth?: string | null
) {
  if (selectedMonth && monthOptions.some((option) => option.value === selectedMonth)) {
    return selectedMonth;
  }

  const fallbackFromDate = monthValueFromDate(selectedDate);
  if (monthOptions.some((option) => option.value === fallbackFromDate)) {
    return fallbackFromDate;
  }

  return monthOptions[0]?.value ?? fallbackFromDate;
}

function getMonthRangeWithinPeriod(monthValue: string, periodStart: string, periodEnd: string) {
  const monthStart = startOfMonth(monthValue);
  const monthEnd = endOfMonth(monthValue);

  return {
    startDate: monthStart < periodStart ? periodStart : monthStart,
    endDate: monthEnd > periodEnd ? periodEnd : monthEnd,
  };
}

function getPreviousMonthValue(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function buildEmptyPage(role: DashboardRole, selectedDate: string): AttendancePageData {
  return {
    role,
    currentPeriod: null,
    selectedDate,
    selectedMonth: selectedDate.slice(0, 7),
    selectedClassroom: null,
    classrooms: [],
    monthOptions: [],
    students: [],
    adminRecap: [],
    adminMonthlyRecap: null,
    history: [],
    isWeekend: isWeekendDate(selectedDate),
    isHoliday: false,
    holidayName: null,
  };
}

async function getCurrentPeriod() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("academic_periods")
    .select("id, period_name, start_date, end_date, status")
    .eq("is_current", true)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return (data as CurrentPeriodRow[] | null)?.[0] ?? null;
}

async function getTeacherByProfile(profileId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("teachers")
    .select("id, full_name")
    .eq("profile_id", profileId)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return (data as TeacherRow[] | null)?.[0] ?? null;
}

async function ensureDailyAttendanceSubjectId() {
  const admin = createAdminSupabaseClient();
  const { data: existing, error: selectError } = await admin
    .from("subjects")
    .select("id")
    .eq("subject_code", DAILY_ATTENDANCE_SUBJECT_CODE)
    .limit(1);

  if (selectError) throw new Error(mapPostgresError(selectError.message));

  const existingId = (existing ?? [])[0]?.id;
  if (existingId) return existingId;

  const { data: inserted, error: insertError } = await admin
    .from("subjects")
    .insert({
      subject_code: DAILY_ATTENDANCE_SUBJECT_CODE,
      subject_name: DAILY_ATTENDANCE_SUBJECT_NAME,
      is_active: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    if (insertError.message.toLowerCase().includes("duplicate key")) {
      const { data: duplicated, error: duplicateReadError } = await admin
        .from("subjects")
        .select("id")
        .eq("subject_code", DAILY_ATTENDANCE_SUBJECT_CODE)
        .limit(1);
      if (duplicateReadError) throw new Error(mapPostgresError(duplicateReadError.message));
      const duplicateId = (duplicated ?? [])[0]?.id;
      if (duplicateId) return duplicateId;
    }
    throw new Error(mapPostgresError(insertError.message));
  }

  return inserted.id;
}

async function getClassroomOptions(currentPeriodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("enrollments")
    .select("id, classroom_id, classrooms(classroom_name)")
    .eq("academic_period_id", currentPeriodId);

  if (error) throw new Error(mapPostgresError(error.message));
  const rows = (data ?? []) as ClassroomEnrollmentRow[];

  const classroomMap = new Map<string, string>();
  for (const row of rows) {
    const classroomName = pickRelation(row.classrooms)?.classroom_name ?? "-";
    classroomMap.set(row.classroom_id, classroomName);
  }

  return [...classroomMap.entries()]
    .map(([id, classroomName]) => ({
      id,
      classroomName,
      label: classroomName,
    }))
    .sort((a, b) => a.classroomName.localeCompare(b.classroomName));
}

async function getStudentAttendanceItems(
  classroomId: string,
  periodId: string,
  dateValue: string,
  rangeStart: string,
  holidayMap: Map<string, string>,
  attendanceSubjectId: string
) {
  const admin = createAdminSupabaseClient();

  const { data: enrollmentRows, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, student_id, students(full_name, nis)")
    .eq("classroom_id", classroomId)
    .eq("academic_period_id", periodId)
    .order("student_id", { ascending: true });

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollments = (enrollmentRows ?? []) as EnrollmentStudentRow[];
  if (!enrollments.length) return [];

  const enrollmentIds = enrollments.map((row) => row.id);
  const [dailyResult, summaryResult] = await Promise.all([
    admin
      .from("attendance_records")
      .select("enrollment_id, status, notes")
      .eq("subject_id", attendanceSubjectId)
      .eq("attendance_date", dateValue)
      .in("enrollment_id", enrollmentIds),
    admin
      .from("attendance_records")
      .select("enrollment_id, status")
      .eq("subject_id", attendanceSubjectId)
      .gte("attendance_date", rangeStart)
      .lte("attendance_date", dateValue)
      .in("enrollment_id", enrollmentIds),
  ]);

  if (dailyResult.error) throw new Error(mapPostgresError(dailyResult.error.message));
  if (summaryResult.error) throw new Error(mapPostgresError(summaryResult.error.message));

  const dailyMap = new Map<string, AttendanceDailyRow>(
    ((dailyResult.data ?? []) as AttendanceDailyRow[]).map((row) => [row.enrollment_id, row])
  );
  const summaryMap = new Map<
    string,
    {
      present: number;
      sick: number;
      permission: number;
      absent: number;
    }
  >();

  for (const row of (summaryResult.data ?? []) as AttendanceSummaryRow[]) {
    const current = summaryMap.get(row.enrollment_id) ?? {
      present: 0,
      sick: 0,
      permission: 0,
      absent: 0,
    };
    current[row.status] += 1;
    summaryMap.set(row.enrollment_id, current);
  }

  const effectiveSchoolDays = countEffectiveSchoolDays(rangeStart, dateValue, holidayMap);

  return enrollments.map((enrollment) => {
    const student = pickRelation(enrollment.students);
    const daily = dailyMap.get(enrollment.id);
    const summary = summaryMap.get(enrollment.id) ?? {
      present: 0,
      sick: 0,
      permission: 0,
      absent: 0,
    };
    const attendanceRate =
      effectiveSchoolDays > 0 ? Number(((summary.present / effectiveSchoolDays) * 100).toFixed(1)) : 0;

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      fullName: student?.full_name ?? "-",
      nis: student?.nis ?? null,
      status: daily?.status ?? "present",
      notes: daily?.notes ?? "",
      summary: {
        ...summary,
        attendanceRate,
        effectiveSchoolDays,
      },
    };
  });
}

async function getAdminAttendanceRecap(periodId: string, attendanceSubjectId: string): Promise<AttendanceRecapItem[]> {
  const admin = createAdminSupabaseClient();
  const { data: enrollmentRows, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("academic_period_id", periodId);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollmentIds = (enrollmentRows ?? []).map((row) => row.id);
  if (!enrollmentIds.length) return [];

  const { data, error } = await admin
    .from("attendance_records")
    .select("status, enrollments(classroom_id, classrooms(classroom_name))")
    .eq("subject_id", attendanceSubjectId)
    .in("enrollment_id", enrollmentIds);

  if (error) throw new Error(mapPostgresError(error.message));

  const grouped = new Map<
    string,
    {
      classroomName: string;
      totalRecords: number;
      present: number;
      sick: number;
      permission: number;
      absent: number;
    }
  >();

  for (const row of (data ?? []) as Array<{
    status: AttendanceStatus;
    enrollments:
      | {
          classroom_id: string;
          classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
        }[]
      | {
          classroom_id: string;
          classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
        }
      | null;
  }>) {
    const enrollment = pickRelation(row.enrollments);
    const classroomName = pickRelation(enrollment?.classrooms ?? null)?.classroom_name ?? "-";
    const current = grouped.get(classroomName) ?? {
      classroomName,
      totalRecords: 0,
      present: 0,
      sick: 0,
      permission: 0,
      absent: 0,
    };
    current.totalRecords += 1;
    current[row.status] += 1;
    grouped.set(classroomName, current);
  }

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      attendanceRate: row.totalRecords > 0 ? Number(((row.present / row.totalRecords) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.classroomName.localeCompare(b.classroomName));
}

async function getMonthlyClassAttendanceRate(params: {
  enrollmentIds: string[];
  attendanceSubjectId: string;
  startDate: string;
  endDate: string;
}) {
  const { enrollmentIds, attendanceSubjectId, startDate, endDate } = params;
  if (!enrollmentIds.length || endDate < startDate) return 0;

  const admin = createAdminSupabaseClient();
  const [{ data, error }, holidayMap] = await Promise.all([
    admin
      .from("attendance_records")
      .select("status")
      .eq("subject_id", attendanceSubjectId)
      .in("enrollment_id", enrollmentIds)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate),
    getHolidayMapInRange(startDate, endDate),
  ]);

  if (error) throw new Error(mapPostgresError(error.message));

  const schoolDays = countEffectiveSchoolDays(startDate, endDate, holidayMap);
  if (schoolDays === 0) return 0;

  const presentCount = ((data ?? []) as Array<{ status: AttendanceStatus }>).filter(
    (row) => row.status === "present"
  ).length;
  const denominator = schoolDays * enrollmentIds.length;
  if (denominator === 0) return 0;
  return Number(((presentCount / denominator) * 100).toFixed(1));
}

async function getAdminMonthlyRecap(params: {
  period: CurrentPeriodRow;
  selectedClassroom: ClassroomOption | null;
  selectedMonth: string;
  attendanceSubjectId: string;
}): Promise<AttendanceAdminMonthlyRecap | null> {
  const { period, selectedClassroom, selectedMonth, attendanceSubjectId } = params;
  if (!selectedClassroom) return null;

  const admin = createAdminSupabaseClient();
  const monthRange = getMonthRangeWithinPeriod(selectedMonth, period.start_date, period.end_date);
  const [holidayMap, enrollmentResult] = await Promise.all([
    getHolidayMapInRange(monthRange.startDate, monthRange.endDate),
    admin
      .from("enrollments")
      .select("id, student_id, students(full_name, nis)")
      .eq("academic_period_id", period.id)
      .eq("classroom_id", selectedClassroom.id)
      .order("student_id", { ascending: true }),
  ]);

  if (enrollmentResult.error) throw new Error(mapPostgresError(enrollmentResult.error.message));

  const enrollmentRows = (enrollmentResult.data ?? []) as EnrollmentStudentRow[];
  const enrollmentIds = enrollmentRows.map((row) => row.id);

  const dayColumns: AttendanceMonthlyDayColumn[] = [];
  if (monthRange.endDate >= monthRange.startDate) {
    const cursor = new Date(`${monthRange.startDate}T00:00:00.000Z`);
    const limit = new Date(`${monthRange.endDate}T00:00:00.000Z`);

    while (cursor <= limit) {
      const date = cursor.toISOString().slice(0, 10);
      dayColumns.push({
        date,
        dayNumber: Number(date.slice(-2)),
        isWeekend: isWeekendDate(date),
        isHoliday: holidayMap.has(date),
        holidayName: holidayMap.get(date) ?? null,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const schoolDays = dayColumns.filter((column) => !column.isWeekend && !column.isHoliday).length;

  let monthlyRows: Array<{ enrollment_id: string; attendance_date: string; status: AttendanceStatus }> = [];
  if (enrollmentIds.length > 0) {
    const monthlyResult = await admin
      .from("attendance_records")
      .select("enrollment_id, attendance_date, status")
      .eq("subject_id", attendanceSubjectId)
      .in("enrollment_id", enrollmentIds)
      .gte("attendance_date", monthRange.startDate)
      .lte("attendance_date", monthRange.endDate);

    if (monthlyResult.error) throw new Error(mapPostgresError(monthlyResult.error.message));
    monthlyRows = (monthlyResult.data ?? []) as Array<{
      enrollment_id: string;
      attendance_date: string;
      status: AttendanceStatus;
    }>;
  }

  const statusByEnrollmentAndDate = new Map<string, AttendanceStatus>();
  for (const row of monthlyRows) {
    statusByEnrollmentAndDate.set(`${row.enrollment_id}::${row.attendance_date}`, row.status);
  }

  const students = enrollmentRows.map((enrollment) => {
    const student = pickRelation(enrollment.students);
    const dayStatuses = dayColumns.map((column) => {
      if (column.isWeekend || column.isHoliday) return null;
      return statusByEnrollmentAndDate.get(`${enrollment.id}::${column.date}`) ?? null;
    });

    const summary = {
      present: dayStatuses.filter((value) => value === "present").length,
      sick: dayStatuses.filter((value) => value === "sick").length,
      permission: dayStatuses.filter((value) => value === "permission").length,
      absent: dayStatuses.filter((value) => value === "absent").length,
      attendanceRate: 0,
    };

    summary.attendanceRate = schoolDays > 0 ? Number(((summary.present / schoolDays) * 100).toFixed(1)) : 0;

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      fullName: student?.full_name ?? "-",
      nis: student?.nis ?? null,
      dayStatuses,
      summary,
    };
  });

  const totalPresent = students.reduce((sum, student) => sum + student.summary.present, 0);
  const totalAbsences = students.reduce((sum, student) => sum + student.summary.absent, 0);
  const totalSickLeaves = students.reduce((sum, student) => sum + student.summary.sick, 0);
  const denominator = schoolDays * students.length;
  const averageAttendance = denominator > 0 ? Number(((totalPresent / denominator) * 100).toFixed(1)) : 0;

  let trendDelta: number | null = null;
  const previousMonth = getPreviousMonthValue(selectedMonth);
  const previousRange = getMonthRangeWithinPeriod(previousMonth, period.start_date, period.end_date);
  if (previousRange.endDate >= previousRange.startDate && enrollmentIds.length > 0) {
    const previousRate = await getMonthlyClassAttendanceRate({
      enrollmentIds,
      attendanceSubjectId,
      startDate: previousRange.startDate,
      endDate: previousRange.endDate,
    });
    trendDelta = Number((averageAttendance - previousRate).toFixed(1));
  }

  const topAbsences = [...students]
    .sort((a, b) => b.summary.absent - a.summary.absent)
    .filter((student) => student.summary.absent > 0)
    .slice(0, 3)
    .map((student) => ({
      studentName: student.fullName,
      initials: getInitials(student.fullName),
      absentCount: student.summary.absent,
    }));

  const topStudent = topAbsences[0];
  const quickNote = topStudent
    ? `Overall attendance kelas ${selectedClassroom.classroomName} berada di ${averageAttendance}%. Siswa dengan absen tertinggi saat ini ${topStudent.studentName} (${topStudent.absentCount} hari).`
    : `Overall attendance kelas ${selectedClassroom.classroomName} berada di ${averageAttendance}%. Belum ada siswa dengan status alpa pada bulan ini.`;

  return {
    monthLabel: toMonthLabel(selectedMonth),
    classroomLabel: selectedClassroom.classroomName,
    monthStartDate: monthRange.startDate,
    monthEndDate: monthRange.endDate,
    schoolDays,
    dayColumns,
    students,
    stats: {
      averageAttendance,
      totalStudents: students.length,
      totalAbsences,
      totalSickLeaves,
      trendDelta,
    },
    topAbsences,
    quickNote,
  };
}

async function getAttendanceHistory(
  periodId: string,
  attendanceSubjectId: string,
  selectedClassroomId?: string | null
): Promise<AttendanceHistoryItem[]> {
  const admin = createAdminSupabaseClient();
  let enrollmentQuery = admin.from("enrollments").select("id").eq("academic_period_id", periodId);
  if (selectedClassroomId) {
    enrollmentQuery = enrollmentQuery.eq("classroom_id", selectedClassroomId);
  }

  const { data: enrollmentRows, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollmentIds = (enrollmentRows ?? []).map((row) => row.id);
  if (!enrollmentIds.length) return [];

  const query = admin
    .from("attendance_records")
    .select(
      "enrollment_id, attendance_date, status, updated_at, input_by_teacher_id, teachers(full_name), enrollments(classroom_id, classrooms(classroom_name))"
    )
    .eq("subject_id", attendanceSubjectId)
    .in("enrollment_id", enrollmentIds)
    .order("attendance_date", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data, error } = await query.limit(1000);
  if (error) throw new Error(mapPostgresError(error.message));

  const grouped = new Map<
    string,
    {
      attendanceDate: string;
      inputAt: string;
      classroomName: string;
      teacherName: string;
      totalStudents: number;
      present: number;
      sick: number;
      permission: number;
      absent: number;
    }
  >();

  for (const row of (data ?? []) as HistoryRow[]) {
    const enrollment = pickRelation(row.enrollments);
    const classroomName = pickRelation(enrollment?.classrooms ?? null)?.classroom_name ?? "-";
    const teacherName = pickRelation(row.teachers)?.full_name ?? "-";
    const key = `${row.attendance_date}::${classroomName}::${row.input_by_teacher_id}`;

    const current = grouped.get(key) ?? {
      attendanceDate: row.attendance_date,
      inputAt: row.updated_at,
      classroomName,
      teacherName,
      totalStudents: 0,
      present: 0,
      sick: 0,
      permission: 0,
      absent: 0,
    };

    current.totalStudents += 1;
    current[row.status] += 1;
    if (row.updated_at > current.inputAt) {
      current.inputAt = row.updated_at;
    }
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (a.attendanceDate !== b.attendanceDate) {
        return b.attendanceDate.localeCompare(a.attendanceDate);
      }
      return b.inputAt.localeCompare(a.inputAt);
    })
    .slice(0, 50);
}

export async function getAttendancePageData(params: {
  classroomId?: string | null;
  date?: string | null;
  month?: string | null;
}): Promise<AttendancePageData> {
  const session = await getDashboardSession();
  if (session.role === "murid") {
    redirect("/unauthorized");
  }

  const currentPeriod = await getCurrentPeriod();
  const fallbackDate = new Date().toISOString().slice(0, 10);

  if (!currentPeriod) {
    return buildEmptyPage(session.role, params.date && isValidDate(params.date) ? params.date : fallbackDate);
  }

  const selectedDate = resolveDefaultDate(currentPeriod.start_date, currentPeriod.end_date, params.date);
  const monthOptions = buildPeriodMonthOptions(currentPeriod.start_date, currentPeriod.end_date);
  const selectedMonth = resolveSelectedMonth(monthOptions, selectedDate, params.month);
  const holidayMap = await getHolidayMapInRange(currentPeriod.start_date, selectedDate);
  const holidayName = holidayMap.get(selectedDate) ?? null;
  const attendanceSubjectId = await ensureDailyAttendanceSubjectId();
  const classrooms = await getClassroomOptions(currentPeriod.id);
  const selectedClassroom = classrooms.find((item) => item.id === params.classroomId) ?? classrooms[0] ?? null;
  const students = selectedClassroom
    ? await getStudentAttendanceItems(
        selectedClassroom.id,
        currentPeriod.id,
        selectedDate,
        currentPeriod.start_date,
        holidayMap,
        attendanceSubjectId
      )
    : [];

  const [adminRecap, adminMonthlyRecap, history] = await Promise.all([
    session.role === "admin" ? getAdminAttendanceRecap(currentPeriod.id, attendanceSubjectId) : Promise.resolve([]),
    session.role === "admin"
      ? getAdminMonthlyRecap({
          period: currentPeriod,
          selectedClassroom,
          selectedMonth,
          attendanceSubjectId,
        })
      : Promise.resolve(null),
    getAttendanceHistory(currentPeriod.id, attendanceSubjectId, selectedClassroom?.id ?? null),
  ]);

  return {
    role: session.role,
    currentPeriod: {
      id: currentPeriod.id,
      periodName: currentPeriod.period_name,
      startDate: currentPeriod.start_date,
      endDate: currentPeriod.end_date,
      status: currentPeriod.status,
    },
    selectedDate,
    selectedMonth,
    selectedClassroom,
    classrooms,
    monthOptions,
    students,
    adminRecap,
    adminMonthlyRecap,
    history,
    isWeekend: isWeekendDate(selectedDate),
    isHoliday: holidayName != null,
    holidayName,
  };
}

export async function submitAttendance(input: SubmitAttendanceInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat menginput absensi.");
  }

  const admin = createAdminSupabaseClient();
  const classroomId = input.classroomId.trim();
  const attendanceDate = input.attendanceDate.trim();

  if (!classroomId) throw new Error("Kelas wajib dipilih.");
  if (!isValidDate(attendanceDate)) throw new Error("Tanggal absensi tidak valid.");
  if (isWeekendDate(attendanceDate)) {
    throw new Error("Sabtu/Minggu otomatis libur dan tidak dapat diinput absensi.");
  }

  const currentPeriod = await getCurrentPeriod();
  if (!currentPeriod) throw new Error("Belum ada periode current.");
  if (attendanceDate < currentPeriod.start_date || attendanceDate > currentPeriod.end_date) {
    throw new Error("Tanggal absensi harus berada dalam rentang periode current.");
  }

  const holidayMap = await getHolidayMapInRange(attendanceDate, attendanceDate);
  if (holidayMap.has(attendanceDate)) {
    throw new Error("Tanggal merah/libur nasional tidak dihitung sebagai hari absensi.");
  }

  const teacher = await getTeacherByProfile(session.id);
  if (!teacher) {
    throw new Error("Akun guru tidak terhubung dengan data `teachers`.");
  }

  const requested = input.entries
    .map((entry) => ({
      enrollmentId: entry.enrollmentId.trim(),
      status: entry.status,
      notes: (entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.enrollmentId.length > 0);

  if (!requested.length) {
    throw new Error("Tidak ada data siswa untuk disimpan.");
  }

  for (const entry of requested) {
    if (!ATTENDANCE_STATUSES.includes(entry.status)) {
      throw new Error("Status absensi tidak valid.");
    }
  }

  const enrollmentIds = [...new Set(requested.map((entry) => entry.enrollmentId))];
  const { data: enrollmentRows, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("academic_period_id", currentPeriod.id)
    .in("id", enrollmentIds);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));
  const validEnrollmentIds = new Set((enrollmentRows ?? []).map((row) => row.id));

  if (validEnrollmentIds.size !== enrollmentIds.length) {
    throw new Error("Sebagian siswa tidak valid untuk kelas periode current.");
  }

  const attendanceSubjectId = await ensureDailyAttendanceSubjectId();
  const rows = requested.map((entry) => ({
    enrollment_id: entry.enrollmentId,
    subject_id: attendanceSubjectId,
    attendance_date: attendanceDate,
    status: entry.status,
    notes: entry.notes || null,
    input_by_teacher_id: teacher.id,
  }));

  const { error: upsertError } = await admin
    .from("attendance_records")
    .upsert(rows, { onConflict: "enrollment_id,subject_id,attendance_date" });

  if (upsertError) throw new Error(mapPostgresError(upsertError.message));
}
