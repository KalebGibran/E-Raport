import "server-only";

import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getDashboardSession } from "@/lib/auth/dashboard";
import { DashboardRole } from "@/lib/auth/roles";
import { AttendanceStatus } from "@/lib/attendance/service";

type PeriodRow = {
  id: string;
  period_name: string;
  semester: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type StudentRow = {
  id: string;
  full_name: string;
  nis: string | null;
  nisn: string | null;
  profile_id: string | null;
};

type ClassroomRow = {
  id: string;
  classroom_name: string;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  academic_period_id: string;
  classrooms: { classroom_name: string }[] | { classroom_name: string } | null;
};

type AssignmentRow = {
  id: string;
  classroom_id: string;
  subject_id: string;
  academic_period_id: string;
};

type SubjectRow = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type ScoreRow = {
  enrollment_id: string;
  subject_id: string;
  score_type: "daily" | "uts" | "uas";
  assessment_no: number | null;
  score: number;
};

type AttendanceRow = {
  status: AttendanceStatus;
};

type ReportCardRow = {
  enrollment_id: string;
  status: string;
  homeroom_notes: string | null;
  approved_by_teacher_id: string | null;
  approved_at: string | null;
  published_at: string | null;
};

type TeacherRow = {
  full_name: string;
};

export type RecapPeriodOption = {
  id: string;
  label: string;
  isCurrent: boolean;
};

export type RecapClassroomOption = {
  id: string;
  label: string;
};

export type RecapStudentOption = {
  id: string;
  label: string;
};

export type RecapSubjectRow = {
  subjectId: string;
  subjectName: string;
  attendancePercent: number;
  dailyAverage: number | null;
  utsScore: number | null;
  uasScore: number | null;
  finalScore: number | null;
  predicate: string;
};

export type RecapReadinessRow = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentNis: string | null;
  classroomName: string;
  totalSubjects: number;
  attendanceReady: boolean;
  dailyReady: boolean;
  utsReady: boolean;
  uasReady: boolean;
  readinessPercent: number;
  readinessLabel: "Siap" | "Perlu dilengkapi" | "Belum siap";
  reportStatus: string | null;
  missingItems: string[];
};

export type RecapReadinessSummary = {
  totalStudents: number;
  readyStudents: number;
  notReadyStudents: number;
  avgReadinessPercent: number;
  missingAttendance: number;
  missingDaily: number;
  missingUts: number;
  missingUas: number;
};

