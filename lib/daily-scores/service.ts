import "server-only";

import { redirect } from "next/navigation";

import { getDashboardSession } from "@/lib/auth/dashboard";
import { DashboardRole } from "@/lib/auth/roles";
import { mapPostgresError } from "@/lib/admin/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type DailyAssessmentInput = {
  assignmentId: string;
  taskDate: string;
  title: string;
  description?: string | null;
};

export type DailyAssessmentUpdateInput = {
  dailyAssessmentId: string;
  taskDate: string;
  title: string;
  description?: string | null;
};

export type DailyScoreEntryInput = {
  enrollmentId: string;
  score: number | null;
  notes?: string | null;
};

export type SubmitDailyScoresInput = {
  assignmentId: string;
  dailyAssessmentId: string;
  entries: DailyScoreEntryInput[];
};

type CurrentPeriodRow = {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  semester: number;
  status: "planned" | "active" | "closed";
};

type TeacherRow = {
  id: string;
  full_name: string;
};

type AssignmentRow = {
  id: string;
  teacher_id: string;
  subject_id: string;
  classroom_id: string;
  academic_period_id: string;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
  subjects:
    | {
        subject_name: string;
        subject_code: string;
      }[]
    | {
        subject_name: string;
        subject_code: string;
      }
    | null;
  teachers: { full_name: string }[] | { full_name: string } | null;
};

type AssignmentBaseRow = {
  id: string;
  teacher_id: string;
  subject_id: string;
  classroom_id: string;
  academic_period_id: string;
};

type DailyAssessmentRow = {
  id: string;
  assignment_id: string;
  academic_period_id: string;
  assessment_no: number;
  task_date: string;
  title: string;
  description: string | null;
  created_by_teacher_id: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  students:
    | {
        full_name: string;
        nis: string | null;
      }[]
    | {
        full_name: string;
        nis: string | null;
      }
    | null;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
};

type ScoreRow = {
  id: string;
  enrollment_id: string;
  subject_id: string;
  score_type: "daily" | "uts" | "uas";
  assessment_no: number | null;
  score: number;
  notes: string | null;
};

type PeriodOptionRow = {
  id: string;
  period_name: string;
  semester: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export type DailyPeriod = {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  semester: number;
  status: "planned" | "active" | "closed";
};

export type DailyAssignmentOption = {
  id: string;
  classroomId: string;
  subjectId: string;
  periodId: string;
  teacherId: string;
  classroomName: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  label: string;
};

export type DailyAssessmentOption = {
  id: string;
  assignmentId: string;
  assessmentNo: number;
  taskDate: string;
  title: string;
  description: string;
  classroomName: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  label: string;
};

export type GuruDailyClassroomOption = {
  id: string;
  label: string;
};

export type GuruDailySubjectOption = {
  id: string;
  label: string;
};

export type GuruDailyStudentRow = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  nis: string | null;
  originalScore: number | null;
  finalScore: number | null;
  notes: string;
};

export type AdminDailyPeriodOption = {
  id: string;
  label: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
};

export type AdminDailyFilterOption = {
  id: string;
  label: string;
};

export type AdminDailyMonthOption = {
  value: string;
  label: string;
};

export type AdminDailyStudentRow = {
  enrollmentId: string;
  studentName: string;
  nis: string | null;
  classroomName: string;
};

export type AdminDailyScoreRow = {
  scoreId: string;
  enrollmentId: string;
  taskId: string;
  taskDate: string;
  taskLabel: string;
  taskTitle: string;
  classroomName: string;
  subjectName: string;
  teacherName: string;
  studentName: string;
  nis: string | null;
  originalScore: number;
  finalScore: number;
};

export type DailyMonitorStats = {
  averageFinalScore: number;
  totalTasks: number;
  totalEntries: number;
  highestScore: number;
};

export type DailyTopScoreRow = {
  studentName: string;
  classroomName: string;
  subjectName: string;
  taskLabel: string;
  finalScore: number;
};

export type DailyTrendPoint = {
  taskId: string;
  taskDate: string;
  taskLabel: string;
  taskTitle: string;
  averageFinalScore: number | null;
  entryCount: number;
};

export type DailyComponentScore = {
  enrollmentId: string;
  subjectId: string;
  averageFinalScore: number;
  scoredTaskCount: number;
};

