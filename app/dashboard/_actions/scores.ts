"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cleanText } from "@/lib/admin/validation";
import { ExamScoreType, submitExamScores } from "@/lib/scores/service";

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

function parseScoreType(value: string): ExamScoreType {
  return value === "uas" ? "uas" : "uts";
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
  return "Terjadi error saat menyimpan nilai.";
}

export async function submitExamScoresAction(formData: FormData) {
  const path = "/dashboard/scores";
  const assignmentId = cleanText(formData.get("assignment_id"));
  const scoreType = parseScoreType(cleanText(formData.get("score_type")));

  const enrollmentIds = formData
    .getAll("enrollment_ids")
    .map((value) => cleanText(value))
    .filter(Boolean);

  if (!assignmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Assignment wajib dipilih.",
        score_type: scoreType,
      })
    );
  }

  if (!enrollmentIds.length) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Belum ada siswa untuk assignment ini.",
        assignment_id: assignmentId,
        score_type: scoreType,
      })
    );
  }

  try {
    const entries = enrollmentIds.map((enrollmentId) => ({
      enrollmentId,
      score: parseNullableScore(cleanText(formData.get(`score_${enrollmentId}`)), "Nilai awal"),
      remedialScore: parseNullableScore(cleanText(formData.get(`remedial_${enrollmentId}`)), "Nilai remedial"),
      notes: cleanText(formData.get(`notes_${enrollmentId}`)),
    }));

    await submitExamScores({
      assignmentId,
      scoreType,
      entries,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        assignment_id: assignmentId,
        score_type: scoreType,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: `Nilai ${scoreType.toUpperCase()} berhasil disimpan.`,
      assignment_id: assignmentId,
      score_type: scoreType,
    })
  );
}
