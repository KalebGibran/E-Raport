import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DashboardRole } from "@/lib/auth/roles";
import { DashboardUser, getDashboardSession } from "@/lib/auth/dashboard";

type StudentRow = {
  id: string;
  profile_id: string | null;
  nisn: string | null;
  full_name: string;
  gender: "male" | "female" | null;
};

type ClassroomRow = {
  classroom_name: string;
};

type EnrollmentRow = {
  student_id: string;
  classroom_id: string;
  classrooms: ClassroomRow | ClassroomRow[] | null;
};

type TeacherRow = {
  id: string;
};

type AssignmentRow = {
  classroom_id: string;
  academic_period_id: string;
};

type CurrentPeriodRow = {
  id: string;
};

export type DashboardStudentRow = {
  id: string;
  nisn: string;
  fullName: string;
  classroomName: string;
  genderLabel: string;
  initials: string;
  accentClassName: string;
};

export type DashboardStudentStats = {
  total: number;
  male: number;
  female: number;
};

export type DashboardOverview = {
  user: DashboardUser;
  stats: DashboardStudentStats;
  students: DashboardStudentRow[];
};

function getInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getAccentClassName(gender: StudentRow["gender"]) {
  return gender === "female"
    ? "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300"
    : "bg-[#1e3b8a]/10 text-[#1e3b8a]";
}

function toGenderLabel(gender: StudentRow["gender"]) {
  if (gender === "female") return "Perempuan";
  if (gender === "male") return "Laki-laki";
  return "-";
}

function asSingleClassroom(classrooms: EnrollmentRow["classrooms"]) {
  if (Array.isArray(classrooms)) {
    return classrooms[0] ?? null;
  }

  return classrooms;
}

function buildStudentRows(students: StudentRow[], classroomByStudentId: Map<string, string>) {
  return students.map((student) => ({
    id: student.id,
    nisn: student.nisn ?? "-",
    fullName: student.full_name,
    classroomName: classroomByStudentId.get(student.id) ?? "-",
    genderLabel: toGenderLabel(student.gender),
    initials: getInitials(student.full_name),
    accentClassName: getAccentClassName(student.gender),
  }));
}

function buildStats(students: StudentRow[]): DashboardStudentStats {
  return students.reduce(
    (summary, student) => {
      summary.total += 1;

      if (student.gender === "male") summary.male += 1;
      if (student.gender === "female") summary.female += 1;

      return summary;
    },
    { total: 0, male: 0, female: 0 }
  );
}

async function getCurrentPeriodId() {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("academic_periods")
    .select("id")
    .eq("is_current", true)
    .limit(1);

  return (data as CurrentPeriodRow[] | null)?.[0]?.id ?? null;
}

async function getClassroomMap(studentIds: string[], periodId: string | null) {
  if (!studentIds.length || !periodId) {
    return new Map<string, string>();
  }

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("enrollments")
    .select("student_id, classroom_id, classrooms(classroom_name)")
    .eq("academic_period_id", periodId)
    .in("student_id", studentIds);

  return new Map(
    (data ?? []).map((enrollment) => [
      enrollment.student_id,
      asSingleClassroom(enrollment.classrooms)?.classroom_name ?? "-",
    ])
  );
}

async function getAdminStudents(periodId: string | null) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("students")
    .select("id, profile_id, nisn, full_name, gender")
    .order("full_name", { ascending: true })
    .limit(8);

  const students = (data ?? []) as StudentRow[];
  const classroomByStudentId = await getClassroomMap(
    students.map((student) => student.id),
    periodId
  );

  return {
    stats: await getAdminStudentStats(),
    students: buildStudentRows(students, classroomByStudentId),
  };
}

async function getAdminStudentStats() {
  const admin = createAdminSupabaseClient();
  const [allResult, maleResult, femaleResult] = await Promise.all([
    admin.from("students").select("id", { count: "exact", head: true }),
    admin.from("students").select("id", { count: "exact", head: true }).eq("gender", "male"),
    admin.from("students").select("id", { count: "exact", head: true }).eq("gender", "female"),
  ]);

  return {
    total: allResult.count ?? 0,
    male: maleResult.count ?? 0,
    female: femaleResult.count ?? 0,
  };
}