export type DailyScorePageData = {
  role: DashboardRole;
  currentPeriod: DailyPeriod | null;
  guru: {
    assignments: DailyAssignmentOption[];
    classroomOptions: GuruDailyClassroomOption[];
    subjectOptions: GuruDailySubjectOption[];
    selectedClassroomId: string | null;
    selectedSubjectId: string | null;
    selectedAssignmentId: string | null;
    selectedAssignment: DailyAssignmentOption | null;
    taskOptions: DailyAssessmentOption[];
    selectedTaskId: string | null;
    selectedTask: DailyAssessmentOption | null;
    students: GuruDailyStudentRow[];
    isLocked: boolean;
    defaultTaskDate: string;
  } | null;
  admin: {
    periodOptions: AdminDailyPeriodOption[];
    classroomOptions: AdminDailyFilterOption[];
    subjectOptions: AdminDailyFilterOption[];
    teacherOptions: AdminDailyFilterOption[];
    monthOptions: AdminDailyMonthOption[];
    selectedPeriodId: string | null;
    selectedClassroomId: string;
    selectedSubjectId: string;
    selectedTeacherId: string;
    selectedMonth: string;
    students: AdminDailyStudentRow[];
    rows: AdminDailyScoreRow[];
    stats: DailyMonitorStats;
    topScores: DailyTopScoreRow[];
    trend: DailyTrendPoint[];
  } | null;
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
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

function toFinalScore(score: number) {
  return score;
}

function emptyMonitorStats(): DailyMonitorStats {
  return {
    averageFinalScore: 0,
    totalTasks: 0,
    totalEntries: 0,
    highestScore: 0,
  };
}

function toMonthValue(dateValue: string) {
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
  const end = new Date(Date.UTC(year, month, 0));
  return toIsoDate(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate());
}

function formatMonthLabel(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildMonthOptions(startDate: string, endDate: string): AdminDailyMonthOption[] {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const months: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= last) {
    months.push(toMonthValue(cursor.toISOString().slice(0, 10)));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months
    .reverse()
    .map((value) => ({ value, label: formatMonthLabel(value) }));
}

function getMonthRangeWithinPeriod(monthValue: string, periodStart: string, periodEnd: string) {
  const monthStart = startOfMonth(monthValue);
  const monthEnd = endOfMonth(monthValue);

  return {
    startDate: monthStart < periodStart ? periodStart : monthStart,
    endDate: monthEnd > periodEnd ? periodEnd : monthEnd,
  };
}

function resolveDefaultMonth(params: {
  selectedMonth?: string | null;
  monthOptions: AdminDailyMonthOption[];
  periodStart: string;
}) {
  const optionSet = new Set(params.monthOptions.map((option) => option.value));
  if (params.selectedMonth && optionSet.has(params.selectedMonth)) {
    return params.selectedMonth;
  }

  const todayMonth = new Date().toISOString().slice(0, 7);
  if (optionSet.has(todayMonth)) {
    return todayMonth;
  }

  if (params.monthOptions[0]?.value) {
    return params.monthOptions[0].value;
  }

  return params.periodStart.slice(0, 7);
}

function resolveDefaultTaskDate(startDate: string, endDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return startDate;
  if (today > endDate) return endDate;
  return today;
}

function validateScoreValue(value: number | null, fieldLabel: string) {
  if (value == null) return;
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldLabel} tidak valid.`);
  }
  if (value < 0 || value > 100) {
    throw new Error(`${fieldLabel} harus di antara 0 sampai 100.`);
  }
}

function parseAndValidateTaskDate(taskDate: string, period: CurrentPeriodRow) {
  if (!isValidDate(taskDate)) {
    throw new Error("Tanggal tugas tidak valid.");
  }

  if (taskDate < period.start_date || taskDate > period.end_date) {
    throw new Error("Tanggal tugas harus berada dalam rentang periode current.");
  }
}

async function getCurrentPeriod() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("academic_periods")
    .select("id, period_name, start_date, end_date, semester, status")
    .eq("is_current", true)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as CurrentPeriodRow[])[0] ?? null;
}

async function isPeriodLocked(academicPeriodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("report_cards")
    .select("id, enrollments!inner(academic_period_id)")
    .neq("status", "draft")
    .eq("enrollments.academic_period_id", academicPeriodId)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return (data ?? []).length > 0;
}

async function getTeacherByProfile(profileId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("teachers")
    .select("id, full_name")
    .eq("profile_id", profileId)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as TeacherRow[])[0] ?? null;
}

function normalizeAssignmentRow(row: AssignmentRow): DailyAssignmentOption {
  const classroom = pickRelation(row.classrooms);
  const subject = pickRelation(row.subjects);
  const teacher = pickRelation(row.teachers);

  return {
    id: row.id,
    classroomId: row.classroom_id,
    subjectId: row.subject_id,
    periodId: row.academic_period_id,
    teacherId: row.teacher_id,
    classroomName: classroom?.classroom_name ?? "-",
    subjectName: subject?.subject_name ?? "-",
    subjectCode: subject?.subject_code ?? "-",
    teacherName: teacher?.full_name ?? "-",
    label: `${classroom?.classroom_name ?? "-"} - ${subject?.subject_name ?? "-"}`,
  };
}

async function getTeacherAssignments(teacherId: string, periodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("subject_teacher_assignments")
    .select("id, teacher_id, subject_id, classroom_id, academic_period_id, classrooms(classroom_name), subjects(subject_name, subject_code), teachers(full_name)")
    .eq("teacher_id", teacherId)
    .eq("academic_period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapPostgresError(error.message));

  return ((data ?? []) as AssignmentRow[])
    .map(normalizeAssignmentRow)
    .sort((a, b) => {
      const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
      if (classroomOrder !== 0) return classroomOrder;
      return a.subjectName.localeCompare(b.subjectName);
    });
}

async function getAllAssignmentsInPeriod(periodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("subject_teacher_assignments")
    .select("id, teacher_id, subject_id, classroom_id, academic_period_id, classrooms(classroom_name), subjects(subject_name, subject_code), teachers(full_name)")
    .eq("academic_period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapPostgresError(error.message));

  return ((data ?? []) as AssignmentRow[])
    .map(normalizeAssignmentRow)
    .sort((a, b) => {
      const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
      if (classroomOrder !== 0) return classroomOrder;
      const subjectOrder = a.subjectName.localeCompare(b.subjectName);
      if (subjectOrder !== 0) return subjectOrder;
      return a.teacherName.localeCompare(b.teacherName);
    });
}

async function getDailyAssessmentsByAssignment(assignmentId: string, periodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("daily_assessments")
    .select("id, assignment_id, academic_period_id, assessment_no, task_date, title, description, created_by_teacher_id, created_at")
    .eq("assignment_id", assignmentId)
    .eq("academic_period_id", periodId)
    .order("task_date", { ascending: false })
    .order("assessment_no", { ascending: false });

  if (error) throw new Error(mapPostgresError(error.message));
  return (data ?? []) as DailyAssessmentRow[];
}

function normalizeDailyAssessment(
  row: DailyAssessmentRow,
  assignment: DailyAssignmentOption
): DailyAssessmentOption {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    assessmentNo: row.assessment_no,
    taskDate: row.task_date,
    title: row.title,
    description: row.description ?? "",
    classroomName: assignment.classroomName,
    subjectName: assignment.subjectName,
    subjectCode: assignment.subjectCode,
    teacherName: assignment.teacherName,
    label: `Tugas #${row.assessment_no} • ${row.task_date} • ${row.title}`,
  };
}

