"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cleanText } from "@/lib/admin/validation";
import {
  createDailyAssessment,
  deleteDailyAssessment,
  submitDailyScores,
  updateDailyAssessment,
} from "@/lib/daily-scores/service";

function toUrlWithParams(pathname: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `${pathname}?${query.toString()}`;
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if (!("digest" in error)) return false;

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function parseNullableScore(value: string, fieldLabel: string) {
  if (!value) return null;

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} tidak valid.`);
  }

  return parsed;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi error saat menyimpan nilai harian.";
}

export async function createDailyAssessmentAction(formData: FormData) {
  const path = "/dashboard/daily-scores";
  const assignmentId = cleanText(formData.get("assignment_id"));
  const classroomId = cleanText(formData.get("classroom_id"));
  const subjectId = cleanText(formData.get("subject_id"));
  const taskDate = cleanText(formData.get("task_date"));
  const title = cleanText(formData.get("title"));
  const description = cleanText(formData.get("description"));

  if (!assignmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Assignment wajib dipilih.",
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  let createdTaskId = "";
  try {
    const created = await createDailyAssessment({
      assignmentId,
      taskDate,
      title,
      description,
    });

    createdTaskId = created.id;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Tugas harian berhasil dibuat.",
      classroom_id: classroomId,
      subject_id: subjectId,
      task_id: createdTaskId,
    })
  );
}

export async function updateDailyAssessmentAction(formData: FormData) {
  const path = "/dashboard/daily-scores";
  const dailyAssessmentId = cleanText(formData.get("daily_assessment_id"));
  const classroomId = cleanText(formData.get("classroom_id"));
  const subjectId = cleanText(formData.get("subject_id"));
  const taskDate = cleanText(formData.get("task_date"));
  const title = cleanText(formData.get("title"));
  const description = cleanText(formData.get("description"));

  if (!dailyAssessmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Task harian tidak valid.",
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  try {
    await updateDailyAssessment({
      dailyAssessmentId,
      taskDate,
      title,
      description,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        classroom_id: classroomId,
        subject_id: subjectId,
        task_id: dailyAssessmentId,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Task harian berhasil diperbarui.",
      classroom_id: classroomId,
      subject_id: subjectId,
      task_id: dailyAssessmentId,
    })
  );
}

export async function deleteDailyAssessmentAction(formData: FormData) {
  const path = "/dashboard/daily-scores";
  const dailyAssessmentId = cleanText(formData.get("daily_assessment_id"));
  const classroomId = cleanText(formData.get("classroom_id"));
  const subjectId = cleanText(formData.get("subject_id"));

  if (!dailyAssessmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Task harian tidak valid.",
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  try {
    await deleteDailyAssessment(dailyAssessmentId);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Task harian berhasil dihapus.",
      classroom_id: classroomId,
      subject_id: subjectId,
    })
  );
}

export async function submitDailyScoresAction(formData: FormData) {
  const path = "/dashboard/daily-scores";
  const assignmentId = cleanText(formData.get("assignment_id"));
  const dailyAssessmentId = cleanText(formData.get("daily_assessment_id"));
  const classroomId = cleanText(formData.get("classroom_id"));
  const subjectId = cleanText(formData.get("subject_id"));

  const enrollmentIds = formData
    .getAll("enrollment_ids")
    .map((value) => cleanText(value))
    .filter(Boolean);

  if (!assignmentId || !dailyAssessmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Assignment dan task harian wajib dipilih.",
        classroom_id: classroomId,
        subject_id: subjectId,
      })
    );
  }

  if (!enrollmentIds.length) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Belum ada siswa untuk task ini.",
        classroom_id: classroomId,
        subject_id: subjectId,
        task_id: dailyAssessmentId,
      })
    );
  }

  try {
    const entries = enrollmentIds.map((enrollmentId) => ({
      enrollmentId,
      score: parseNullableScore(cleanText(formData.get(`score_${enrollmentId}`)), "Nilai awal"),
      notes: cleanText(formData.get(`notes_${enrollmentId}`)),
    }));

    await submitDailyScores({
      assignmentId,
      dailyAssessmentId,
      entries,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;

    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        classroom_id: classroomId,
        subject_id: subjectId,
        task_id: dailyAssessmentId,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Nilai harian berhasil disimpan.",
      classroom_id: classroomId,
      subject_id: subjectId,
      task_id: dailyAssessmentId,
    })
  );
}
