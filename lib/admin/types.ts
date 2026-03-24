import { ProfileRole } from "@/lib/auth/roles";

export type FieldErrors = Record<string, string>;

export type ActionState = {
  success: boolean;
  message: string;
  fieldErrors?: FieldErrors;
};

export type AdminContext = {
  userId: string;
  email: string;
  profileRole: ProfileRole;
};

export type StudentFormInput = {
  nis: string;
  nisn?: string | null;
  fullName: string;
  gender?: "male" | "female" | null;
  birthDate?: string | null;
  isActive: boolean;
};

export type TeacherFormInput = {
  teacherCode: string;
  fullName: string;
};

export type SubjectFormInput = {
  subjectCode: string;
  subjectName: string;
  isActive: boolean;
};

export type AssignmentFormInput = {
  teacherId: string;
  subjectId: string;
  classroomId: string;
  academicPeriodId: string;
};

export type PromotionFormInput = {
  currentPeriodId: string;
  targetPeriodId: string;
  excludedStudentIds?: string[];
};

export type EnrollmentFormInput = {
  studentId: string;
  classroomId: string;
  academicPeriodId: string;
  status?: "active" | "completed" | "promoted" | "retained" | "transferred";
};

export type ClassroomFormInput = {
  schoolLevel: "sd" | "smp" | "sma";
  gradeLevel: number;
  section: string;
  classroomName: string;
  nextClassroomId?: string | null;
  isActive: boolean;
};

export type AcademicPeriodFormInput = {
  academicYearId: string;
  semester: 1 | 2;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "closed";
  isCurrent: boolean;
};
