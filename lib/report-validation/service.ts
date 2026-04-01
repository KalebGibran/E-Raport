import "server-only";

import { redirect } from "next/navigation";

import { getDashboardSession } from "@/lib/auth/dashboard";
import { mapPostgresError } from "@/lib/admin/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RelationValue<T> = T | T[] | null;

type TeacherRow = {
  id: string;
  full_name: string;
};

type HomeroomAssignmentRow = {
  id: string;
  teacher_id: string;
  classroom_id: string;
  academic_period_id: string;
  classrooms: RelationValue<{ classroom_name: string }>;
  academic_periods: RelationValue<{
    period_name: string;
    semester: number;
    start_date: string;
    is_current: boolean;
  }>;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  academic_period_id: string;
  students: RelationValue<{ full_name: string; nis: string | null }>;
};

type ScoreRow = {
  enrollment_id: string;
  subject_id: string;
  score_type: "daily" | "uts" | "uas";
};

type ReportCardRow = {
  id: string;
  enrollment_id: string;
  status: "draft" | "pending_approval" | "approved" | "published";
  homeroom_notes: string | null;
};

type ReadinessMapValue = {
  attendanceReady: boolean;
  dailyReady: boolean;
  utsReady: boolean;
  uasReady: boolean;
  readinessPercent: number;
  readinessLabel: "Siap" | "Perlu dilengkapi" | "Belum siap";
  missingItems: string[];
};

export type ValidationAssignmentOption = {
  id: string;
  classroomId: string;
  periodId: string;
  classroomName: string;
  periodName: string;
  semester: number;
  startDate: string;
  isCurrent: boolean;
  label: string;
};

export type ValidationStudentRow = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  nis: string | null;
  readinessPercent: number;
  readinessLabel: "Siap" | "Perlu dilengkapi" | "Belum siap";
  missingItems: string[];
  reportStatus: "draft" | "pending_approval" | "approved" | "published";
  homeroomNotes: string;
};

export type ReportValidationPageData = {
  teacherName: string | null;
  assignments: ValidationAssignmentOption[];
  selectedAssignmentId: string | null;
  selectedClassroomName: string | null;
  selectedPeriodLabel: string | null;
  rows: ValidationStudentRow[];
};

export type SaveReportValidationInput = {
  assignmentId: string;
  enrollmentId: string;
  status: "draft" | "pending_approval" | "approved";
  homeroomNotes: string | null;
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

async function getTeacherByProfile(profileId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("teachers").select("id, full_name").eq("profile_id", profileId).limit(1);
  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as TeacherRow[])[0] ?? null;
}

async function getDailyAttendanceSubjectId() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("subjects").select("id").eq("subject_code", "ATT_DAILY").limit(1);
  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
}

async function computeReadinessByEnrollment(params: {
  classroomId: string;
  periodId: string;
  enrollmentIds: string[];
}): Promise<Map<string, ReadinessMapValue>> {
  const admin = createAdminSupabaseClient();
  const subjectIdsResult = await admin
    .from("subject_teacher_assignments")
    .select("subject_id")
    .eq("classroom_id", params.classroomId)
    .eq("academic_period_id", params.periodId);

  if (subjectIdsResult.error) throw new Error(mapPostgresError(subjectIdsResult.error.message));
  const subjectIds = [...new Set((subjectIdsResult.data ?? []).map((row) => row.subject_id))];
  const attendanceSubjectId = await getDailyAttendanceSubjectId();

  const [attendanceResult, scoreResult] = await Promise.all([
    attendanceSubjectId
      ? admin
          .from("attendance_records")
          .select("enrollment_id")
          .in("enrollment_id", params.enrollmentIds)
          .eq("subject_id", attendanceSubjectId)
      : Promise.resolve({ data: [] as unknown[], error: null }),
    subjectIds.length
      ? admin
          .from("scores")
          .select("enrollment_id, subject_id, score_type")
          .in("enrollment_id", params.enrollmentIds)
          .in("subject_id", subjectIds)
          .in("score_type", ["daily", "uts", "uas"])
      : Promise.resolve({ data: [] as unknown[], error: null }),
  ]);

  if (attendanceResult.error) throw new Error(mapPostgresError(attendanceResult.error.message));
  if (scoreResult.error) throw new Error(mapPostgresError(scoreResult.error.message));

  const attendanceSet = new Set(((attendanceResult.data ?? []) as Array<{ enrollment_id: string }>).map((row) => row.enrollment_id));
  const scoreRows = (scoreResult.data ?? []) as ScoreRow[];
  const scoreTypeMap = new Map<string, Set<ScoreRow["score_type"]>>();
  for (const score of scoreRows) {
    const key = `${score.enrollment_id}::${score.subject_id}`;
    if (!scoreTypeMap.has(key)) {
      scoreTypeMap.set(key, new Set());
    }
    scoreTypeMap.get(key)!.add(score.score_type);
  }

  const readiness = new Map<string, ReadinessMapValue>();
  for (const enrollmentId of params.enrollmentIds) {
    const attendanceReady = attendanceSet.has(enrollmentId);
    const totalSubjects = subjectIds.length;
    const dailyReady =
      totalSubjects > 0 &&
      subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollmentId}::${subjectId}`)?.has("daily"));
    const utsReady =
      totalSubjects > 0 &&
      subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollmentId}::${subjectId}`)?.has("uts"));
    const uasReady =
      totalSubjects > 0 &&
      subjectIds.every((subjectId) => scoreTypeMap.get(`${enrollmentId}::${subjectId}`)?.has("uas"));
    const checks = [attendanceReady, dailyReady, utsReady, uasReady];
    const readinessPercent = Number(((checks.filter(Boolean).length / checks.length) * 100).toFixed(0));
    const missingItems: string[] = [];

    if (!attendanceReady) missingItems.push("Absensi");
    if (totalSubjects === 0) {
      missingItems.push("Assignment mapel");
    } else {
      if (!dailyReady) missingItems.push("Harian");
      if (!utsReady) missingItems.push("UTS");
      if (!uasReady) missingItems.push("UAS");
    }

    let readinessLabel: ValidationStudentRow["readinessLabel"] = "Belum siap";
    if (readinessPercent === 100) readinessLabel = "Siap";
    else if (readinessPercent >= 50) readinessLabel = "Perlu dilengkapi";

    readiness.set(enrollmentId, {
      attendanceReady,
      dailyReady,
      utsReady,
      uasReady,
      readinessPercent,
      readinessLabel,
      missingItems,
    });
  }

  return readiness;
}

