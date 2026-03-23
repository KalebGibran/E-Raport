"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { AdminValidationError } from "@/lib/admin/errors";
import { cleanText, parseBoolean } from "@/lib/admin/validation";
import { createStudent, deactivateStudent, updateStudent } from "@/lib/admin/students";
import { createTeacher, deleteTeacher, updateTeacher } from "@/lib/admin/teachers";
import { createSubject, deactivateSubject, updateSubject } from "@/lib/admin/subjects";
import { createAssignment, deleteAssignment } from "@/lib/admin/assignments";

function toUrl(pathname: string, status: "success" | "error", message: string) {
  return `${pathname}?status=${status}&message=${encodeURIComponent(message)}`;
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

function parseGender(value: FormDataEntryValue | null): "male" | "female" | null {
  const parsed = cleanText(value);
  if (!parsed) return null;
  return parsed === "male" || parsed === "female" ? parsed : null;
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
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
    redirect(toUrl(path, "error", getErrorMessage(error)));
  }

  revalidatePath(path);
  redirect(toUrl(path, "success", "Assignment berhasil dihapus."));
}