async function getGuruStudentsByTask(params: {
  assignment: DailyAssignmentOption;
  task: DailyAssessmentOption;
}): Promise<GuruDailyStudentRow[]> {
  const admin = createAdminSupabaseClient();
  const { assignment, task } = params;

  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, students(full_name, nis)")
    .eq("classroom_id", assignment.classroomId)
    .eq("academic_period_id", assignment.periodId)
    .order("student_id", { ascending: true });

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  if (!enrollments.length) return [];

  const enrollmentIds = enrollments.map((row) => row.id);

  const { data: scoreData, error: scoreError } = await admin
    .from("scores")
    .select("id, enrollment_id, subject_id, score_type, assessment_no, score, notes")
    .eq("subject_id", assignment.subjectId)
    .eq("score_type", "daily")
    .eq("assessment_no", task.assessmentNo)
    .in("enrollment_id", enrollmentIds);

  if (scoreError) throw new Error(mapPostgresError(scoreError.message));

  const scoreByEnrollment = new Map<string, ScoreRow>();
  for (const row of (scoreData ?? []) as ScoreRow[]) {
    scoreByEnrollment.set(row.enrollment_id, row);
  }

  return enrollments.map((enrollment) => {
    const student = pickRelation(enrollment.students);
    const score = scoreByEnrollment.get(enrollment.id);
    const originalScore = score?.score ?? null;

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      studentName: student?.full_name ?? "-",
      nis: student?.nis ?? null,
      originalScore,
      finalScore: originalScore == null ? null : toFinalScore(originalScore),
      notes: score?.notes ?? "",
    };
  });
}

function resolveClassroomOptions(assignments: DailyAssignmentOption[]) {
  return Array.from(
    assignments.reduce((accumulator, assignment) => {
      if (!accumulator.has(assignment.classroomId)) {
        accumulator.set(assignment.classroomId, {
          id: assignment.classroomId,
          label: assignment.classroomName,
        });
      }
      return accumulator;
    }, new Map<string, GuruDailyClassroomOption>())
  )
    .map(([, value]) => value)
    .sort((a, b) => compareClassroomName(a.label, b.label));
}

