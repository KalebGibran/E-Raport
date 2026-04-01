import "server-only";

import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getDashboardSession } from "@/lib/auth/dashboard";
import { AttendanceStatus } from "@/lib/attendance/service";

type PeriodRow = {
  id: string;
  period_name: string;
  semester: number;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "closed";
  is_current: boolean;
};

type SubjectRow = {
  id: string;
  subject_code: string;
};

type EnrollmentAggRow = {
  classroom_id: string;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
};

type AttendanceAggRow = {
  attendance_date: string;
  status: AttendanceStatus;
  count: number;
};

type AssignmentRow = {
  id: string;
  classroom_id: string;
  subject_id: string;
};

type DailyAssessmentRow = {
  assignment_id: string;
  assessment_no: number;
  task_date: string;
};

type ScoreRow = {
  subject_id: string;
  assessment_no: number | null;
  score: number;
  enrollments:
    | { classroom_id: string; academic_period_id: string }[]
    | { classroom_id: string; academic_period_id: string }
    | null;
};

export type AdminPeriodOption = {
  id: string;
  label: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
};

export type AdminMonthOption = {
  value: string;
  label: string;
};

export type AdminTrendPoint = {
  date: string;
  label: string;
  value: number | null;
  count: number;
};

export type AdminWarningItem = {
  title: string;
  detail: string;
  severity: "info" | "warn" | "danger";
};