async function getMuridStudents(userId: string, periodId: string | null) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("students")
    .select("id, profile_id, nisn, full_name, gender")
    .eq("profile_id", userId)
    .limit(1);

  const students = (data ?? []) as StudentRow[];
  const classroomByStudentId = await getClassroomMap(
    students.map((student) => student.id),
    periodId
  );

  return {
    stats: buildStats(students),
    students: buildStudentRows(students, classroomByStudentId),
  };
}

async function getGuruStudents(userId: string, periodId: string | null) {
  const admin = createAdminSupabaseClient();
  const { data: teacherRows } = await admin
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .limit(1);

  const teacher = (teacherRows as TeacherRow[] | null)?.[0] ?? null;

  if (!teacher) {
    return {
      stats: { total: 0, male: 0, female: 0 },
      students: [],
    };
  }

  let subjectQuery = admin
    .from("subject_teacher_assignments")
    .select("classroom_id, academic_period_id")
    .eq("teacher_id", teacher.id);

  let homeroomQuery = admin
    .from("homeroom_assignments")
    .select("classroom_id, academic_period_id")
    .eq("teacher_id", teacher.id);

  if (periodId) {
    subjectQuery = subjectQuery.eq("academic_period_id", periodId);
    homeroomQuery = homeroomQuery.eq("academic_period_id", periodId);
  }

  const [subjectAssignments, homeroomAssignments] = await Promise.all([
    subjectQuery,
    homeroomQuery,
  ]);

  const assignmentList = [
    ...((subjectAssignments.data ?? []) as AssignmentRow[]),
    ...((homeroomAssignments.data ?? []) as AssignmentRow[]),
  ];

  if (!assignmentList.length) {
    return {
      stats: { total: 0, male: 0, female: 0 },
      students: [],
    };
  }

  const classroomIds = [...new Set(assignmentList.map((assignment) => assignment.classroom_id))];
  const periodIds = [...new Set(assignmentList.map((assignment) => assignment.academic_period_id))];

  let enrollmentsQuery = admin
    .from("enrollments")
    .select("student_id, classroom_id, academic_period_id")
    .in("classroom_id", classroomIds);

  if (periodIds.length) {
    enrollmentsQuery = enrollmentsQuery.in("academic_period_id", periodIds);
  }

  const { data: enrollments } = await enrollmentsQuery;
  const studentIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.student_id))];

  if (!studentIds.length) {
    return {
      stats: { total: 0, male: 0, female: 0 },
      students: [],
    };
  }

  const { data: studentsData } = await admin
    .from("students")
    .select("id, profile_id, nisn, full_name, gender")
    .in("id", studentIds)
    .order("full_name", { ascending: true });

  const students = ((studentsData ?? []) as StudentRow[]).slice(0, 8);
  const classroomByStudentId = new Map<string, string>();

  for (const enrollment of enrollments ?? []) {
    if (!classroomByStudentId.has(enrollment.student_id)) {
      classroomByStudentId.set(enrollment.student_id, enrollment.classroom_id);
    }
  }

  const { data: classrooms } = await admin
    .from("classrooms")
    .select("id, classroom_name")
    .in("id", [...new Set([...classroomByStudentId.values()])]);

  const classroomNameById = new Map(
    (classrooms ?? []).map((classroom) => [classroom.id, classroom.classroom_name])
  );

  const resolvedClassroomMap = new Map(
    [...classroomByStudentId.entries()].map(([studentId, classroomId]) => [
      studentId,
      classroomNameById.get(classroomId) ?? "-",
    ])
  );

  return {
    stats: buildStats((studentsData ?? []) as StudentRow[]),
    students: buildStudentRows(students, resolvedClassroomMap),
  };
}

async function getScopedOverview(role: DashboardRole, userId: string, periodId: string | null) {
  if (role === "admin") {
    return getAdminStudents(periodId);
  }

  if (role === "guru") {
    return getGuruStudents(userId, periodId);
  }

  return getMuridStudents(userId, periodId);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const user = await getDashboardSession();
  const periodId = await getCurrentPeriodId();
  const overview = await getScopedOverview(user.role, user.id, periodId);

  return {
    user,
    stats: overview.stats,
    students: overview.students,
  };
}