function resolveSubjectOptions(assignments: DailyAssignmentOption[], classroomId: string | null) {
  return Array.from(
    assignments.reduce((accumulator, assignment) => {
      if (assignment.classroomId !== classroomId) return accumulator;
      if (!accumulator.has(assignment.subjectId)) {
        accumulator.set(assignment.subjectId, {
          id: assignment.subjectId,
          label: `${assignment.subjectName} (${assignment.subjectCode})`,
        });
      }
      return accumulator;
    }, new Map<string, GuruDailySubjectOption>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function resolveGuruData(params: {
  profileId: string;
  currentPeriod: CurrentPeriodRow;
  assignmentId?: string | null;
  classroomId?: string | null;
  subjectId?: string | null;
  taskId?: string | null;
}) {
  const teacher = await getTeacherByProfile(params.profileId);
  if (!teacher) {
    throw new Error("Akun guru tidak terhubung dengan data teachers.");
  }

  const assignments = await getTeacherAssignments(teacher.id, params.currentPeriod.id);
  const assignmentFromId = assignments.find((item) => item.id === params.assignmentId) ?? null;

  const classroomOptions = resolveClassroomOptions(assignments);

  const selectedClassroomId =
    (params.classroomId && classroomOptions.some((option) => option.id === params.classroomId)
      ? params.classroomId
      : null) ??
    assignmentFromId?.classroomId ??
    classroomOptions[0]?.id ??
    null;

  const subjectOptions = resolveSubjectOptions(assignments, selectedClassroomId);

  const selectedSubjectId =
    (params.subjectId && subjectOptions.some((option) => option.id === params.subjectId)
      ? params.subjectId
      : null) ??
    (assignmentFromId?.classroomId === selectedClassroomId ? assignmentFromId.subjectId : null) ??
    subjectOptions[0]?.id ??
    null;

  const selectedAssignment =
    assignments.find(
      (item) => item.classroomId === selectedClassroomId && item.subjectId === selectedSubjectId
    ) ??
    assignmentFromId ??
    assignments[0] ??
    null;

  const taskRows = selectedAssignment
    ? await getDailyAssessmentsByAssignment(selectedAssignment.id, params.currentPeriod.id)
    : [];

  const taskOptions = selectedAssignment
    ? taskRows.map((row) => normalizeDailyAssessment(row, selectedAssignment))
    : [];

  const selectedTask =
    taskOptions.find((task) => task.id === params.taskId) ?? taskOptions[0] ?? null;

  const students =
    selectedTask && selectedAssignment
      ? await getGuruStudentsByTask({ assignment: selectedAssignment, task: selectedTask })
      : [];

  const isLocked = await isPeriodLocked(params.currentPeriod.id);

  return {
    assignments,
    classroomOptions,
    subjectOptions,
    selectedClassroomId,
    selectedSubjectId,
    selectedAssignmentId: selectedAssignment?.id ?? null,
    selectedAssignment,
    taskOptions,
    selectedTaskId: selectedTask?.id ?? null,
    selectedTask,
    students,
    isLocked,
    defaultTaskDate: resolveDefaultTaskDate(params.currentPeriod.start_date, params.currentPeriod.end_date),
  };
}

type AdminMonitorParams = {
  currentPeriodId: string | null;
  selectedPeriodId?: string | null;
  selectedClassroomId?: string | null;
  selectedSubjectId?: string | null;
  selectedTeacherId?: string | null;
  selectedMonth?: string | null;
};

async function getAdminMonitorData(params: AdminMonitorParams) {
  const admin = createAdminSupabaseClient();

  const { data: periodData, error: periodError } = await admin
    .from("academic_periods")
    .select("id, period_name, semester, start_date, end_date, is_current")
    .order("start_date", { ascending: false });

  if (periodError) throw new Error(mapPostgresError(periodError.message));

  const periodRows = (periodData ?? []) as PeriodOptionRow[];
  const periodOptions: AdminDailyPeriodOption[] = periodRows.map((row) => ({
    id: row.id,
    label: `${row.period_name} (Semester ${row.semester})`,
    isCurrent: row.is_current,
    startDate: row.start_date,
    endDate: row.end_date,
  }));

  const selectedPeriod =
    periodRows.find((period) => period.id === params.selectedPeriodId) ??
    periodRows.find((period) => period.id === params.currentPeriodId) ??
    periodRows[0] ??
    null;

  if (!selectedPeriod) {
    return {
      periodOptions,
      classroomOptions: [] as AdminDailyFilterOption[],
      subjectOptions: [] as AdminDailyFilterOption[],
      teacherOptions: [] as AdminDailyFilterOption[],
      monthOptions: [] as AdminDailyMonthOption[],
      selectedPeriodId: null,
      selectedClassroomId: "",
      selectedSubjectId: "",
      selectedTeacherId: "",
      selectedMonth: "",
      students: [] as AdminDailyStudentRow[],
      rows: [] as AdminDailyScoreRow[],
      stats: emptyMonitorStats(),
      topScores: [] as DailyTopScoreRow[],
      trend: [] as DailyTrendPoint[],
    };
  }

  const assignments = await getAllAssignmentsInPeriod(selectedPeriod.id);

  const classroomOptions = Array.from(
    assignments.reduce((accumulator, assignment) => {
      if (!accumulator.has(assignment.classroomId)) {
        accumulator.set(assignment.classroomId, {
          id: assignment.classroomId,
          label: assignment.classroomName,
        });
      }
      return accumulator;
    }, new Map<string, AdminDailyFilterOption>())
  )
    .map(([, value]) => value)
    .sort((a, b) => compareClassroomName(a.label, b.label));

  const subjectOptions = Array.from(
    assignments.reduce((accumulator, assignment) => {
      if (!accumulator.has(assignment.subjectId)) {
        accumulator.set(assignment.subjectId, {
          id: assignment.subjectId,
          label: `${assignment.subjectName} (${assignment.subjectCode})`,
        });
      }
      return accumulator;
    }, new Map<string, AdminDailyFilterOption>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.label.localeCompare(b.label));

  const teacherOptions = Array.from(
    assignments.reduce((accumulator, assignment) => {
      if (!accumulator.has(assignment.teacherId)) {
        accumulator.set(assignment.teacherId, {
          id: assignment.teacherId,
          label: assignment.teacherName,
        });
      }
      return accumulator;
    }, new Map<string, AdminDailyFilterOption>())
  )
    .map(([, value]) => value)
    .sort((a, b) => a.label.localeCompare(b.label));

  const selectedClassroomId =
    params.selectedClassroomId && classroomOptions.some((option) => option.id === params.selectedClassroomId)
      ? params.selectedClassroomId
      : "";

  const selectedSubjectId =
    params.selectedSubjectId && subjectOptions.some((option) => option.id === params.selectedSubjectId)
      ? params.selectedSubjectId
      : "";

  const selectedTeacherId =
    params.selectedTeacherId && teacherOptions.some((option) => option.id === params.selectedTeacherId)
      ? params.selectedTeacherId
      : "";

  const monthOptions = buildMonthOptions(selectedPeriod.start_date, selectedPeriod.end_date);
  const selectedMonth = resolveDefaultMonth({
    selectedMonth: params.selectedMonth && isValidMonth(params.selectedMonth) ? params.selectedMonth : null,
    monthOptions,
    periodStart: selectedPeriod.start_date,
  });

  const filteredAssignments = assignments.filter((assignment) => {
    if (selectedClassroomId && assignment.classroomId !== selectedClassroomId) return false;
    if (selectedSubjectId && assignment.subjectId !== selectedSubjectId) return false;
    if (selectedTeacherId && assignment.teacherId !== selectedTeacherId) return false;
    return true;
  });

  const monthRange = getMonthRangeWithinPeriod(
    selectedMonth,
    selectedPeriod.start_date,
    selectedPeriod.end_date
  );

  const assignmentIds = filteredAssignments.map((assignment) => assignment.id);
  if (!assignmentIds.length) {
    return {
      periodOptions,
      classroomOptions,
      subjectOptions,
      teacherOptions,
      monthOptions,
      selectedPeriodId: selectedPeriod.id,
      selectedClassroomId,
      selectedSubjectId,
      selectedTeacherId,
      selectedMonth,
      students: [] as AdminDailyStudentRow[],
      rows: [] as AdminDailyScoreRow[],
      stats: emptyMonitorStats(),
      topScores: [] as DailyTopScoreRow[],
      trend: [] as DailyTrendPoint[],
    };
  }

  const { data: taskData, error: taskError } = await admin
    .from("daily_assessments")
    .select("id, assignment_id, academic_period_id, assessment_no, task_date, title, description, created_by_teacher_id, created_at")
    .eq("academic_period_id", selectedPeriod.id)
    .in("assignment_id", assignmentIds)
    .gte("task_date", monthRange.startDate)
    .lte("task_date", monthRange.endDate)
    .order("task_date", { ascending: true })
    .order("assessment_no", { ascending: true });

  if (taskError) throw new Error(mapPostgresError(taskError.message));

  const assignmentById = new Map(filteredAssignments.map((item) => [item.id, item]));

  const tasks = ((taskData ?? []) as DailyAssessmentRow[])
    .map((row) => {
      const assignment = assignmentById.get(row.assignment_id);
      if (!assignment) return null;
      return normalizeDailyAssessment(row, assignment);
    })
    .filter((value): value is DailyAssessmentOption => value != null);

  if (!tasks.length) {
    return {
      periodOptions,
      classroomOptions,
      subjectOptions,
      teacherOptions,
      monthOptions,
      selectedPeriodId: selectedPeriod.id,
      selectedClassroomId,
      selectedSubjectId,
      selectedTeacherId,
      selectedMonth,
      students: [] as AdminDailyStudentRow[],
      rows: [] as AdminDailyScoreRow[],
      stats: {
        ...emptyMonitorStats(),
        totalTasks: 0,
      },
      topScores: [] as DailyTopScoreRow[],
      trend: [] as DailyTrendPoint[],
    };
  }

  const classroomIds = [...new Set(filteredAssignments.map((assignment) => assignment.classroomId))];
  const subjectIds = [...new Set(filteredAssignments.map((assignment) => assignment.subjectId))];

  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, students(full_name, nis), classrooms(classroom_name)")
    .eq("academic_period_id", selectedPeriod.id)
    .in("classroom_id", classroomIds);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  if (!enrollments.length) {
    const trend = tasks.map((task) => ({
      taskId: task.id,
      taskDate: task.taskDate,
      taskLabel: `T${task.assessmentNo}`,
      taskTitle: task.title,
      averageFinalScore: null,
      entryCount: 0,
    }));

    return {
      periodOptions,
      classroomOptions,
      subjectOptions,
      teacherOptions,
      monthOptions,
      selectedPeriodId: selectedPeriod.id,
      selectedClassroomId,
      selectedSubjectId,
      selectedTeacherId,
      selectedMonth,
      students: [] as AdminDailyStudentRow[],
      rows: [] as AdminDailyScoreRow[],
      stats: {
        ...emptyMonitorStats(),
        totalTasks: tasks.length,
      },
      topScores: [] as DailyTopScoreRow[],
      trend,
    };
  }

  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]));
  const students: AdminDailyStudentRow[] = enrollments
    .map((enrollment) => {
      const student = pickRelation(enrollment.students);
      const classroom = pickRelation(enrollment.classrooms);
      return {
        enrollmentId: enrollment.id,
        studentName: student?.full_name ?? "-",
        nis: student?.nis ?? null,
        classroomName: classroom?.classroom_name ?? "-",
      };
    })
    .sort((a, b) => {
      const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
      if (classroomOrder !== 0) return classroomOrder;
      const nameOrder = a.studentName.localeCompare(b.studentName);
      if (nameOrder !== 0) return nameOrder;
      return (a.nis ?? "").localeCompare(b.nis ?? "");
    });
  const enrollmentIds = enrollments.map((row) => row.id);
  const assessmentNumbers = [...new Set(tasks.map((task) => task.assessmentNo))];

  const { data: scoreData, error: scoreError } = await admin
    .from("scores")
    .select("id, enrollment_id, subject_id, score_type, assessment_no, score, notes")
    .eq("score_type", "daily")
    .in("subject_id", subjectIds)
    .in("enrollment_id", enrollmentIds)
    .in("assessment_no", assessmentNumbers);

  if (scoreError) throw new Error(mapPostgresError(scoreError.message));

  const assignmentByClassSubject = new Map<string, DailyAssignmentOption>(
    filteredAssignments.map((assignment) => [
      `${assignment.classroomId}::${assignment.subjectId}`,
      assignment,
    ])
  );

  const taskByAssignmentAndNo = new Map<string, DailyAssessmentOption>(
    tasks.map((task) => [`${task.assignmentId}::${task.assessmentNo}`, task])
  );

  const rows: AdminDailyScoreRow[] = [];

  for (const score of (scoreData ?? []) as ScoreRow[]) {
    if (score.assessment_no == null) continue;

    const enrollment = enrollmentById.get(score.enrollment_id);
    if (!enrollment) continue;

    const assignment = assignmentByClassSubject.get(`${enrollment.classroom_id}::${score.subject_id}`);
    if (!assignment) continue;

    const task = taskByAssignmentAndNo.get(`${assignment.id}::${score.assessment_no}`);
    if (!task) continue;

    const student = pickRelation(enrollment.students);
    const classroom = pickRelation(enrollment.classrooms);

    rows.push({
      scoreId: score.id,
      enrollmentId: enrollment.id,
      taskId: task.id,
      taskDate: task.taskDate,
      taskLabel: `T${task.assessmentNo}`,
      taskTitle: task.title,
      classroomName: classroom?.classroom_name ?? assignment.classroomName,
      subjectName: assignment.subjectName,
      teacherName: assignment.teacherName,
      studentName: student?.full_name ?? "-",
      nis: student?.nis ?? null,
      originalScore: score.score,
      finalScore: toFinalScore(score.score),
    });
  }

  rows.sort((a, b) => {
    if (a.taskDate !== b.taskDate) return b.taskDate.localeCompare(a.taskDate);
    if (a.taskLabel !== b.taskLabel) return b.taskLabel.localeCompare(a.taskLabel);
    return b.finalScore - a.finalScore;
  });

  const stats: DailyMonitorStats = rows.length
    ? {
        averageFinalScore: Number((rows.reduce((sum, row) => sum + row.finalScore, 0) / rows.length).toFixed(1)),
        totalTasks: tasks.length,
        totalEntries: rows.length,
        highestScore: rows.reduce((max, row) => (row.finalScore > max ? row.finalScore : max), 0),
      }
    : {
        ...emptyMonitorStats(),
        totalTasks: tasks.length,
      };

  const topScores: DailyTopScoreRow[] = [...rows]
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
    .map((row) => ({
      studentName: row.studentName,
      classroomName: row.classroomName,
      subjectName: row.subjectName,
      taskLabel: row.taskLabel,
      finalScore: row.finalScore,
    }));

  const trendAgg = new Map<
    string,
    {
      total: number;
      count: number;
    }
  >();

  for (const row of rows) {
    const existing = trendAgg.get(row.taskId) ?? { total: 0, count: 0 };
    existing.total += row.finalScore;
    existing.count += 1;
    trendAgg.set(row.taskId, existing);
  }

  const trend: DailyTrendPoint[] = tasks.map((task) => {
    const aggregate = trendAgg.get(task.id);
    return {
      taskId: task.id,
      taskDate: task.taskDate,
      taskLabel: `T${task.assessmentNo}`,
      taskTitle: task.title,
      averageFinalScore:
        aggregate && aggregate.count > 0
          ? Number((aggregate.total / aggregate.count).toFixed(1))
          : null,
      entryCount: aggregate?.count ?? 0,
    };
  });

  return {
    periodOptions,
    classroomOptions,
    subjectOptions,
    teacherOptions,
    monthOptions,
    selectedPeriodId: selectedPeriod.id,
    selectedClassroomId,
    selectedSubjectId,
    selectedTeacherId,
    selectedMonth,
    students,
    rows,
    stats,
    topScores,
    trend,
  };
}

export async function getDailyScorePageData(params: {
  assignmentId?: string | null;
  classroomId?: string | null;
  subjectId?: string | null;
  taskId?: string | null;
  periodId?: string | null;
  teacherId?: string | null;
  month?: string | null;
}): Promise<DailyScorePageData> {
  const session = await getDashboardSession();
  if (session.role === "murid") {
    redirect("/unauthorized");
  }

  const currentPeriod = await getCurrentPeriod();

  if (session.role === "guru") {
    if (!currentPeriod) {
      return {
        role: session.role,
        currentPeriod: null,
        guru: {
          assignments: [],
          classroomOptions: [],
          subjectOptions: [],
          selectedClassroomId: null,
          selectedSubjectId: null,
          selectedAssignmentId: null,
          selectedAssignment: null,
          taskOptions: [],
          selectedTaskId: null,
          selectedTask: null,
          students: [],
          isLocked: false,
          defaultTaskDate: new Date().toISOString().slice(0, 10),
        },
        admin: null,
      };
    }

    const guru = await resolveGuruData({
      profileId: session.id,
      currentPeriod,
      assignmentId: params.assignmentId,
      classroomId: params.classroomId,
      subjectId: params.subjectId,
      taskId: params.taskId,
    });

    return {
      role: session.role,
      currentPeriod: {
        id: currentPeriod.id,
        periodName: currentPeriod.period_name,
        startDate: currentPeriod.start_date,
        endDate: currentPeriod.end_date,
        semester: currentPeriod.semester,
        status: currentPeriod.status,
      },
      guru,
      admin: null,
    };
  }

  const admin = await getAdminMonitorData({
    currentPeriodId: currentPeriod?.id ?? null,
    selectedPeriodId: params.periodId,
    selectedClassroomId: params.classroomId,
    selectedSubjectId: params.subjectId,
    selectedTeacherId: params.teacherId,
    selectedMonth: params.month,
  });

  return {
    role: session.role,
    currentPeriod: currentPeriod
      ? {
          id: currentPeriod.id,
          periodName: currentPeriod.period_name,
          startDate: currentPeriod.start_date,
          endDate: currentPeriod.end_date,
          semester: currentPeriod.semester,
          status: currentPeriod.status,
        }
      : null,
    guru: null,
    admin,
  };
}

async function getAssignmentMutationContext(profileId: string, assignmentId: string) {
  const currentPeriod = await getCurrentPeriod();
  if (!currentPeriod) {
    throw new Error("Belum ada periode current.");
  }

  const teacher = await getTeacherByProfile(profileId);
  if (!teacher) {
    throw new Error("Akun guru tidak terhubung dengan data teachers.");
  }

  const admin = createAdminSupabaseClient();
  const { data: assignmentData, error: assignmentError } = await admin
    .from("subject_teacher_assignments")
    .select("id, teacher_id, subject_id, classroom_id, academic_period_id")
    .eq("id", assignmentId)
    .single<AssignmentBaseRow>();

  if (assignmentError || !assignmentData) {
    throw new Error("Assignment guru-mapel tidak ditemukan.");
  }

  if (assignmentData.teacher_id !== teacher.id) {
    throw new Error("Kamu tidak memiliki akses untuk assignment ini.");
  }

  if (assignmentData.academic_period_id !== currentPeriod.id) {
    throw new Error("Nilai harian hanya bisa dikelola pada periode current.");
  }

  const locked = await isPeriodLocked(currentPeriod.id);
  if (locked) {
    throw new Error("Periode ini sudah locked untuk raport. Task dan nilai harian tidak bisa diubah.");
  }

  return {
    currentPeriod,
    teacher,
    assignment: assignmentData,
  };
}

export async function createDailyAssessment(input: DailyAssessmentInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat membuat tugas harian.");
  }

  const assignmentId = input.assignmentId.trim();
  if (!assignmentId) {
    throw new Error("Assignment wajib dipilih.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("Judul tugas wajib diisi.");
  }

  const taskDate = input.taskDate.trim();

  const context = await getAssignmentMutationContext(session.id, assignmentId);
  parseAndValidateTaskDate(taskDate, context.currentPeriod);

  const admin = createAdminSupabaseClient();
  const { data: latestData, error: latestError } = await admin
    .from("daily_assessments")
    .select("assessment_no")
    .eq("assignment_id", assignmentId)
    .eq("academic_period_id", context.currentPeriod.id)
    .order("assessment_no", { ascending: false })
    .limit(1);

  if (latestError) throw new Error(mapPostgresError(latestError.message));

  const nextAssessmentNo = ((latestData ?? [])[0]?.assessment_no ?? 0) + 1;

  const { data: inserted, error: insertError } = await admin
    .from("daily_assessments")
    .insert({
      assignment_id: assignmentId,
      academic_period_id: context.currentPeriod.id,
      assessment_no: nextAssessmentNo,
      task_date: taskDate,
      title,
      description: (input.description ?? "").trim() || null,
      created_by_teacher_id: context.teacher.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    throw new Error(mapPostgresError(insertError?.message ?? "Gagal membuat tugas harian."));
  }

  return {
    id: inserted.id,
    assessmentNo: nextAssessmentNo,
  };
}

export async function updateDailyAssessment(input: DailyAssessmentUpdateInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat mengubah tugas harian.");
  }

  const dailyAssessmentId = input.dailyAssessmentId.trim();
  if (!dailyAssessmentId) {
    throw new Error("Task harian tidak valid.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("Judul tugas wajib diisi.");
  }

  const taskDate = input.taskDate.trim();

  const admin = createAdminSupabaseClient();
  const { data: taskData, error: taskError } = await admin
    .from("daily_assessments")
    .select("id, assignment_id, academic_period_id, assessment_no, task_date, title, description, created_by_teacher_id, created_at")
    .eq("id", dailyAssessmentId)
    .single<DailyAssessmentRow>();

  if (taskError || !taskData) {
    throw new Error("Task harian tidak ditemukan.");
  }

  const context = await getAssignmentMutationContext(session.id, taskData.assignment_id);

  if (taskData.academic_period_id !== context.currentPeriod.id) {
    throw new Error("Task harian hanya bisa diubah pada periode current.");
  }

  parseAndValidateTaskDate(taskDate, context.currentPeriod);

  const { error: updateError } = await admin
    .from("daily_assessments")
    .update({
      task_date: taskDate,
      title,
      description: (input.description ?? "").trim() || null,
    })
    .eq("id", dailyAssessmentId);

  if (updateError) {
    throw new Error(mapPostgresError(updateError.message));
  }
}

export async function deleteDailyAssessment(dailyAssessmentId: string) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat menghapus tugas harian.");
  }

  const id = dailyAssessmentId.trim();
  if (!id) {
    throw new Error("Task harian tidak valid.");
  }

  const admin = createAdminSupabaseClient();
  const { data: taskData, error: taskError } = await admin
    .from("daily_assessments")
    .select("id, assignment_id, academic_period_id, assessment_no, task_date, title, description, created_by_teacher_id, created_at")
    .eq("id", id)
    .single<DailyAssessmentRow>();

  if (taskError || !taskData) {
    throw new Error("Task harian tidak ditemukan.");
  }

  const context = await getAssignmentMutationContext(session.id, taskData.assignment_id);

  if (taskData.academic_period_id !== context.currentPeriod.id) {
    throw new Error("Task harian hanya bisa dihapus pada periode current.");
  }

  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("classroom_id", context.assignment.classroom_id)
    .eq("academic_period_id", context.currentPeriod.id);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollmentIds = (enrollmentData ?? []).map((row) => row.id as string);

  if (enrollmentIds.length > 0) {
    const { error: scoreDeleteError } = await admin
      .from("scores")
      .delete()
      .eq("subject_id", context.assignment.subject_id)
      .eq("score_type", "daily")
      .eq("assessment_no", taskData.assessment_no)
      .in("enrollment_id", enrollmentIds);

    if (scoreDeleteError) {
      throw new Error(mapPostgresError(scoreDeleteError.message));
    }
  }

  const { error: deleteError } = await admin.from("daily_assessments").delete().eq("id", id);
  if (deleteError) {
    throw new Error(mapPostgresError(deleteError.message));
  }
}

