"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cleanText } from "@/lib/admin/validation";
import { AttendanceStatus, submitAttendance } from "@/lib/attendance/service";

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

function parseAttendanceStatus(value: string): AttendanceStatus {
  if (value === "sick" || value === "permission" || value === "absent") {
    return value;
  }
  return "present";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi error saat menyimpan absensi.";
}

export async function submitAttendanceAction(formData: FormData) {
  const path = "/dashboard/attendance";
  const classroomId = cleanText(formData.get("classroom_id"));
  const attendanceDate = cleanText(formData.get("attendance_date"));
  const enrollmentIds = formData
    .getAll("enrollment_ids")
    .map((value) => cleanText(value))
    .filter(Boolean);

  if (!classroomId) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Kelas wajib dipilih.",
        date: attendanceDate,
      })
    );
  }

  if (!attendanceDate) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Tanggal absensi wajib dipilih.",
        classroom_id: classroomId,
      })
    );
  }

  if (!enrollmentIds.length) {
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: "Belum ada siswa pada kelas ini.",
        classroom_id: classroomId,
        date: attendanceDate,
      })
    );
  }

  try {
    await submitAttendance({
      classroomId,
      attendanceDate,
      entries: enrollmentIds.map((enrollmentId) => ({
        enrollmentId,
        status: parseAttendanceStatus(cleanText(formData.get(`status_${enrollmentId}`))),
        notes: cleanText(formData.get(`notes_${enrollmentId}`)),
      })),
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    redirect(
      toUrlWithParams(path, {
        status: "error",
        message: getErrorMessage(error),
        classroom_id: classroomId,
        date: attendanceDate,
      })
    );
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(
    toUrlWithParams(path, {
      status: "success",
      message: "Absensi berhasil disimpan.",
      classroom_id: classroomId,
      date: attendanceDate,
    })
  );
}
