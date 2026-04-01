"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cleanText } from "@/lib/admin/validation";
import { saveReportValidation } from "@/lib/report-validation/service";

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi error saat menyimpan validasi raport.";
}

function parseReportStatus(value: string): "draft" | "pending_approval" | "approved" {
  if (value === "approved") return "approved";
  if (value === "pending_approval") return "pending_approval";
  return "draft";
}

export async function saveReportValidationAction(formData: FormData) {
  const path = "/dashboard/validation";
  const assignmentId = cleanText(formData.get("assignment_id"));
  const enrollmentId = cleanText(formData.get("enrollment_id"));
  const status = parseReportStatus(cleanText(formData.get("status")));
  const homeroomNotes = cleanText(formData.get("homeroom_notes"));

  if (!assignmentId || !enrollmentId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Assignment atau enrollment tidak valid.",
      })
    );
  }

  try {
    await saveReportValidation({
      assignmentId,
      enrollmentId,
      status,
      homeroomNotes: homeroomNotes || null,
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
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard/recap");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Validasi raport berhasil disimpan.",
      assignment_id: assignmentId,
    })
  );
}
