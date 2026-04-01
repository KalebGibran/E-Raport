"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AdminValidationError } from "@/lib/admin/errors";
import { cleanText, parseBoolean } from "@/lib/admin/validation";
import { createStudent, deactivateStudent, updateStudent } from "@/lib/admin/students";
import { createTeacher, deleteTeacher, updateTeacher } from "@/lib/admin/teachers";
import { createSubject, deactivateSubject, updateSubject } from "@/lib/admin/subjects";
import { createAssignment, deleteAssignment } from "@/lib/admin/assignments";
import { createHomeroomAssignment, deleteHomeroomAssignment } from "@/lib/admin/homerooms";
import {
  getPromotionPreview,
  promoteStudents,
  type PromotionPreview,
  type PromotionResult,
} from "@/lib/admin/promotion";
import { createEnrollment, deleteEnrollment } from "@/lib/admin/enrollments";
import { createClassroom, deactivateClassroom, updateClassroom } from "@/lib/admin/classrooms";
import {
  createAcademicPeriod,
  setCurrentAcademicPeriod,
  updateAcademicPeriod,
} from "@/lib/admin/periods";

function toUrl(pathname: string, status: "success" | "error", message: string) {
  return `${pathname}?status=${status}&message=${encodeURIComponent(message)}`;
}

