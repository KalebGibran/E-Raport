import "server-only";

import { redirect } from "next/navigation";

import { getDashboardSession } from "@/lib/auth/dashboard";
import { DashboardRole } from "@/lib/auth/roles";
import { mapPostgresError } from "@/lib/admin/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ExamScoreType = "uts" | "uas";

type CurrentPeriodRow = {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  semester: number;
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

type PeriodOptionRow = {
  id: string;
  period_name: string;
  semester: number;
  start_date: string;
  is_current: boolean;
};

type ClassroomOptionRow = {
  id: string;
  classroom_name: string;
};

type SubjectOptionRow = {
  id: string;
  subject_name: string;
  subject_code: string;
};

export type ScorePeriod = {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  semester: number;
};

export type ScoreAssignmentOption = {
  id: string;
  classroomId: string;
  subjectId: string;
  periodId: string;
  classroomName: string;
  subjectName: string;
  subjectCode: string;
  label: string;
};

export type GuruScoreClassroomOption = {
  id: string;
  label: string;
};

export type GuruScoreSubjectOption = {
  id: string;
  label: string;
};

export type GuruScoreStudentRow = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  nis: string | null;
  originalScore: number | null;
  notes: string;
};

export type AdminScorePeriodOption = {
  id: string;
  label: string;
  isCurrent: boolean;
};

export type AdminScoreClassroomOption = {
  id: string;
  label: string;
};

export type AdminScoreSubjectOption = {
  id: string;
  label: string;
};

export type AdminScoreMonitorRow = {
  scoreId: string;
  enrollmentId: string;
  studentName: string;
  nis: string | null;
  classroomName: string;
  subjectName: string;
  scoreType: ExamScoreType;
  originalScore: number;
};

export type AdminScoreStats = {
  averageScore: number;
  totalScoredStudents: number;
  highestScore: number;
};

export type AdminTopScoreRow = {
  studentName: string;
  classroomName: string;
  subjectName: string;
  score: number;
};

export type ScorePageData = {
  role: DashboardRole;
  currentPeriod: ScorePeriod | null;
  selectedScoreType: ExamScoreType;
  guru: {
    assignments: ScoreAssignmentOption[];
    classroomOptions: GuruScoreClassroomOption[];
    subjectOptions: GuruScoreSubjectOption[];
    selectedClassroomId: string | null;
    selectedSubjectId: string | null;
    selectedAssignmentId: string | null;
    selectedAssignment: ScoreAssignmentOption | null;
    students: GuruScoreStudentRow[];
  } | null;
  admin: {
    periodOptions: AdminScorePeriodOption[];
    classroomOptions: AdminScoreClassroomOption[];
    subjectOptions: AdminScoreSubjectOption[];
    selectedPeriodId: string | null;
    selectedClassroomId: string;
    selectedSubjectId: string;
    rows: AdminScoreMonitorRow[];
    stats: AdminScoreStats;
    topScores: AdminTopScoreRow[];
  } | null;
};

export type ScoreEntryInput = {
  enrollmentId: string;
  score: number | null;
  notes?: string | null;
};

export type SubmitExamScoresInput = {
  assignmentId: string;
  scoreType: ExamScoreType;
  entries: ScoreEntryInput[];
};

function pickRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function parseScoreType(value?: string | null): ExamScoreType {
  return value === "uas" ? "uas" : "uts";
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

function validateScoreValue(value: number | null, fieldLabel: string) {
  if (value == null) return;
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldLabel} tidak valid.`);
  }
  if (value < 0 || value > 100) {
    throw new Error(`${fieldLabel} harus di antara 0 sampai 100.`);
  }
}

function emptyAdminStats(): AdminScoreStats {
  return {
    averageScore: 0,
    totalScoredStudents: 0,
    highestScore: 0,
  };
}

async function getCurrentPeriod() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("academic_periods")
    .select("id, period_name, start_date, end_date, semester")
    .eq("is_current", true)
    .limit(1);

  if (error) throw new Error(mapPostgresError(error.message));
  return ((data ?? []) as CurrentPeriodRow[])[0] ?? null;
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

async function getTeacherAssignments(teacherId: string, periodId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("subject_teacher_assignments")
    .select("id, teacher_id, subject_id, classroom_id, academic_period_id, classrooms(classroom_name), subjects(subject_name, subject_code)")
    .eq("teacher_id", teacherId)
    .eq("academic_period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(mapPostgresError(error.message));

  return ((data ?? []) as AssignmentRow[])
    .map((row) => {
      const classroom = pickRelation(row.classrooms);
      const subject = pickRelation(row.subjects);

      return {
        id: row.id,
        classroomId: row.classroom_id,
        subjectId: row.subject_id,
        periodId: row.academic_period_id,
        classroomName: classroom?.classroom_name ?? "-",
        subjectName: subject?.subject_name ?? "-",
        subjectCode: subject?.subject_code ?? "-",
        label: `${classroom?.classroom_name ?? "-"} - ${subject?.subject_name ?? "-"}`,
      };
    })
    .sort((a, b) => {
      const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
      if (classroomOrder !== 0) {
        return classroomOrder;
      }

      return a.subjectName.localeCompare(b.subjectName);
    });
}

async function getGuruStudentsByAssignment(params: {
  assignment: ScoreAssignmentOption;
  scoreType: ExamScoreType;
}): Promise<GuruScoreStudentRow[]> {
  const { assignment, scoreType } = params;
  const admin = createAdminSupabaseClient();

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
    .eq("score_type", scoreType)
    .is("assessment_no", null)
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
      notes: score?.notes ?? "",
    };
  });
}

async function getAdminMonitorData(params: {
  currentPeriodId: string | null;
  selectedPeriodId?: string | null;
  selectedClassroomId?: string | null;
  selectedSubjectId?: string | null;
  scoreType: ExamScoreType;
}) {
  const admin = createAdminSupabaseClient();

  const [periodResult, classroomResult, subjectResult] = await Promise.all([
    admin
      .from("academic_periods")
      .select("id, period_name, semester, start_date, is_current")
      .order("start_date", { ascending: false }),
    admin.from("classrooms").select("id, classroom_name").order("classroom_name", { ascending: true }),
    admin
      .from("subjects")
      .select("id, subject_name, subject_code")
      .eq("is_active", true)
      .order("subject_name", { ascending: true }),
  ]);

  if (periodResult.error) throw new Error(mapPostgresError(periodResult.error.message));
  if (classroomResult.error) throw new Error(mapPostgresError(classroomResult.error.message));
  if (subjectResult.error) throw new Error(mapPostgresError(subjectResult.error.message));

  const periodRows = (periodResult.data ?? []) as PeriodOptionRow[];
  const classroomRows = (classroomResult.data ?? []) as ClassroomOptionRow[];
  const subjectRows = (subjectResult.data ?? []) as SubjectOptionRow[];

  const periodOptions: AdminScorePeriodOption[] = periodRows.map((row) => ({
    id: row.id,
    label: `${row.period_name} (Semester ${row.semester})`,
    isCurrent: row.is_current,
  }));

  const classroomOptions: AdminScoreClassroomOption[] = classroomRows.map((row) => ({
    id: row.id,
    label: row.classroom_name,
  }));

  const subjectOptions: AdminScoreSubjectOption[] = subjectRows.map((row) => ({
    id: row.id,
    label: `${row.subject_name} (${row.subject_code})`,
  }));

  const selectedPeriodId =
    params.selectedPeriodId && periodOptions.some((option) => option.id === params.selectedPeriodId)
      ? params.selectedPeriodId
      : params.currentPeriodId ?? periodOptions[0]?.id ?? null;

  const selectedClassroomId =
    params.selectedClassroomId && classroomOptions.some((option) => option.id === params.selectedClassroomId)
      ? params.selectedClassroomId
      : "";

  const selectedSubjectId =
    params.selectedSubjectId && subjectOptions.some((option) => option.id === params.selectedSubjectId)
      ? params.selectedSubjectId
      : "";

  if (!selectedPeriodId) {
    return {
      periodOptions,
      classroomOptions,
      subjectOptions,
      selectedPeriodId,
      selectedClassroomId,
      selectedSubjectId,
      rows: [] as AdminScoreMonitorRow[],
      stats: emptyAdminStats(),
      topScores: [] as AdminTopScoreRow[],
    };
  }

  let enrollmentQuery = admin
    .from("enrollments")
    .select("id, student_id, classroom_id, students(full_name, nis), classrooms(classroom_name)")
    .eq("academic_period_id", selectedPeriodId);

  if (selectedClassroomId) {
    enrollmentQuery = enrollmentQuery.eq("classroom_id", selectedClassroomId);
  }

  const { data: enrollmentData, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  if (!enrollments.length) {
    return {
      periodOptions,
      classroomOptions,
      subjectOptions,
      selectedPeriodId,
      selectedClassroomId,
      selectedSubjectId,
      rows: [] as AdminScoreMonitorRow[],
      stats: emptyAdminStats(),
      topScores: [] as AdminTopScoreRow[],
    };
  }

  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]));
  const enrollmentIds = enrollments.map((row) => row.id);

  let scoreQuery = admin
    .from("scores")
    .select("id, enrollment_id, subject_id, score_type, assessment_no, score, notes, subjects(subject_name, subject_code)")
    .eq("score_type", params.scoreType)
    .is("assessment_no", null)
    .in("enrollment_id", enrollmentIds);

  if (selectedSubjectId) {
    scoreQuery = scoreQuery.eq("subject_id", selectedSubjectId);
  }

  const { data: scoreData, error: scoreError } = await scoreQuery;
  if (scoreError) throw new Error(mapPostgresError(scoreError.message));

  const rows: AdminScoreMonitorRow[] = ((scoreData ?? []) as ScoreRow[])
    .map((score) => {
      const enrollment = enrollmentById.get(score.enrollment_id);
      if (!enrollment) return null;

      const student = pickRelation(enrollment.students);
      const classroom = pickRelation(enrollment.classrooms);
      const subject = pickRelation(score.subjects);

      return {
        scoreId: score.id,
        enrollmentId: score.enrollment_id,
        studentName: student?.full_name ?? "-",
        nis: student?.nis ?? null,
        classroomName: classroom?.classroom_name ?? "-",
        subjectName: subject?.subject_name ?? "-",
        scoreType: params.scoreType,
        originalScore: score.score,
      };
    })
    .filter((value): value is AdminScoreMonitorRow => value != null)
    .sort((a, b) => b.originalScore - a.originalScore);

  const stats: AdminScoreStats = rows.length
    ? {
        averageScore: Number((rows.reduce((sum, row) => sum + row.originalScore, 0) / rows.length).toFixed(1)),
        totalScoredStudents: rows.length,
        highestScore: rows[0]?.originalScore ?? 0,
      }
    : emptyAdminStats();

  const topScores: AdminTopScoreRow[] = rows.slice(0, 5).map((row) => ({
    studentName: row.studentName,
    classroomName: row.classroomName,
    subjectName: row.subjectName,
    score: row.originalScore,
  }));

  return {
    periodOptions,
    classroomOptions,
    subjectOptions,
    selectedPeriodId,
    selectedClassroomId,
    selectedSubjectId,
    rows,
    stats,
    topScores,
  };
}

export async function getScorePageData(params: {
  assignmentId?: string | null;
  scoreType?: string | null;
  periodId?: string | null;
  classroomId?: string | null;
  subjectId?: string | null;
}): Promise<ScorePageData> {
  const session = await getDashboardSession();
  if (session.role === "murid") {
    redirect("/unauthorized");
  }

  const scoreType = parseScoreType(params.scoreType);
  const currentPeriod = await getCurrentPeriod();

  if (session.role === "guru") {
    const teacher = await getTeacherByProfile(session.id);
    if (!teacher) {
      throw new Error("Akun guru tidak terhubung dengan data teachers.");
    }

    const assignments = currentPeriod ? await getTeacherAssignments(teacher.id, currentPeriod.id) : [];
    const assignmentFromId = assignments.find((item) => item.id === params.assignmentId) ?? null;

    const classroomOptions: GuruScoreClassroomOption[] = Array.from(
      assignments.reduce((accumulator, assignment) => {
        if (!accumulator.has(assignment.classroomId)) {
          accumulator.set(assignment.classroomId, {
            id: assignment.classroomId,
            label: assignment.classroomName,
          });
        }
        return accumulator;
      }, new Map<string, GuruScoreClassroomOption>())
    ).map(([, value]) => value);

    const selectedClassroomId =
      (params.classroomId && classroomOptions.some((option) => option.id === params.classroomId)
        ? params.classroomId
        : null) ??
      assignmentFromId?.classroomId ??
      classroomOptions[0]?.id ??
      null;

    const subjectOptions: GuruScoreSubjectOption[] = Array.from(
      assignments.reduce((accumulator, assignment) => {
        if (assignment.classroomId !== selectedClassroomId) return accumulator;
        if (!accumulator.has(assignment.subjectId)) {
          accumulator.set(assignment.subjectId, {
            id: assignment.subjectId,
            label: `${assignment.subjectName} (${assignment.subjectCode})`,
          });
        }
        return accumulator;
      }, new Map<string, GuruScoreSubjectOption>())
    )
      .map(([, value]) => value)
      .sort((a, b) => a.label.localeCompare(b.label));

    const selectedSubjectId =
      (params.subjectId && subjectOptions.some((option) => option.id === params.subjectId)
        ? params.subjectId
        : null) ??
      (assignmentFromId?.classroomId === selectedClassroomId ? assignmentFromId.subjectId : null) ??
      subjectOptions[0]?.id ??
      null;

    const selectedAssignment =
      assignments.find(
        (item) =>
          item.classroomId === selectedClassroomId && item.subjectId === selectedSubjectId
      ) ??
      assignmentFromId ??
      assignments[0] ??
      null;

    const students = selectedAssignment
      ? await getGuruStudentsByAssignment({
          assignment: selectedAssignment,
          scoreType,
        })
      : [];

    return {
      role: session.role,
      selectedScoreType: scoreType,
      currentPeriod: currentPeriod
        ? {
            id: currentPeriod.id,
            periodName: currentPeriod.period_name,
            startDate: currentPeriod.start_date,
            endDate: currentPeriod.end_date,
            semester: currentPeriod.semester,
          }
        : null,
      guru: {
        assignments,
        classroomOptions,
        subjectOptions,
        selectedClassroomId,
        selectedSubjectId,
        selectedAssignmentId: selectedAssignment?.id ?? null,
        selectedAssignment,
        students,
      },
      admin: null,
    };
  }

  const admin = await getAdminMonitorData({
    currentPeriodId: currentPeriod?.id ?? null,
    selectedPeriodId: params.periodId,
    selectedClassroomId: params.classroomId,
    selectedSubjectId: params.subjectId,
    scoreType,
  });

  return {
    role: session.role,
    selectedScoreType: scoreType,
    currentPeriod: currentPeriod
      ? {
          id: currentPeriod.id,
          periodName: currentPeriod.period_name,
          startDate: currentPeriod.start_date,
          endDate: currentPeriod.end_date,
          semester: currentPeriod.semester,
        }
      : null,
    guru: null,
    admin,
  };
}

export async function submitExamScores(input: SubmitExamScoresInput) {
  const session = await getDashboardSession();
  if (session.role !== "guru") {
    throw new Error("Saat ini hanya role guru yang dapat menginput nilai UTS/UAS.");
  }

  const assignmentId = input.assignmentId.trim();
  if (!assignmentId) {
    throw new Error("Assignment wajib dipilih.");
  }

  const scoreType = input.scoreType;
  if (scoreType !== "uts" && scoreType !== "uas") {
    throw new Error("Tipe nilai tidak valid.");
  }

  const currentPeriod = await getCurrentPeriod();
  if (!currentPeriod) {
    throw new Error("Belum ada periode current.");
  }

  const teacher = await getTeacherByProfile(session.id);
  if (!teacher) {
    throw new Error("Akun guru tidak terhubung dengan data teachers.");
  }

  const admin = createAdminSupabaseClient();
  const { data: assignmentData, error: assignmentError } = await admin
    .from("subject_teacher_assignments")
    .select("id, teacher_id, subject_id, classroom_id, academic_period_id")
    .eq("id", assignmentId)
    .single<AssignmentRow>();

  if (assignmentError || !assignmentData) {
    throw new Error("Assignment guru-mapel tidak ditemukan.");
  }

  if (assignmentData.teacher_id !== teacher.id) {
    throw new Error("Kamu tidak memiliki akses untuk assignment ini.");
  }

  if (assignmentData.academic_period_id !== currentPeriod.id) {
    throw new Error("Guru hanya boleh input nilai pada periode current.");
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
    .eq("classroom_id", assignmentData.classroom_id)
    .eq("academic_period_id", currentPeriod.id)
    .in("id", enrollmentIds);

  if (enrollmentError) throw new Error(mapPostgresError(enrollmentError.message));

  const validEnrollmentIds = new Set((enrollmentData ?? []).map((row) => row.id));
  if (validEnrollmentIds.size !== enrollmentIds.length) {
    throw new Error("Sebagian siswa tidak valid untuk assignment dan periode current.");
  }

  const { data: existingScoreData, error: existingScoreError } = await admin
    .from("scores")
    .select("id, enrollment_id")
    .eq("subject_id", assignmentData.subject_id)
    .eq("score_type", scoreType)
    .is("assessment_no", null)
    .in("enrollment_id", enrollmentIds);

  if (existingScoreError) throw new Error(mapPostgresError(existingScoreError.message));

  const existingByEnrollment = new Map((existingScoreData ?? []).map((row) => [row.enrollment_id, row.id]));

  const rowsToInsert: Array<{
    enrollment_id: string;
    subject_id: string;
    score_type: ExamScoreType;
    assessment_no: null;
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
      input_by_teacher_id: teacher.id,
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
      subject_id: assignmentData.subject_id,
      score_type: scoreType,
      assessment_no: null,
      score: payload.score,
      notes: payload.notes,
      input_by_teacher_id: teacher.id,
    });
  }

  if (rowsToUpdate.length > 0) {
    for (const row of rowsToUpdate) {
      const { error: updateError } = await admin
        .from("scores")
        .update({
          score: row.score,
          remedial_score: null,
          notes: row.notes,
          input_by_teacher_id: teacher.id,
        })
        .eq("id", row.scoreId);

      if (updateError) {
        throw new Error(mapPostgresError(updateError.message ?? "Gagal update nilai."));
      }
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