export type AdminDashboardData = {
  periodOptions: AdminPeriodOption[];
  monthOptions: AdminMonthOption[];
  selectedPeriodId: string | null;
  selectedMonth: string;
  selectedPeriodLabel: string | null;
  kpis: {
    totalEnrollments: number;
    attendanceRate: number;
    averageDailyScore: number;
    tasksCount: number;
  };
  attendanceTrend: AdminTrendPoint[];
  scoreTrend: AdminTrendPoint[];
  warnings: AdminWarningItem[];
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toMonthLabel(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
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

function buildMonthOptions(startDate: string, endDate: string): AdminMonthOption[] {
  const options: AdminMonthOption[] = [];
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

  return options.reverse();
}

function resolveDefaultMonth(monthOptions: AdminMonthOption[], selectedMonth?: string | null) {
  const set = new Set(monthOptions.map((option) => option.value));
  if (selectedMonth && set.has(selectedMonth)) return selectedMonth;
  return monthOptions[0]?.value ?? "";
}

function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${dateValue}T00:00:00.000Z`)
  );
}

function clampPercent(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

async function getPeriods() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("academic_periods")
    .select("id, period_name, semester, start_date, end_date, status, is_current")
    .order("start_date", { ascending: false });

  const rows = (data ?? []) as PeriodRow[];
  const periodOptions: AdminPeriodOption[] = rows.map((period) => ({
    id: period.id,
    label: `${period.period_name} (Semester ${period.semester})`,
    isCurrent: period.is_current,
    startDate: period.start_date,
    endDate: period.end_date,
  }));

  return {
    rows,
    periodOptions,
  };
}

async function getDailyAttendanceSubjectId() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("subjects").select("id, subject_code").eq("subject_code", "ATT_DAILY").limit(1);
  return ((data ?? []) as SubjectRow[])[0]?.id ?? null;
}

function summarizeAttendance(rows: AttendanceAggRow[]) {
  const counts = { present: 0, sick: 0, permission: 0, absent: 0 };
  for (const row of rows) {
    counts[row.status] += row.count;
  }

  const total = counts.present + counts.sick + counts.permission + counts.absent;
  const rate = total > 0 ? Number(((counts.present / total) * 100).toFixed(1)) : 0;

  return { total, rate };
}

export async function getAdminDashboardData(params?: { periodId?: string | null; month?: string | null }): Promise<AdminDashboardData> {
  const session = await getDashboardSession();
  if (session.role !== "admin") {
    redirect("/unauthorized");
  }

  const { rows: periodRows, periodOptions } = await getPeriods();
  const selectedPeriod =
    periodRows.find((period) => period.id === params?.periodId) ??
    periodRows.find((period) => period.is_current) ??
    periodRows[0] ??
    null;

  if (!selectedPeriod) {
    return {
      periodOptions: [],
      monthOptions: [],
      selectedPeriodId: null,
      selectedMonth: "",
      selectedPeriodLabel: null,
      kpis: {
        totalEnrollments: 0,
        attendanceRate: 0,
        averageDailyScore: 0,
        tasksCount: 0,
      },
      attendanceTrend: [],
      scoreTrend: [],
      warnings: [
        {
          title: "Periode belum tersedia",
          detail: "Buat periode akademik terlebih dahulu di menu Periode Akademik.",
          severity: "warn",
        },
      ],
    };
  }

  const monthOptions = buildMonthOptions(selectedPeriod.start_date, selectedPeriod.end_date);
  const selectedMonth = resolveDefaultMonth(monthOptions, params?.month ?? null);
  const rangeStart = selectedMonth ? startOfMonth(selectedMonth) : selectedPeriod.start_date;
  const rangeEnd = selectedMonth ? endOfMonth(selectedMonth) : selectedPeriod.end_date;

  const admin = createAdminSupabaseClient();

  const [{ data: enrollmentAgg }, attendanceSubjectId] = await Promise.all([
    admin
      .from("enrollments")
      .select("classroom_id, classrooms(classroom_name)")
      .eq("academic_period_id", selectedPeriod.id),
    getDailyAttendanceSubjectId(),
  ]);

  const enrollments = (enrollmentAgg ?? []) as EnrollmentAggRow[];
  const totalEnrollments = enrollments.length;

  // Attendance trend (daily attendance subject).
  let attendanceTrend: AdminTrendPoint[] = [];
  let attendanceRate = 0;

  // Attendance aggregation with join.
  const attendanceSubjectIdResolved = attendanceSubjectId;
  if (attendanceSubjectIdResolved) {
    const { data: attendanceRows } = await admin
      .from("attendance_records")
      .select("attendance_date, status, enrollments!inner(academic_period_id)")
      .eq("subject_id", attendanceSubjectIdResolved)
      .eq("enrollments.academic_period_id", selectedPeriod.id)
      .gte("attendance_date", rangeStart)
      .lte("attendance_date", rangeEnd);

    const raw = (attendanceRows ?? []) as Array<{
      attendance_date: string;
      status: AttendanceStatus;
    }>;

    const agg = new Map<string, { present: number; total: number }>();
    const totalByDate = new Map<string, AttendanceAggRow[]>();

    for (const row of raw) {
      if (!totalByDate.has(row.attendance_date)) totalByDate.set(row.attendance_date, []);
      totalByDate.get(row.attendance_date)!.push({ attendance_date: row.attendance_date, status: row.status, count: 1 });

      const existing = agg.get(row.attendance_date) ?? { present: 0, total: 0 };
      existing.total += 1;
      if (row.status === "present") existing.present += 1;
      agg.set(row.attendance_date, existing);
    }

    const sortedDates = [...agg.keys()].sort((a, b) => a.localeCompare(b));
    attendanceTrend = sortedDates.map((date) => {
      const point = agg.get(date)!;
      const rate = point.total > 0 ? Number(((point.present / point.total) * 100).toFixed(1)) : 0;
      return { date, label: formatShortDate(date), value: rate, count: point.total };
    });

    const allRowsForRate: AttendanceAggRow[] = [];
    for (const rows of totalByDate.values()) {
      allRowsForRate.push(...rows);
    }
    attendanceRate = summarizeAttendance(allRowsForRate).rate;
  }

  // Score trend: daily tasks + scores mapped by (classroom, subject, assessment_no).
  const { data: assignmentRows } = await admin
    .from("subject_teacher_assignments")
    .select("id, classroom_id, subject_id")
    .eq("academic_period_id", selectedPeriod.id);

  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const assignmentById = new Map(assignments.map((row) => [row.id, row]));
  const assignmentIds = assignments.map((row) => row.id);

  const { data: dailyAssessmentsRows } = assignmentIds.length
    ? await admin
        .from("daily_assessments")
        .select("assignment_id, assessment_no, task_date")
        .eq("academic_period_id", selectedPeriod.id)
        .in("assignment_id", assignmentIds)
        .gte("task_date", rangeStart)
        .lte("task_date", rangeEnd)
    : { data: [] as unknown[] };

  const tasks = (dailyAssessmentsRows ?? []) as DailyAssessmentRow[];
  const tasksCount = tasks.length;

  const taskKeyToDate = new Map<string, string>();
  for (const task of tasks) {
    const assignment = assignmentById.get(task.assignment_id);
    if (!assignment) continue;
    taskKeyToDate.set(`${assignment.classroom_id}::${assignment.subject_id}::${task.assessment_no}`, task.task_date);
  }

  const assessmentNos = [...new Set(tasks.map((task) => task.assessment_no))];
  const subjectIds = [...new Set(assignments.map((a) => a.subject_id))];

  const { data: scoreRows } =
    assessmentNos.length && subjectIds.length
      ? await admin
          .from("scores")
          .select("subject_id, assessment_no, score, enrollments!inner(classroom_id, academic_period_id)")
          .eq("score_type", "daily")
          .in("subject_id", subjectIds)
          .in("assessment_no", assessmentNos)
          .eq("enrollments.academic_period_id", selectedPeriod.id)
      : { data: [] as unknown[] };

  const scores = (scoreRows ?? []) as ScoreRow[];

  const dailyByDate = new Map<string, { total: number; count: number }>();
  for (const score of scores) {
    if (score.assessment_no == null) continue;
    const enrollment = pickRelation(score.enrollments);
    if (!enrollment) continue;
    const date = taskKeyToDate.get(`${enrollment.classroom_id}::${score.subject_id}::${score.assessment_no}`);
    if (!date) continue;

    const existing = dailyByDate.get(date) ?? { total: 0, count: 0 };
    existing.total += score.score;
    existing.count += 1;
    dailyByDate.set(date, existing);
  }

  const scoreTrendDates = [...dailyByDate.keys()].sort((a, b) => a.localeCompare(b));
  const scoreTrend: AdminTrendPoint[] = scoreTrendDates.map((date) => {
    const agg = dailyByDate.get(date)!;
    const value = agg.count > 0 ? Number((agg.total / agg.count).toFixed(1)) : null;
    return { date, label: formatShortDate(date), value, count: agg.count };
  });

  const averageDailyScore =
    scores.length > 0 ? Number((scores.reduce((sum, row) => sum + row.score, 0) / scores.length).toFixed(1)) : 0;

  const warnings: AdminWarningItem[] = [];

  if (attendanceRate > 0 && attendanceRate < 85) {
    warnings.push({
      title: "Kehadiran keseluruhan rendah",
      detail: `Rata-rata kehadiran pada periode/bulan ini ${attendanceRate}%.`,
      severity: "warn",
    });
  }

  if (averageDailyScore > 0 && averageDailyScore < 70) {
    warnings.push({
      title: "Nilai harian rata-rata rendah",
      detail: `Rata-rata nilai harian pada periode/bulan ini ${averageDailyScore}.`,
      severity: "warn",
    });
  }

  if (tasksCount === 0) {
    warnings.push({
      title: "Belum ada task harian",
      detail: "Belum ada input tugas harian pada filter ini. Grafik nilai harian akan kosong.",
      severity: "info",
    });
  }

  if (!attendanceSubjectIdResolved) {
    warnings.push({
      title: "Absensi harian belum tercatat",
      detail: "Subject sistem `ATT_DAILY` belum ada. Input absensi minimal 1x agar grafik absensi muncul.",
      severity: "info",
    });
  }

  // Classroom-specific warnings (lightweight): attendance absent count per class in range.
  if (attendanceSubjectIdResolved) {
    const { data: byClassRows } = await admin
      .from("attendance_records")
      .select("status, enrollments!inner(classroom_id, academic_period_id, classrooms(classroom_name))")
      .eq("subject_id", attendanceSubjectIdResolved)
      .eq("enrollments.academic_period_id", selectedPeriod.id)
      .gte("attendance_date", rangeStart)
      .lte("attendance_date", rangeEnd);

    const raw = (byClassRows ?? []) as Array<{
      status: AttendanceStatus;
      enrollments: { classroom_id: string; academic_period_id: string; classrooms: { classroom_name: string }[] | { classroom_name: string } | null }[] | { classroom_id: string; academic_period_id: string; classrooms: { classroom_name: string }[] | { classroom_name: string } | null } | null;
    }>;

    const absencesByClass = new Map<string, { classroomName: string; absent: number; total: number; present: number }>();

    for (const row of raw) {
      const enrollment = pickRelation(row.enrollments);
      if (!enrollment) continue;
      const classroomName = pickRelation(enrollment.classrooms)?.classroom_name ?? "-";
      const existing = absencesByClass.get(enrollment.classroom_id) ?? { classroomName, absent: 0, total: 0, present: 0 };
      existing.total += 1;
      if (row.status === "absent") existing.absent += 1;
      if (row.status === "present") existing.present += 1;
      absencesByClass.set(enrollment.classroom_id, existing);
    }

    const worst = [...absencesByClass.values()]
      .filter((item) => item.total > 0)
      .map((item) => ({
        classroomName: item.classroomName,
        rate: item.present / item.total,
        total: item.total,
      }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);

    for (const item of worst) {
      const percent = clampPercent(Number((item.rate * 100).toFixed(1)));
      if (percent < 80) {
        warnings.push({
          title: "Kehadiran kelas perlu perhatian",
          detail: `${item.classroomName} rata-rata hadir ${percent}% pada filter ini (${item.total} entri).`,
          severity: "danger",
        });
      }
    }
  }

  return {
    periodOptions,
    monthOptions,
    selectedPeriodId: selectedPeriod.id,
    selectedMonth,
    selectedPeriodLabel: `${selectedPeriod.period_name} (Semester ${selectedPeriod.semester})`,
    kpis: {
      totalEnrollments,
      attendanceRate,
      averageDailyScore,
      tasksCount,
    },
    attendanceTrend,
    scoreTrend,
    warnings,
  };
}