function toUrlWithParams(pathname: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${pathname}?${query.toString()}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AdminValidationError) {
    const fieldMessage = Object.values(error.fieldErrors)[0];
    return fieldMessage ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi error yang tidak diketahui.";
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if (!("digest" in error)) return false;

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function handleActionError(path: string, error: unknown, params: Record<string, string> = {}): never {
  if (isNextRedirectError(error)) {
    throw error;
  }

  redirect(
    toUrlWithParams(path, {
      status: "error",
      message: getErrorMessage(error),
      ...params,
    })
  );
}

function parseGender(value: FormDataEntryValue | null): "male" | "female" | null {
  const parsed = cleanText(value);
  if (!parsed) return null;
  return parsed === "male" || parsed === "female" ? parsed : null;
}

function parseSchoolLevel(value: FormDataEntryValue | null): "sd" | "smp" | "sma" {
  const parsed = cleanText(value);
  if (parsed === "sd" || parsed === "smp" || parsed === "sma") return parsed;
  return "sd";
}

function parseSemester(value: FormDataEntryValue | null): 1 | 2 {
  const parsed = Number(cleanText(value));
  return parsed === 2 ? 2 : 1;
}

function parsePeriodStatus(value: FormDataEntryValue | null): "planned" | "active" | "closed" {
  const parsed = cleanText(value);
  if (parsed === "planned" || parsed === "active" || parsed === "closed") return parsed;
  return "planned";
}

export async function createStudentAction(formData: FormData) {
  const path = "/dashboard/students";

  try {
    await createStudent({
      nis: cleanText(formData.get("nis")),
      nisn: cleanText(formData.get("nisn")) || null,
      fullName: cleanText(formData.get("full_name")),
      gender: parseGender(formData.get("gender")),
      birthDate: cleanText(formData.get("birth_date")) || null,
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(toUrl(path, "success", "Data siswa berhasil dibuat."));
}

export async function updateStudentAction(formData: FormData) {
  const path = "/dashboard/students";
  const studentId = cleanText(formData.get("student_id"));

  if (!studentId) {
    redirect(toUrl(path, "error", "ID siswa tidak valid."));
  }

  try {
    await updateStudent(studentId, {
      nis: cleanText(formData.get("nis")),
      nisn: cleanText(formData.get("nisn")) || null,
      fullName: cleanText(formData.get("full_name")),
      gender: parseGender(formData.get("gender")),
      birthDate: cleanText(formData.get("birth_date")) || null,
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(toUrl(path, "success", "Data siswa berhasil diperbarui."));
}

export async function deactivateStudentAction(formData: FormData) {
  const path = "/dashboard/students";
  const studentId = cleanText(formData.get("student_id"));

  if (!studentId) {
    redirect(toUrl(path, "error", "ID siswa tidak valid."));
  }

  try {
    await deactivateStudent(studentId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(toUrl(path, "success", "Siswa berhasil dinonaktifkan."));
}

export async function createTeacherAction(formData: FormData) {
  const path = "/dashboard/teachers";

  try {
    await createTeacher({
      teacherCode: cleanText(formData.get("teacher_code")),
      fullName: cleanText(formData.get("full_name")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Data guru berhasil dibuat."));
}

export async function updateTeacherAction(formData: FormData) {
  const path = "/dashboard/teachers";
  const teacherId = cleanText(formData.get("teacher_id"));

  if (!teacherId) {
    redirect(toUrl(path, "error", "ID guru tidak valid."));
  }

  try {
    await updateTeacher(teacherId, {
      teacherCode: cleanText(formData.get("teacher_code")),
      fullName: cleanText(formData.get("full_name")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Data guru berhasil diperbarui."));
}

export async function deleteTeacherAction(formData: FormData) {
  const path = "/dashboard/teachers";
  const teacherId = cleanText(formData.get("teacher_id"));

  if (!teacherId) {
    redirect(toUrl(path, "error", "ID guru tidak valid."));
  }

  try {
    await deleteTeacher(teacherId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Data guru berhasil dihapus."));
}

export async function createSubjectAction(formData: FormData) {
  const path = "/dashboard/subjects";

  try {
    await createSubject({
      subjectCode: cleanText(formData.get("subject_code")),
      subjectName: cleanText(formData.get("subject_name")),
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Data mapel berhasil dibuat."));
}

export async function updateSubjectAction(formData: FormData) {
  const path = "/dashboard/subjects";
  const subjectId = cleanText(formData.get("subject_id"));

  if (!subjectId) {
    redirect(toUrl(path, "error", "ID mapel tidak valid."));
  }

  try {
    await updateSubject(subjectId, {
      subjectCode: cleanText(formData.get("subject_code")),
      subjectName: cleanText(formData.get("subject_name")),
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Data mapel berhasil diperbarui."));
}

export async function deactivateSubjectAction(formData: FormData) {
  const path = "/dashboard/subjects";
  const subjectId = cleanText(formData.get("subject_id"));

  if (!subjectId) {
    redirect(toUrl(path, "error", "ID mapel tidak valid."));
  }

  try {
    await deactivateSubject(subjectId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Mapel berhasil dinonaktifkan."));
}

export async function createAssignmentAction(formData: FormData) {
  const path = "/dashboard/assignments";

  try {
    await createAssignment({
      teacherId: cleanText(formData.get("teacher_id")),
      subjectId: cleanText(formData.get("subject_id")),
      classroomId: cleanText(formData.get("classroom_id")),
      academicPeriodId: cleanText(formData.get("academic_period_id")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Assignment guru-mapel berhasil dibuat."));
}

export async function deleteAssignmentAction(formData: FormData) {
  const path = "/dashboard/assignments";
  const assignmentId = cleanText(formData.get("assignment_id"));

  if (!assignmentId) {
    redirect(toUrl(path, "error", "ID assignment tidak valid."));
  }

  try {
    await deleteAssignment(assignmentId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Assignment berhasil dihapus."));
}

export async function createHomeroomAssignmentAction(formData: FormData) {
  const path = "/dashboard/homerooms";

  try {
    await createHomeroomAssignment({
      teacherId: cleanText(formData.get("teacher_id")),
      classroomId: cleanText(formData.get("classroom_id")),
      periodId: cleanText(formData.get("academic_period_id")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(toUrl(path, "success", "Wali kelas berhasil ditetapkan."));
}

export async function deleteHomeroomAssignmentAction(formData: FormData) {
  const path = "/dashboard/homerooms";
  const assignmentId = cleanText(formData.get("assignment_id"));

  if (!assignmentId) {
    redirect(toUrl(path, "error", "ID assignment wali kelas tidak valid."));
  }

  try {
    await deleteHomeroomAssignment(assignmentId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(toUrl(path, "success", "Assignment wali kelas berhasil dihapus."));
}

export async function promoteStudentsAction(formData: FormData) {
  const path = "/dashboard/promotion";
  const currentPeriodId = cleanText(formData.get("current_period_id"));
  const targetPeriodId = cleanText(formData.get("target_period_id"));
  const excludedStudentIds = formData
    .getAll("excluded_student_ids")
    .map((value) => cleanText(value))
    .filter(Boolean);

  if (!currentPeriodId || !targetPeriodId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Periode saat ini dan periode target wajib dipilih.",
      })
    );
  }

  let preview: PromotionPreview;
  try {
    preview = await getPromotionPreview({
      currentPeriodId,
      targetPeriodId,
      excludedStudentIds,
    });
  } catch (error) {
    handleActionError(path, error, { target_period_id: targetPeriodId });
  }

  if (preview.eligibleCount <= 0) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Semua siswa current sudah punya enrollment di periode target.",
        target_period_id: targetPeriodId,
      })
    );
  }

  let result: PromotionResult;
  try {
    result = await promoteStudents({
      currentPeriodId,
      targetPeriodId,
      excludedStudentIds,
    });
  } catch (error) {
    handleActionError(path, error, { target_period_id: targetPeriodId });
  }

  revalidatePath(path);
  revalidatePath("/dashboard");

  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Promotion berhasil dieksekusi.",
      target_period_id: targetPeriodId,
      total: String(result.totalCandidates),
      inserted: String(result.insertedCount),
      skipped: String(result.skippedExistingCount),
      moved: String(result.movedClassCount),
      stayed: String(result.stayedClassCount),
    })
  );
}

export async function createEnrollmentAction(formData: FormData) {
  const path = "/dashboard/enrollments";

  try {
    await createEnrollment({
      studentId: cleanText(formData.get("student_id")),
      classroomId: cleanText(formData.get("classroom_id")),
      academicPeriodId: cleanText(formData.get("academic_period_id")),
      status: "active",
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/promotion");
  redirect(toUrl(path, "success", "Enrollment siswa berhasil dibuat."));
}

export async function deleteEnrollmentAction(formData: FormData) {
  const path = "/dashboard/enrollments";
  const enrollmentId = cleanText(formData.get("enrollment_id"));

  if (!enrollmentId) {
    redirect(toUrl(path, "error", "ID enrollment tidak valid."));
  }

  try {
    await deleteEnrollment(enrollmentId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/promotion");
  redirect(toUrl(path, "success", "Enrollment berhasil dihapus."));
}

export async function createClassroomAction(formData: FormData) {
  const path = "/dashboard/classrooms";

  try {
    await createClassroom({
      schoolLevel: parseSchoolLevel(formData.get("school_level")),
      gradeLevel: Number(cleanText(formData.get("grade_level"))),
      section: cleanText(formData.get("section")),
      classroomName: cleanText(formData.get("classroom_name")),
      nextClassroomId: cleanText(formData.get("next_classroom_id")) || null,
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Data kelas berhasil dibuat."));
}

export async function updateClassroomAction(formData: FormData) {
  const path = "/dashboard/classrooms";
  const classroomId = cleanText(formData.get("classroom_id"));

  if (!classroomId) {
    redirect(toUrl(path, "error", "ID kelas tidak valid."));
  }

  try {
    await updateClassroom(classroomId, {
      schoolLevel: parseSchoolLevel(formData.get("school_level")),
      gradeLevel: Number(cleanText(formData.get("grade_level"))),
      section: cleanText(formData.get("section")),
      classroomName: cleanText(formData.get("classroom_name")),
      nextClassroomId: cleanText(formData.get("next_classroom_id")) || null,
      isActive: parseBoolean(formData.get("is_active")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Data kelas berhasil diperbarui."));
}

export async function deactivateClassroomAction(formData: FormData) {
  const path = "/dashboard/classrooms";
  const classroomId = cleanText(formData.get("classroom_id"));

  if (!classroomId) {
    redirect(toUrl(path, "error", "ID kelas tidak valid."));
  }

  try {
    await deactivateClassroom(classroomId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Kelas berhasil dinonaktifkan."));
}

export async function createAcademicPeriodAction(formData: FormData) {
  const path = "/dashboard/periods";

  try {
    await createAcademicPeriod({
      academicYearId: cleanText(formData.get("academic_year_id")),
      semester: parseSemester(formData.get("semester")),
      periodName: cleanText(formData.get("period_name")),
      startDate: cleanText(formData.get("start_date")),
      endDate: cleanText(formData.get("end_date")),
      status: parsePeriodStatus(formData.get("status")),
      isCurrent: parseBoolean(formData.get("is_current")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/promotion");
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Periode akademik berhasil dibuat."));
}

export async function updateAcademicPeriodAction(formData: FormData) {
  const path = "/dashboard/periods";
  const periodId = cleanText(formData.get("period_id"));

  if (!periodId) {
    redirect(toUrl(path, "error", "ID periode tidak valid."));
  }

  try {
    await updateAcademicPeriod(periodId, {
      academicYearId: cleanText(formData.get("academic_year_id")),
      semester: parseSemester(formData.get("semester")),
      periodName: cleanText(formData.get("period_name")),
      startDate: cleanText(formData.get("start_date")),
      endDate: cleanText(formData.get("end_date")),
      status: parsePeriodStatus(formData.get("status")),
      isCurrent: parseBoolean(formData.get("is_current")),
    });
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/promotion");
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Periode akademik berhasil diperbarui."));
}

export async function setCurrentAcademicPeriodAction(formData: FormData) {
  const path = "/dashboard/periods";
  const periodId = cleanText(formData.get("period_id"));

  if (!periodId) {
    redirect(toUrl(path, "error", "ID periode tidak valid."));
  }

  try {
    await setCurrentAcademicPeriod(periodId);
  } catch (error) {
    handleActionError(path, error);
  }

  revalidatePath(path);
  revalidatePath("/dashboard/promotion");
  revalidatePath("/dashboard/enrollments");
  redirect(toUrl(path, "success", "Periode current berhasil diubah."));
}