export type RecapData = {
  role: DashboardRole;
  periodOptions: RecapPeriodOption[];
  classroomOptions: RecapClassroomOption[];
  studentOptions: RecapStudentOption[];
  selectedPeriodId: string | null;
  selectedClassroomId: string | null;
  selectedStudentId: string | null;
  selectedPeriodLabel: string | null;
  studentName: string | null;
  studentNis: string | null;
  studentClassroomName: string | null;
  cards: {
    averageScore: number;
    attendancePercent: number;
    classRank: number | null;
    classSize: number;
  };
  rows: RecapSubjectRow[];
  homeroomNote: string | null;
  homeroomTeacherName: string | null;
  reportStatus: string | null;
  reportPublishedAt: string | null;
  readinessSummary: RecapReadinessSummary | null;
  readinessRows: RecapReadinessRow[];
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function averageNullable(values: number[]) {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function averageZero(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function toPredicate(finalScore: number | null) {
  if (finalScore == null) return "-";
  if (finalScore >= 85) return "A";
  if (finalScore >= 75) return "B";
  if (finalScore >= 65) return "C";
  return "D";
}

function createEmptyReadinessSummary(): RecapReadinessSummary {
  return {
    totalStudents: 0,
    readyStudents: 0,
    notReadyStudents: 0,
    avgReadinessPercent: 0,
    missingAttendance: 0,
    missingDaily: 0,
    missingUts: 0,
    missingUas: 0,
  };
}

async function getPeriods() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("academic_periods")
    .select("id, period_name, semester, start_date, end_date, is_current")
    .order("start_date", { ascending: false });

  const rows = (data ?? []) as PeriodRow[];
  const options: RecapPeriodOption[] = rows.map((period) => ({
    id: period.id,
    label: `${period.period_name} (Semester ${period.semester})`,
    isCurrent: period.is_current,
  }));

  return { rows, options };
}

async function getDailyAttendanceSubjectId() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("subjects").select("id").eq("subject_code", "ATT_DAILY").limit(1);
  return ((data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
}

function buildSubjectRows(params: {
  subjects: SubjectRow[];
  scores: ScoreRow[];
  attendancePercent: number;
}) {
  const bySubject = new Map<
    string,
    {
      dailyScores: number[];
      utsScore: number | null;
      uasScore: number | null;
    }
  >();

  for (const subject of params.subjects) {
    bySubject.set(subject.id, {
      dailyScores: [],
      utsScore: null,
      uasScore: null,
    });
  }

  for (const score of params.scores) {
    if (!bySubject.has(score.subject_id)) {
      bySubject.set(score.subject_id, {
        dailyScores: [],
        utsScore: null,
        uasScore: null,
      });
    }

    const subjectEntry = bySubject.get(score.subject_id)!;
    if (score.score_type === "daily") {
      subjectEntry.dailyScores.push(score.score);
    }
    if (score.score_type === "uts") {
      subjectEntry.utsScore = score.score;
    }
    if (score.score_type === "uas") {
      subjectEntry.uasScore = score.score;
    }
  }

  return params.subjects
    .map((subject) => {
      const scoreEntry = bySubject.get(subject.id);
      const dailyAverage = averageNullable(scoreEntry?.dailyScores ?? []);
      const parts = [dailyAverage, scoreEntry?.utsScore, scoreEntry?.uasScore].filter(
        (value): value is number => value != null
      );
      const finalScore = averageNullable(parts);

      return {
        subjectId: subject.id,
        subjectName: subject.subject_name,
        attendancePercent: params.attendancePercent,
        dailyAverage,
        utsScore: scoreEntry?.utsScore ?? null,
        uasScore: scoreEntry?.uasScore ?? null,
        finalScore,
        predicate: toPredicate(finalScore),
      };
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

function computeRanking(params: { classScores: ScoreRow[]; enrollmentIds: string[]; selectedEnrollmentId: string }) {
  const byEnrollmentSubject = new Map<string, { dailyScores: number[]; uts: number | null; uas: number | null }>();

  for (const score of params.classScores) {
    const key = `${score.enrollment_id}::${score.subject_id}`;
    if (!byEnrollmentSubject.has(key)) {
      byEnrollmentSubject.set(key, { dailyScores: [], uts: null, uas: null });
    }
    const entry = byEnrollmentSubject.get(key)!;

    if (score.score_type === "daily") entry.dailyScores.push(score.score);
    if (score.score_type === "uts") entry.uts = score.score;
    if (score.score_type === "uas") entry.uas = score.score;
  }

  const byEnrollmentFinals = new Map<string, number[]>();

  for (const [key, subjectValues] of byEnrollmentSubject.entries()) {
    const enrollmentId = key.split("::")[0]!;
    const dailyAvg = averageNullable(subjectValues.dailyScores);
    const finalParts = [dailyAvg, subjectValues.uts, subjectValues.uas].filter(
      (value): value is number => value != null
    );
    const subjectFinal = averageNullable(finalParts);
    if (subjectFinal == null) continue;

    if (!byEnrollmentFinals.has(enrollmentId)) {
      byEnrollmentFinals.set(enrollmentId, []);
    }
    byEnrollmentFinals.get(enrollmentId)!.push(subjectFinal);
  }

  const ranked = params.enrollmentIds
    .map((enrollmentId) => ({
      enrollmentId,
      average: averageNullable(byEnrollmentFinals.get(enrollmentId) ?? []) ?? 0,
    }))
    .sort((a, b) => b.average - a.average);

  const rank = ranked.findIndex((item) => item.enrollmentId === params.selectedEnrollmentId);
  return rank >= 0 ? rank + 1 : null;
}

async function buildRecapForStudent(params: {
  student: StudentRow;
  periodId: string | null;
}): Promise<{
  selectedClassroomId: string | null;
  studentClassroomName: string | null;
  cards: RecapData["cards"];
  rows: RecapSubjectRow[];
  homeroomNote: string | null;
  homeroomTeacherName: string | null;
  reportStatus: string | null;
  reportPublishedAt: string | null;
}> {
  if (!params.periodId) {
    return {
      selectedClassroomId: null,
      studentClassroomName: null,
      cards: { averageScore: 0, attendancePercent: 0, classRank: null, classSize: 0 },
      rows: [],
      homeroomNote: null,
      homeroomTeacherName: null,
      reportStatus: null,
      reportPublishedAt: null,
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: enrollmentData } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, academic_period_id, classrooms(classroom_name)")
    .eq("student_id", params.student.id)
    .eq("academic_period_id", params.periodId)
    .limit(1);

  const enrollment = ((enrollmentData ?? []) as EnrollmentRow[])[0] ?? null;
  if (!enrollment) {
    return {
      selectedClassroomId: null,
      studentClassroomName: null,
      cards: { averageScore: 0, attendancePercent: 0, classRank: null, classSize: 0 },
      rows: [],
      homeroomNote: null,
      homeroomTeacherName: null,
      reportStatus: null,
      reportPublishedAt: null,
    };
  }

  const attendanceSubjectId = await getDailyAttendanceSubjectId();
  let attendancePercent = 0;

  if (attendanceSubjectId) {
    const { data: attendanceData } = await admin
      .from("attendance_records")
      .select("status")
      .eq("enrollment_id", enrollment.id)
      .eq("subject_id", attendanceSubjectId);

    const attendanceRows = (attendanceData ?? []) as AttendanceRow[];
    const totalAttendance = attendanceRows.length;
    const presentCount = attendanceRows.filter((row) => row.status === "present").length;
    attendancePercent =
      totalAttendance > 0 ? Number(((presentCount / totalAttendance) * 100).toFixed(1)) : 0;
  }

  const { data: assignmentData } = await admin
    .from("subject_teacher_assignments")
    .select("id, classroom_id, subject_id, academic_period_id")
    .eq("classroom_id", enrollment.classroom_id)
    .eq("academic_period_id", enrollment.academic_period_id);

  const assignments = (assignmentData ?? []) as AssignmentRow[];
  const subjectIds = [...new Set(assignments.map((assignment) => assignment.subject_id))];

  const { data: subjectData } = subjectIds.length
    ? await admin
        .from("subjects")
        .select("id, subject_name, subject_code")
        .in("id", subjectIds)
    : { data: [] as unknown[] };

  const subjects = (subjectData ?? []) as SubjectRow[];

  const { data: studentScoresData } = subjectIds.length
    ? await admin
        .from("scores")
        .select("enrollment_id, subject_id, score_type, assessment_no, score")
        .eq("enrollment_id", enrollment.id)
        .in("subject_id", subjectIds)
        .in("score_type", ["daily", "uts", "uas"])
    : { data: [] as unknown[] };

  const studentScores = (studentScoresData ?? []) as ScoreRow[];
  const rows = buildSubjectRows({
    subjects,
    scores: studentScores,
    attendancePercent,
  });

  const averageScore = averageZero(rows.map((row) => row.finalScore).filter((value): value is number => value != null));

  // Ranking in class.
  const { data: classEnrollmentData } = await admin
    .from("enrollments")
    .select("id")
    .eq("classroom_id", enrollment.classroom_id)
    .eq("academic_period_id", enrollment.academic_period_id);

  const classEnrollmentIds = ((classEnrollmentData ?? []) as Array<{ id: string }>).map((row) => row.id);
  const classSize = classEnrollmentIds.length;

  const { data: classScoresData } = classEnrollmentIds.length && subjectIds.length
    ? await admin
        .from("scores")
        .select("enrollment_id, subject_id, score_type, assessment_no, score")
        .in("enrollment_id", classEnrollmentIds)
        .in("subject_id", subjectIds)
        .in("score_type", ["daily", "uts", "uas"])
    : { data: [] as unknown[] };

  const classScores = (classScoresData ?? []) as ScoreRow[];
  const classRank = classSize > 0
    ? computeRanking({
        classScores,
        enrollmentIds: classEnrollmentIds,
        selectedEnrollmentId: enrollment.id,
      })
    : null;

  // Report card note/info.
  const { data: reportCardData } = await admin
    .from("report_cards")
    .select("status, homeroom_notes, approved_by_teacher_id, approved_at, published_at")
    .eq("enrollment_id", enrollment.id)
    .limit(1);

  const reportCard = ((reportCardData ?? []) as ReportCardRow[])[0] ?? null;
  let homeroomTeacherName: string | null = null;

  if (reportCard?.approved_by_teacher_id) {
    const { data: teacherData } = await admin
      .from("teachers")
      .select("full_name")
      .eq("id", reportCard.approved_by_teacher_id)
      .limit(1);
    homeroomTeacherName = ((teacherData ?? []) as TeacherRow[])[0]?.full_name ?? null;
  }

  return {
    selectedClassroomId: enrollment.classroom_id,
    studentClassroomName: pickRelation(enrollment.classrooms)?.classroom_name ?? null,
    cards: {
      averageScore,
      attendancePercent,
      classRank,
      classSize,
    },
    rows,
    homeroomNote: reportCard?.homeroom_notes ?? null,
    homeroomTeacherName,
    reportStatus: reportCard?.status ?? null,
    reportPublishedAt: reportCard?.published_at ?? null,
  };
}

async function buildAdminReadinessBoard(params: {
  periodId: string | null;
  classroomId: string | null;
}): Promise<{
  summary: RecapReadinessSummary;
  rows: RecapReadinessRow[];
}> {
  if (!params.periodId || !params.classroomId) {
    return {
      summary: createEmptyReadinessSummary(),
      rows: [],
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: enrollmentData } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, academic_period_id, students(id, full_name, nis), classrooms(classroom_name)")
    .eq("academic_period_id", params.periodId)
    .eq("classroom_id", params.classroomId);

  const enrollments = (enrollmentData ?? []) as Array<
    EnrollmentRow & {
      students: { id: string; full_name: string; nis: string | null }[] | { id: string; full_name: string; nis: string | null } | null;
    }
  >;

  if (!enrollments.length) {
    return {
      summary: createEmptyReadinessSummary(),
      rows: [],
    };
  }

  const { data: assignmentData } = await admin
    .from("subject_teacher_assignments")
    .select("subject_id")
    .eq("academic_period_id", params.periodId)
    .eq("classroom_id", params.classroomId);
  const subjectIds = [...new Set(((assignmentData ?? []) as Array<{ subject_id: string }>).map((row) => row.subject_id))];

  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const attendanceSubjectId = await getDailyAttendanceSubjectId();

  const [attendanceResult, scoreResult, reportCardResult] = await Promise.all([
    attendanceSubjectId
      ? admin
          .from("attendance_records")
          .select("enrollment_id")
          .in("enrollment_id", enrollmentIds)
          .eq("subject_id", attendanceSubjectId)
      : Promise.resolve({ data: [] as unknown[], error: null }),
    subjectIds.length
      ? admin
          .from("scores")
          .select("enrollment_id, subject_id, score_type, assessment_no, score")
          .in("enrollment_id", enrollmentIds)
          .in("subject_id", subjectIds)
          .in("score_type", ["daily", "uts", "uas"])
      : Promise.resolve({ data: [] as unknown[], error: null }),
    admin.from("report_cards").select("enrollment_id, status").in("enrollment_id", enrollmentIds),
  ]);

  const attendanceRows = (attendanceResult.data ?? []) as Array<{ enrollment_id: string }>;
  const attendanceByEnrollment = new Set(attendanceRows.map((row) => row.enrollment_id));

  const scoreRows = (scoreResult.data ?? []) as ScoreRow[];
  const scoreTypeMap = new Map<string, Set<ScoreRow["score_type"]>>();
  for (const score of scoreRows) {
    const key = `${score.enrollment_id}::${score.subject_id}`;
    if (!scoreTypeMap.has(key)) {
      scoreTypeMap.set(key, new Set());
    }
    scoreTypeMap.get(key)!.add(score.score_type);
  }

  const reportCardRows = (reportCardResult.data ?? []) as Pick<ReportCardRow, "enrollment_id" | "status">[];
  const reportStatusMap = new Map<string, string | null>();
  for (const reportCard of reportCardRows) {
    reportStatusMap.set(reportCard.enrollment_id, reportCard.status ?? null);
  }

  const rows: RecapReadinessRow[] = enrollments
    .map((enrollment) => {
      const student = pickRelation(enrollment.students);
      const classroom = pickRelation(enrollment.classrooms);
      const attendanceReady = attendanceByEnrollment.has(enrollment.id);
      const totalSubjects = subjectIds.length;

      const dailyReady =
        totalSubjects > 0 &&
        subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollment.id}::${subjectId}`)?.has("daily"));
      const utsReady =
        totalSubjects > 0 &&
        subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollment.id}::${subjectId}`)?.has("uts"));
      const uasReady =
        totalSubjects > 0 &&
        subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollment.id}::${subjectId}`)?.has("uas"));

      const checks = [attendanceReady, dailyReady, utsReady, uasReady];
      const readyCount = checks.filter(Boolean).length;
      const readinessPercent = Number(((readyCount / checks.length) * 100).toFixed(0));
      const missingItems: string[] = [];

      if (!attendanceReady) {
        missingItems.push("Absensi belum lengkap");
      }
      if (totalSubjects === 0) {
        missingItems.push("Assignment mapel belum tersedia");
      } else {
        if (!dailyReady) missingItems.push("Nilai harian belum lengkap");
        if (!utsReady) missingItems.push("Nilai UTS belum lengkap");
        if (!uasReady) missingItems.push("Nilai UAS belum lengkap");
      }

      let readinessLabel: RecapReadinessRow["readinessLabel"] = "Belum siap";
      if (readinessPercent === 100) {
        readinessLabel = "Siap";
      } else if (readinessPercent >= 50) {
        readinessLabel = "Perlu dilengkapi";
      }

      return {
        enrollmentId: enrollment.id,
        studentId: student?.id ?? enrollment.student_id,
        studentName: student?.full_name ?? "-",
        studentNis: student?.nis ?? null,
        classroomName: classroom?.classroom_name ?? "-",
        totalSubjects,
        attendanceReady,
        dailyReady,
        utsReady,
        uasReady,
        readinessPercent,
        readinessLabel,
        reportStatus: reportStatusMap.get(enrollment.id) ?? null,
        missingItems,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  const readyStudents = rows.filter((row) => row.readinessPercent === 100).length;
  const summary: RecapReadinessSummary = {
    totalStudents: rows.length,
    readyStudents,
    notReadyStudents: rows.length - readyStudents,
    avgReadinessPercent: averageZero(rows.map((row) => row.readinessPercent)),
    missingAttendance: rows.filter((row) => !row.attendanceReady).length,
    missingDaily: rows.filter((row) => !row.dailyReady).length,
    missingUts: rows.filter((row) => !row.utsReady).length,
    missingUas: rows.filter((row) => !row.uasReady).length,
  };

  return { summary, rows };
}

export async function getRecapData(params?: {
  periodId?: string | null;
  classroomId?: string | null;
  studentId?: string | null;
}): Promise<RecapData> {
  const session = await getDashboardSession();
  if (session.role !== "admin" && session.role !== "murid") {
    redirect("/unauthorized");
  }

  const { rows: periodRows, options: periodOptions } = await getPeriods();
  const selectedPeriod =
    periodRows.find((period) => period.id === params?.periodId) ??
    periodRows.find((period) => period.is_current) ??
    periodRows[0] ??
    null;

  const selectedPeriodId = selectedPeriod?.id ?? null;
  const selectedPeriodLabel = selectedPeriod
    ? `${selectedPeriod.period_name} (Semester ${selectedPeriod.semester})`
    : null;

  const admin = createAdminSupabaseClient();

  if (session.role === "murid") {
    const { data: studentData } = await admin
      .from("students")
      .select("id, full_name, nis, nisn, profile_id")
      .eq("profile_id", session.id)
      .limit(1);

    const student = ((studentData ?? []) as StudentRow[])[0] ?? null;
    if (!student) {
      return {
        role: session.role,
        periodOptions,
        classroomOptions: [],
        studentOptions: [],
        selectedPeriodId,
        selectedClassroomId: null,
        selectedStudentId: null,
        selectedPeriodLabel,
        studentName: null,
        studentNis: null,
        studentClassroomName: null,
        cards: { averageScore: 0, attendancePercent: 0, classRank: null, classSize: 0 },
        rows: [],
        homeroomNote: null,
        homeroomTeacherName: null,
        reportStatus: null,
        reportPublishedAt: null,
        readinessSummary: null,
        readinessRows: [],
      };
    }

    const recap = await buildRecapForStudent({
      student,
      periodId: selectedPeriodId,
    });

    return {
      role: session.role,
      periodOptions,
      classroomOptions: [],
      studentOptions: [],
      selectedPeriodId,
      selectedClassroomId: recap.selectedClassroomId,
      selectedStudentId: student.id,
      selectedPeriodLabel,
      studentName: student.full_name,
      studentNis: student.nis,
      studentClassroomName: recap.studentClassroomName,
      cards: recap.cards,
      rows: recap.rows,
      homeroomNote: recap.homeroomNote,
      homeroomTeacherName: recap.homeroomTeacherName,
      reportStatus: recap.reportStatus,
      reportPublishedAt: recap.reportPublishedAt,
      readinessSummary: null,
      readinessRows: [],
    };
  }

  const { data: classData } = selectedPeriodId
    ? await admin
        .from("enrollments")
        .select("classroom_id, classrooms(id, classroom_name)")
        .eq("academic_period_id", selectedPeriodId)
    : { data: [] as unknown[] };

  const classroomMap = new Map<string, RecapClassroomOption>();
  for (const row of (classData ?? []) as Array<{ classroom_id: string; classrooms: ClassroomRow[] | ClassroomRow | null }>) {
    const classroom = pickRelation(row.classrooms);
    if (!classroom) continue;
    classroomMap.set(row.classroom_id, {
      id: row.classroom_id,
      label: classroom.classroom_name,
    });
  }

  const classroomOptions = [...classroomMap.values()].sort((a, b) => a.label.localeCompare(b.label));
  const selectedClassroomId =
    params?.classroomId && classroomOptions.some((classroom) => classroom.id === params.classroomId)
      ? params.classroomId
      : classroomOptions[0]?.id ?? null;

  const { data: studentOptionData } = selectedPeriodId && selectedClassroomId
    ? await admin
        .from("enrollments")
        .select("student_id, students(id, full_name, nis)")
        .eq("academic_period_id", selectedPeriodId)
        .eq("classroom_id", selectedClassroomId)
    : { data: [] as unknown[] };

  const studentMap = new Map<string, RecapStudentOption>();
  for (const row of (studentOptionData ?? []) as Array<{ student_id: string; students: { id: string; full_name: string; nis: string | null }[] | { id: string; full_name: string; nis: string | null } | null }>) {
    const student = pickRelation(row.students);
    if (!student) continue;
    studentMap.set(row.student_id, {
      id: row.student_id,
      label: `${student.full_name}${student.nis ? ` (NIS ${student.nis})` : ""}`,
    });
  }

  const studentOptions = [...studentMap.values()].sort((a, b) => a.label.localeCompare(b.label));
  const selectedStudentId =
    params?.studentId && studentOptions.some((student) => student.id === params.studentId)
      ? params.studentId
      : studentOptions[0]?.id ?? null;

  const readiness = await buildAdminReadinessBoard({
    periodId: selectedPeriodId,
    classroomId: selectedClassroomId,
  });

  if (!selectedStudentId) {
    return {
      role: session.role,
      periodOptions,
      classroomOptions,
      studentOptions,
      selectedPeriodId,
      selectedClassroomId,
      selectedStudentId: null,
      selectedPeriodLabel,
      studentName: null,
      studentNis: null,
      studentClassroomName: null,
      cards: { averageScore: 0, attendancePercent: 0, classRank: null, classSize: 0 },
      rows: [],
      homeroomNote: null,
      homeroomTeacherName: null,
      reportStatus: null,
      reportPublishedAt: null,
      readinessSummary: readiness.summary,
      readinessRows: readiness.rows,
    };
  }

  const { data: studentData } = await admin
    .from("students")
    .select("id, full_name, nis, nisn, profile_id")
    .eq("id", selectedStudentId)
    .limit(1);

  const student = ((studentData ?? []) as StudentRow[])[0] ?? null;
  if (!student) {
    return {
      role: session.role,
      periodOptions,
      classroomOptions,
      studentOptions,
      selectedPeriodId,
      selectedClassroomId,
      selectedStudentId,
      selectedPeriodLabel,
      studentName: null,
      studentNis: null,
      studentClassroomName: null,
      cards: { averageScore: 0, attendancePercent: 0, classRank: null, classSize: 0 },
      rows: [],
      homeroomNote: null,
      homeroomTeacherName: null,
      reportStatus: null,
      reportPublishedAt: null,
      readinessSummary: readiness.summary,
      readinessRows: readiness.rows,
    };
  }

  const recap = await buildRecapForStudent({
    student,
    periodId: selectedPeriodId,
  });

  return {
    role: session.role,
    periodOptions,
    classroomOptions,
    studentOptions,
    selectedPeriodId,
    selectedClassroomId,
    selectedStudentId: student.id,
    selectedPeriodLabel,
    studentName: student.full_name,
    studentNis: student.nis,
    studentClassroomName: recap.studentClassroomName,
    cards: recap.cards,
    rows: recap.rows,
    homeroomNote: recap.homeroomNote,
    homeroomTeacherName: recap.homeroomTeacherName,
    reportStatus: recap.reportStatus,
    reportPublishedAt: recap.reportPublishedAt,
    readinessSummary: readiness.summary,
    readinessRows: readiness.rows,
  };
}