export async function submitDailyScores(input: SubmitDailyScoresInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat menginput nilai harian.");
  }

  const assignmentId = input.assignmentId.trim();
  if (!assignmentId) {
    throw new Error("Assignment wajib dipilih.");
  }

  const dailyAssessmentId = input.dailyAssessmentId.trim();
  if (!dailyAssessmentId) {
    throw new Error("Task harian wajib dipilih.");
  }

  const context = await getAssignmentMutationContext(session.id, assignmentId);
  const admin = createAdminSupabaseClient();

  const { data: taskData, error: taskError } = await admin
    .from("daily_assessments")
    .select("id, assignment_id, academic_period_id, assessment_no, task_date, title, description, created_by_teacher_id, created_at")
    .eq("id", dailyAssessmentId)
    .eq("assignment_id", assignmentId)
    .eq("academic_period_id", context.currentPeriod.id)
    .single<DailyAssessmentRow>();

  if (taskError || !taskData) {
    throw new Error("Task harian tidak valid untuk assignment yang dipilih.");
  }

  const cleanedEntries = input.entries
    .map((entry) => ({
      enrollmentId: entry.enrollmentId.trim(),
      score: entry.score,
      notes: (entry.notes ?? "").trim(),
    }))
    .filter((entry) => entry.enrollmentId.length > 0);

  if (!cleanedEntries.length) {
    throw new Error("Tidak ada data siswa untuk disimpan.");
  }

  const finalEntries = cleanedEntries.filter((entry) => entry.score != null);
  if (!finalEntries.length) {
    throw new Error("Minimal satu nilai awal harus diisi.");
  }

  for (const entry of finalEntries) {
    validateScoreValue(entry.score, "Nilai awal");
  }

  const enrollmentIds = [...new Set(finalEntries.map((entry) => entry.enrollmentId))];
  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("classroom_id", context.assignment.classroom_id)
    .eq("academic_period_id", context.currentPeriod.id)
    .in("id", enrollmentIds);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const validEnrollmentIds = new Set((enrollmentData ?? []).map((row) => row.id));
  if (validEnrollmentIds.size !== enrollmentIds.length) {
    throw new Error("Sebagian siswa tidak valid untuk assignment dan periode current.");
  }

  const { data: existingScoreData, error: existingScoreError } = await admin
    .from("scores")
    .select("id, enrollment_id")
    .eq("subject_id", context.assignment.subject_id)
    .eq("score_type", "daily")
    .eq("assessment_no", taskData.assessment_no)
    .in("enrollment_id", enrollmentIds);

  if (existingScoreError) throw new Error(mapPostgresError(existingScoreError.message));

  const existingByEnrollment = new Map((existingScoreData ?? []).map((row) => [row.enrollment_id, row.id]));

  const rowsToInsert: Array<{
    enrollment_id: string;
    subject_id: string;
    score_type: "daily";
    assessment_no: number;
    score: number;
    notes: string | null;
    input_by_teacher_id: string;
  }> = [];

  const rowsToUpdate: Array<{
    scoreId: string;
    score: number;
    notes: string | null;
  }> = [];

  for (const entry of finalEntries) {
    const payload = {
      score: entry.score as number,
      notes: entry.notes || null,
      input_by_teacher_id: context.teacher.id,
    };

    const existingId = existingByEnrollment.get(entry.enrollmentId);
    if (existingId) {
      rowsToUpdate.push({
        scoreId: existingId,
        score: payload.score,
        notes: payload.notes,
      });
      continue;
    }

    rowsToInsert.push({
      enrollment_id: entry.enrollmentId,
      subject_id: context.assignment.subject_id,
      score_type: "daily",
      assessment_no: taskData.assessment_no,
      score: payload.score,
      notes: payload.notes,
      input_by_teacher_id: context.teacher.id,
    });
  }

  for (const row of rowsToUpdate) {
      const { error: updateError } = await admin
        .from("scores")
        .update({
          score: row.score,
          remedial_score: null,
          notes: row.notes,
          input_by_teacher_id: context.teacher.id,
        })
        .eq("id", row.scoreId);

    if (updateError) {
      throw new Error(mapPostgresError(updateError.message ?? "Gagal update nilai harian."));
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await admin
      .from("scores")
      .insert(rowsToInsert.map((row) => ({ ...row, remedial_score: null })));
    if (insertError) {
      throw new Error(mapPostgresError(insertError.message));
    }
  }
}

