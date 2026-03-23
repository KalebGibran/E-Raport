import { AdminValidationError } from "@/lib/admin/errors";
import { FieldErrors } from "@/lib/admin/types";

export function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function textOrNull(value: FormDataEntryValue | null) {
  const parsed = cleanText(value);
  return parsed ? parsed : null;
}

export function parseBoolean(value: FormDataEntryValue | null) {
  const parsed = cleanText(value).toLowerCase();
  return parsed === "1" || parsed === "true" || parsed === "on" || parsed === "yes";
}

export function parseOptionalDate(value: FormDataEntryValue | null) {
  const parsed = cleanText(value);

  if (!parsed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed) === false) {
    throw new AdminValidationError("Tanggal lahir tidak valid.", { birth_date: "Format harus YYYY-MM-DD." });
  }

  return parsed;
}

export function requireText(
  value: FormDataEntryValue | null,
  field: string,
  label: string,
  errors: FieldErrors
) {
  const parsed = cleanText(value);

  if (!parsed) {
    errors[field] = `${label} wajib diisi.`;
  }

  return parsed;
}

export function assertNoFieldErrors(message: string, fieldErrors: FieldErrors) {
  if (Object.keys(fieldErrors).length > 0) {
    throw new AdminValidationError(message, fieldErrors);
  }
}

export function mapPostgresError(errorMessage: string) {
  const lower = errorMessage.toLowerCase();

  if (lower.includes("duplicate key")) {
    if (lower.includes("students_nis_key")) return "NIS sudah digunakan.";
    if (lower.includes("students_nisn_key")) return "NISN sudah digunakan.";
    if (lower.includes("teachers_teacher_code_key")) return "Kode guru sudah digunakan.";
    if (lower.includes("subjects_subject_code_key")) return "Kode mapel sudah digunakan.";
    if (lower.includes("subject_teacher_assignments_subject_id_classroom_id_academic_p_key")) {
      return "Assignment mapel untuk kelas & periode ini sudah ada.";
    }

    return "Data duplikat terdeteksi.";
  }

  if (lower.includes("foreign key")) {
    return "Relasi data tidak valid atau masih dipakai data lain.";
  }

  return errorMessage;
}