async function getTeacherHomeroomAssignments(teacherId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("homeroom_assignments")
    .select("id, teacher_id, classroom_id, academic_period_id, classrooms(classroom_name), academic_periods(period_name, semester, start_date, is_current)")
    .eq("teacher_id", teacherId);

  if (error) throw new Error(mapPostgresError(error.message));

  return ((data ?? []) as HomeroomAssignmentRow[])
    .map((row) => {
      const classroom = pickRelation(row.classrooms);
      const period = pickRelation(row.academic_periods);
      return {
        id: row.id,
        classroomId: row.classroom_id,
        periodId: row.academic_period_id,
        classroomName: classroom?.classroom_name ?? "-",
        periodName: period?.period_name ?? "-",
        semester: period?.semester ?? 0,
        startDate: period?.start_date ?? "",
        isCurrent: period?.is_current ?? false,
        label: `${classroom?.classroom_name ?? "-"} - ${period?.period_name ?? "-"} (Semester ${period?.semester ?? "-"})`,
      };
    })
    .sort((a, b) => {
      if (a.startDate !== b.startDate) {
        return b.startDate.localeCompare(a.startDate);
      }

      return compareClassroomName(a.classroomName, b.classroomName);
    });
}

async function validateTeacherAssignmentOwnership(params: {
  teacherId: string;
  assignmentId: string;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("homeroom_assignments")
    .select("id, teacher_id, classroom_id, academic_period_id")
    .eq("id", params.assignmentId)
    .eq("teacher_id", params.teacherId)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as Array<{ id: string; teacher_id: string; classroom_id: string; academic_period_id: string }>)[0] ?? null;
}

