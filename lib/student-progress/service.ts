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

type StudentRow = {
  id: string;
  full_name: string;
  nis: string | null;
  nisn: string | null;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  academic_period_id: string;
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
};

type AssignmentRow = {
  id: string;
  subject_id: string;
};

type DailyAssessmentRow = {
  assignment_id: string;
  assessment_no: number;
  task_date: string;
  title: string;
  description: string | null;
};

type AttendanceRow = {
  id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  updated_at: string;
  teachers: { full_name: string }[] | { full_name: string } | null;
};

export type StudentPeriodOption = {
  id: string;
  label: string;
  semester: number;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "closed";
  isCurrent: boolean;
};

export type StudentMonthOption = {
  value: string;
  label: string;
};

export type StudentSubjectOption = {
  id: string;
  label: string;
};

export type StudentSubjectScoreRow = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  dailyAverage: number | null;
  utsScore: number | null;
  uasScore: number | null;
  overallAverage: number | null;
};

export type StudentDailyTaskRow = {
  scoreId: string;
  date: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  taskLabel: string;
  taskTitle: string;
  score: number;
  notes: string;
};

export type StudentAttendanceHistoryRow = {
  id: string;
  date: string;
  status: AttendanceStatus;
  statusLabel: string;
  teacherName: string;
  notes: string;
  inputAt: string;
};

export type StudentOverviewData = {
  studentName: string;
  nis: string | null;
  nisn: string | null;
  periodOptions: StudentPeriodOption[];
  selectedPeriodId: string | null;
  selectedPeriodLabel: string | null;
  currentClassroomName: string | null;
  attendance: {
    present: number;
    sick: number;
    permission: number;
    absent: number;
    totalRecordedDays: number;
    attendanceRate: number;
  };
  scores: {
    averageDaily: number;
    averageExam: number;
    overallAverage: number;
    totalDailyTasks: number;
    totalExamEntries: number;
    bestSubject: string | null;
    lowestSubject: string | null;
  };
  subjectRows: StudentSubjectScoreRow[];
  recentDailyTasks: StudentDailyTaskRow[];
  recentAttendance: StudentAttendanceHistoryRow[];
};

export type StudentLearningPageData = {
  studentName: string;
  nis: string | null;
  periodOptions: StudentPeriodOption[];
  selectedPeriodId: string | null;
  selectedPeriodLabel: string | null;
  subjectOptions: StudentSubjectOption[];
  selectedSubjectId: string;
  currentClassroomName: string | null;
  subjectRows: StudentSubjectScoreRow[];
  dailyTaskRows: StudentDailyTaskRow[];
};

export type StudentAttendancePageData = {
  studentName: string;
  nis: string | null;
  periodOptions: StudentPeriodOption[];
  selectedPeriodId: string | null;
  selectedPeriodLabel: string | null;
  currentClassroomName: string | null;
  monthOptions: StudentMonthOption[];
  selectedMonth: string;
  summary: {
    present: number;
    sick: number;
    permission: number;
    absent: number;
    totalRecordedDays: number;
    attendanceRate: number;
  };
  rows: StudentAttendanceHistoryRow[];
};

type StudentContext = {
  student: StudentRow;
  periodOptions: StudentPeriodOption[];
  selectedPeriod: StudentPeriodOption | null;
};