export async function getDailyComponentScores(params: {
  academicPeriodId: string;
  classroomId?: string | null;
  subjectId?: string | null;
}): Promise<DailyComponentScore[]> {
  const admin = createAdminSupabaseClient();

  let enrollmentQuery = admin
    .from("enrollments")
    .select("id")
    .eq("academic_period_id", params.academicPeriodId);

  if (params.classroomId) {
    enrollmentQuery = enrollmentQuery.eq("classroom_id", params.classroomId);
  }

  const { data: enrollmentData, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollmentIds = (enrollmentData ?? []).map((row) => row.id as string);
  if (!enrollmentIds.length) return [];

  let scoreQuery = admin
    .from("scores")
    .select("enrollment_id, subject_id, score")
    .eq("score_type", "daily")
    .in("enrollment_id", enrollmentIds);

  if (params.subjectId) {
    scoreQuery = scoreQuery.eq("subject_id", params.subjectId);
  }

  const { data: scoreData, error: scoreError } = await scoreQuery;
  if (scoreError) throw new Error(mapPostgresError(scoreError.message));

  const aggregate = new Map<
    string,
    {
      enrollmentId: string;
      subjectId: string;
      total: number;
      count: number;
    }
  >();

  for (const row of (scoreData ?? []) as Array<{
    enrollment_id: string;
    subject_id: string;
    score: number;
  }>) {
    const key = `${row.enrollment_id}::${row.subject_id}`;
    const existing = aggregate.get(key) ?? {
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      total: 0,
      count: 0,
    };

    existing.total += toFinalScore(row.score);
    existing.count += 1;
    aggregate.set(key, existing);
  }

  return Array.from(aggregate.values()).map((item) => ({
    enrollmentId: item.enrollmentId,
    subjectId: item.subjectId,
    averageFinalScore: Number((item.total / item.count).toFixed(2)),
    scoredTaskCount: item.count,
  }));
}