export async function getReportValidationPageData(assignmentId?: string | null): Promise<ReportValidationPageData> {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    redirect("/unauthorized");
  }

  const teacher = await getTeacherByProfile(session.id);
  if (!teacher) {
    return {
      teacherName: null,
      assignments: [],
      selectedAssignmentId: null,
      selectedClassroomName: null,
      selectedPeriodLabel: null,
      rows: [],
    };
  }

  const assignments = await getTeacherHomeroomAssignments(teacher.id);
  const selectedAssignment =
    (assignmentId ? assignments.find((assignment) => assignment.id === assignmentId) : null) ??
    assignments.find((assignment) => assignment.isCurrent) ??
    assignments[0] ??
    null;

  if (!selectedAssignment) {
    return {
      teacherName: teacher.full_name,
      assignments,
      selectedAssignmentId: null,
      selectedClassroomName: null,
      selectedPeriodLabel: null,
      rows: [],
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, student_id, classroom_id, academic_period_id, students(full_name, nis)")
    .eq("classroom_id", selectedAssignment.classroomId)
    .eq("academic_period_id", selectedAssignment.periodId);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const enrollmentIds = enrollments.map((row) => row.id);

  const { data: reportCardsData, error: reportCardError } = enrollmentIds.length
    ? await admin
        .from("report_cards")
        .select("id, enrollment_id, status, homeroom_notes")
        .in("enrollment_id", enrollmentIds)
    : { data: [] as unknown[], error: null };

  if (reportCardError) throw new Error(mapPostgresError(reportCardError.message));
  const reportCards = (reportCardsData ?? []) as ReportCardRow[];
  const reportMap = new Map<string, ReportCardRow>();
  for (const reportCard of reportCards) {
    reportMap.set(reportCard.enrollment_id, reportCard);
  }

  const readinessByEnrollment =
    enrollmentIds.length > 0
      ? await computeReadinessByEnrollment({
          classroomId: selectedAssignment.classroomId,
          periodId: selectedAssignment.periodId,
          enrollmentIds,
        })
      : new Map<string, ReadinessMapValue>();

  const rows: ValidationStudentRow[] = enrollments
    .map((enrollment) => {
      const student = pickRelation(enrollment.students);
      const readiness = readinessByEnrollment.get(enrollment.id);
      const report = reportMap.get(enrollment.id);

      return {
        enrollmentId: enrollment.id,
        studentId: enrollment.student_id,
        studentName: student?.full_name ?? "-",
        nis: student?.nis ?? null,
        readinessPercent: readiness?.readinessPercent ?? 0,
        readinessLabel: readiness?.readinessLabel ?? "Belum siap",
        missingItems: readiness?.missingItems ?? ["Data belum lengkap"],
        reportStatus: report?.status ?? "draft",
        homeroomNotes: report?.homeroom_notes ?? "",
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  return {
    teacherName: teacher.full_name,
    assignments,
    selectedAssignmentId: selectedAssignment.id,
    selectedClassroomName: selectedAssignment.classroomName,
    selectedPeriodLabel: `${selectedAssignment.periodName} (Semester ${selectedAssignment.semester})`,
    rows,
  };
}

export async function saveReportValidation(input: SaveReportValidationInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Hanya guru yang dapat memvalidasi raport.");
  }

  const teacher = await getTeacherByProfile(session.id);
  if (!teacher) {
    throw new Error("Akun guru tidak terhubung dengan data teachers.");
  }

  const assignmentId = input.assignmentId.trim();
  const enrollmentId = input.enrollmentId.trim();
  const status = input.status;
  const homeroomNotes = input.homeroomNotes?.trim() || null;

  if (!assignmentId) throw new Error("Assignment wali kelas tidak valid.");
  if (!enrollmentId) throw new Error("Enrollment siswa tidak valid.");
  if (!["draft", "pending_approval", "approved"].includes(status)) {
    throw new Error("Status validasi tidak valid.");
  }

  const assignment = await validateTeacherAssignmentOwnership({
    teacherId: teacher.id,
    assignmentId,
  });
  if (!assignment) {
    throw new Error("Anda tidak memiliki akses ke assignment wali kelas ini.");
  }

  const admin = createAdminSupabaseClient();
  const { data: enrollmentData, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id, classroom_id, academic_period_id")
    .eq("id", enrollmentId)
    .limit(1);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));
  const enrollment = ((enrollmentData ?? []) as Array<{ id: string; classroom_id: string; academic_period_id: string }>)[0] ?? null;
  if (!enrollment) throw new Error("Data enrollment tidak ditemukan.");

  if (
    enrollment.classroom_id !== assignment.classroom_id ||
    enrollment.academic_period_id !== assignment.academic_period_id
  ) {
    throw new Error("Siswa tidak termasuk kelas/periode wali kelas ini.");
  }

  if (status === "approved") {
    const readiness = await computeReadinessByEnrollment({
      classroomId: assignment.classroom_id,
      periodId: assignment.academic_period_id,
      enrollmentIds: [enrollmentId],
    });
    const state = readiness.get(enrollmentId);
    if (!state || state.readinessPercent < 100) {
      throw new Error("Data siswa belum lengkap. Lengkapi absensi, harian, UTS, dan UAS sebelum approve.");
    }
  }

  const approvedByTeacherId = status === "approved" ? teacher.id : null;
  const approvedAt = status === "approved" ? new Date().toISOString() : null;

  const { error } = await admin.from("report_cards").upsert(
    {
      enrollment_id: enrollmentId,
      status,
      homeroom_notes: homeroomNotes,
      approved_by_teacher_id: approvedByTeacherId,
      approved_at: approvedAt,
      published_at: null,
    },
    {
      onConflict: "enrollment_id",
    }
  );

  if (error) {
    throw new Error(mapPostgresError(error.message));
  }
}