type StudentLearningBundle = {
  subjectRows: StudentSubjectScoreRow[];
  dailyTaskRows: StudentDailyTaskRow[];
  summary: {
    averageDaily: number;
    averageExam: number;
    overallAverage: number;
    totalDailyTasks: number;
    totalExamEntries: number;
    bestSubject: string | null;
    lowestSubject: string | null;
  };
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function averageNullable(values: number[]) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function statusLabel(status: AttendanceStatus) {
  if (status === "present") return "Hadir";
  if (status === "sick") return "Sakit";
  if (status === "permission") return "Izin";
  return "Alpa";
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

function buildMonthOptions(startDate: string, endDate: string): StudentMonthOption[] {
  const options: StudentMonthOption[] = [];
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

async function getStudentContext(selectedPeriodId?: string | null): Promise<StudentContext> {
  const session = await getDashboardSession();
  if (session.role !== "murid") {
    redirect("/unauthorized");
  }

  const admin = createAdminSupabaseClient();
  const { data: studentData } = await admin
    .from("students")
    .select("id, full_name, nis, nisn")
    .eq("profile_id", session.id)
    .limit(1);

  const student = ((studentData ?? []) as StudentRow[])[0] ?? null;
  if (!student) {
    throw new Error("Akun murid belum terhubung ke data students.");
  }

  const { data: periodsData } = await admin
    .from("academic_periods")
    .select("id, period_name, semester, start_date, end_date, status, is_current")
    .order("start_date", { ascending: false });

  const periodOptions = ((periodsData ?? []) as PeriodRow[]).map((period) => ({
    id: period.id,
    label: `${period.period_name} (Semester ${period.semester})`,
    semester: period.semester,
    startDate: period.start_date,
    endDate: period.end_date,
    status: period.status,
    isCurrent: period.is_current,
  }));

  const selectedPeriod =
    periodOptions.find((period) => period.id === selectedPeriodId) ??
    periodOptions.find((period) => period.isCurrent) ??
    periodOptions[0] ??
    null;

  return {
    student,
    periodOptions,
    selectedPeriod,
  };
}

async function getEnrollment(studentId: string, periodId: string | null) {
  if (!periodId) return null;

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, academic_period_id, classrooms(classroom_name)")
    .eq("student_id", studentId)
    .eq("academic_period_id", periodId)
    .limit(1);

  return ((data ?? []) as EnrollmentRow[])[0] ?? null;
}

async function getLearningBundle(enrollment: EnrollmentRow | null): Promise<StudentLearningBundle> {
  if (!enrollment) {
    return {
      subjectRows: [],
      dailyTaskRows: [],
      summary: {
        averageDaily: 0,
        averageExam: 0,
        overallAverage: 0,
        totalDailyTasks: 0,
        totalExamEntries: 0,
        bestSubject: null,
        lowestSubject: null,
      },
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: scoresData } = await admin
    .from("scores")
    .select("id, enrollment_id, subject_id, score_type, assessment_no, score, notes, subjects(subject_name, subject_code)")
    .eq("enrollment_id", enrollment.id);

  const scoreRows = (scoresData ?? []) as ScoreRow[];
  if (!scoreRows.length) {
    return {
      subjectRows: [],
      dailyTaskRows: [],
      summary: {
        averageDaily: 0,
        averageExam: 0,
        overallAverage: 0,
        totalDailyTasks: 0,
        totalExamEntries: 0,
        bestSubject: null,
        lowestSubject: null,
      },
    };
  }

  const dailyRows = scoreRows.filter((row) => row.score_type === "daily" && row.assessment_no != null);
  const dailySubjectIds = [...new Set(dailyRows.map((row) => row.subject_id))];

  const assignmentBySubjectId = new Map<string, string>();
  if (dailySubjectIds.length > 0) {
    const { data: assignmentData } = await admin
      .from("subject_teacher_assignments")
      .select("id, subject_id")
      .eq("classroom_id", enrollment.classroom_id)
      .eq("academic_period_id", enrollment.academic_period_id)
      .in("subject_id", dailySubjectIds);

    for (const row of (assignmentData ?? []) as AssignmentRow[]) {
      if (!assignmentBySubjectId.has(row.subject_id)) {
        assignmentBySubjectId.set(row.subject_id, row.id);
      }
    }
  }

  const assignmentIds = [...new Set([...assignmentBySubjectId.values()])];
  const taskMetaByKey = new Map<string, DailyAssessmentRow>();

  if (assignmentIds.length > 0) {
    const { data: taskData } = await admin
      .from("daily_assessments")
      .select("assignment_id, assessment_no, task_date, title, description")
      .in("assignment_id", assignmentIds);

    for (const task of (taskData ?? []) as DailyAssessmentRow[]) {
      taskMetaByKey.set(`${task.assignment_id}::${task.assessment_no}`, task);
    }
  }

  const subjectAccumulator = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      dailyScores: number[];
      utsScore: number | null;
      uasScore: number | null;
    }
  >();

  const dailyTaskRows: StudentDailyTaskRow[] = [];

  for (const score of scoreRows) {
    const subject = pickRelation(score.subjects);
    const subjectId = score.subject_id;
    const subjectName = subject?.subject_name ?? "-";
    const subjectCode = subject?.subject_code ?? "-";

    if (!subjectAccumulator.has(subjectId)) {
      subjectAccumulator.set(subjectId, {
        subjectId,
        subjectName,
        subjectCode,
        dailyScores: [],
        utsScore: null,
        uasScore: null,
      });
    }

    const entry = subjectAccumulator.get(subjectId)!;

    if (score.score_type === "daily" && score.assessment_no != null) {
      entry.dailyScores.push(score.score);

      const assignmentId = assignmentBySubjectId.get(subjectId) ?? "";
      const taskMeta = taskMetaByKey.get(`${assignmentId}::${score.assessment_no}`) ?? null;
      const taskDate = taskMeta?.task_date ?? "";
      const taskTitle = taskMeta?.title ?? `Task #${score.assessment_no}`;

      dailyTaskRows.push({
        scoreId: score.id,
        date: taskDate,
        subjectId,
        subjectName,
        subjectCode,
        taskLabel: `T${score.assessment_no}`,
        taskTitle,
        score: score.score,
        notes: score.notes ?? "",
      });
    }

    if (score.score_type === "uts") {
      entry.utsScore = score.score;
    }

    if (score.score_type === "uas") {
      entry.uasScore = score.score;
    }
  }

  const subjectRows: StudentSubjectScoreRow[] = [...subjectAccumulator.values()]
    .map((entry) => {
      const dailyAverage = averageNullable(entry.dailyScores);
      const overallParts = [dailyAverage, entry.utsScore, entry.uasScore].filter(
        (value): value is number => value != null
      );

      return {
        subjectId: entry.subjectId,
        subjectName: entry.subjectName,
        subjectCode: entry.subjectCode,
        dailyAverage,
        utsScore: entry.utsScore,
        uasScore: entry.uasScore,
        overallAverage: averageNullable(overallParts),
      };
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  dailyTaskRows.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.subjectName !== b.subjectName) return a.subjectName.localeCompare(b.subjectName);
    return b.taskLabel.localeCompare(a.taskLabel);
  });

  const allDaily = dailyRows.map((row) => row.score);
  const allExam = scoreRows
    .filter((row) => row.score_type === "uts" || row.score_type === "uas")
    .map((row) => row.score);
  const allOverall = subjectRows
    .map((row) => row.overallAverage)
    .filter((value): value is number => value != null);

  const sortedByOverall = [...subjectRows]
    .filter((row) => row.overallAverage != null)
    .sort((a, b) => (b.overallAverage ?? 0) - (a.overallAverage ?? 0));

  return {
    subjectRows,
    dailyTaskRows,
    summary: {
      averageDaily: average(allDaily),
      averageExam: average(allExam),
      overallAverage: average(allOverall),
      totalDailyTasks: dailyRows.length,
      totalExamEntries: allExam.length,
      bestSubject: sortedByOverall[0]?.subjectName ?? null,
      lowestSubject: sortedByOverall[sortedByOverall.length - 1]?.subjectName ?? null,
    },
  };
}

async function getAttendanceRows(enrollment: EnrollmentRow | null): Promise<StudentAttendanceHistoryRow[]> {
  if (!enrollment) return [];

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("attendance_records")
    .select("id, attendance_date, status, notes, updated_at, teachers(full_name)")
    .eq("enrollment_id", enrollment.id)
    .order("attendance_date", { ascending: false });

  return ((data ?? []) as AttendanceRow[]).map((row) => ({
    id: row.id,
    date: row.attendance_date,
    status: row.status,
    statusLabel: statusLabel(row.status),
    teacherName: pickRelation(row.teachers)?.full_name ?? "-",
    notes: row.notes ?? "",
    inputAt: row.updated_at,
  }));
}

function summarizeAttendance(rows: StudentAttendanceHistoryRow[]) {
  const summary = {
    present: 0,
    sick: 0,
    permission: 0,
    absent: 0,
    totalRecordedDays: rows.length,
    attendanceRate: 0,
  };

  for (const row of rows) {
    if (row.status === "present") summary.present += 1;
    if (row.status === "sick") summary.sick += 1;
    if (row.status === "permission") summary.permission += 1;
    if (row.status === "absent") summary.absent += 1;
  }

  summary.attendanceRate =
    summary.totalRecordedDays > 0
      ? Number(((summary.present / summary.totalRecordedDays) * 100).toFixed(1))
      : 0;

  return summary;
}

export async function getStudentOverviewData(params?: { periodId?: string | null }): Promise<StudentOverviewData> {
  const context = await getStudentContext(params?.periodId);
  const enrollment = await getEnrollment(context.student.id, context.selectedPeriod?.id ?? null);
  const classroomName = pickRelation(enrollment?.classrooms ?? null)?.classroom_name ?? null;

  const [learning, attendanceRows] = await Promise.all([
    getLearningBundle(enrollment),
    getAttendanceRows(enrollment),
  ]);

  const attendanceSummary = summarizeAttendance(attendanceRows);

  return {
    studentName: context.student.full_name,
    nis: context.student.nis,
    nisn: context.student.nisn,
    periodOptions: context.periodOptions,
    selectedPeriodId: context.selectedPeriod?.id ?? null,
    selectedPeriodLabel: context.selectedPeriod?.label ?? null,
    currentClassroomName: classroomName,
    attendance: attendanceSummary,
    scores: learning.summary,
    subjectRows: learning.subjectRows,
    recentDailyTasks: learning.dailyTaskRows.slice(0, 8),
    recentAttendance: attendanceRows.slice(0, 8),
  };
}

export async function getStudentLearningPageData(params?: {
  periodId?: string | null;
  subjectId?: string | null;
}): Promise<StudentLearningPageData> {
  const context = await getStudentContext(params?.periodId);
  const enrollment = await getEnrollment(context.student.id, context.selectedPeriod?.id ?? null);
  const classroomName = pickRelation(enrollment?.classrooms ?? null)?.classroom_name ?? null;
  const learning = await getLearningBundle(enrollment);

  const subjectOptions = learning.subjectRows.map((subject) => ({
    id: subject.subjectId,
    label: `${subject.subjectName} (${subject.subjectCode})`,
  }));

  const selectedSubjectId =
    params?.subjectId && subjectOptions.some((subject) => subject.id === params.subjectId)
      ? params.subjectId
      : "";

  const subjectRows = selectedSubjectId
    ? learning.subjectRows.filter((subject) => subject.subjectId === selectedSubjectId)
    : learning.subjectRows;

  const dailyTaskRows = selectedSubjectId
    ? learning.dailyTaskRows.filter((task) => task.subjectId === selectedSubjectId)
    : learning.dailyTaskRows;

  return {
    studentName: context.student.full_name,
    nis: context.student.nis,
    periodOptions: context.periodOptions,
    selectedPeriodId: context.selectedPeriod?.id ?? null,
    selectedPeriodLabel: context.selectedPeriod?.label ?? null,
    subjectOptions,
    selectedSubjectId,
    currentClassroomName: classroomName,
    subjectRows,
    dailyTaskRows,
  };
}

export async function getStudentAttendancePageData(params?: {
  periodId?: string | null;
  month?: string | null;
}): Promise<StudentAttendancePageData> {
  const context = await getStudentContext(params?.periodId);
  const enrollment = await getEnrollment(context.student.id, context.selectedPeriod?.id ?? null);
  const classroomName = pickRelation(enrollment?.classrooms ?? null)?.classroom_name ?? null;
  const allRows = await getAttendanceRows(enrollment);

  const monthOptions = context.selectedPeriod
    ? buildMonthOptions(context.selectedPeriod.startDate, context.selectedPeriod.endDate)
    : [];

  const selectedMonth =
    params?.month && monthOptions.some((month) => month.value === params.month)
      ? params.month
      : monthOptions[0]?.value ?? "";

  const rows = selectedMonth
    ? allRows.filter((row) => row.date >= startOfMonth(selectedMonth) && row.date <= endOfMonth(selectedMonth))
    : allRows;

  return {
    studentName: context.student.full_name,
    nis: context.student.nis,
    periodOptions: context.periodOptions,
    selectedPeriodId: context.selectedPeriod?.id ?? null,
    selectedPeriodLabel: context.selectedPeriod?.label ?? null,
    currentClassroomName: classroomName,
    monthOptions,
    selectedMonth,
    summary: summarizeAttendance(rows),
    rows,
  };
}
