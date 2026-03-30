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
    if (lower.includes("classrooms_school_level_grade_level_section_key")) {
      return "Kombinasi level, tingkat, dan rombel kelas sudah ada.";
    }
    if (lower.includes("academic_periods_academic_year_id_semester_key")) {
      return "Periode untuk tahun ajaran dan semester ini sudah ada.";
    }
    if (lower.includes("subject_teacher_assignments_subject_id_classroom_id_academic_p_key")) {
      return "Assignment mapel untuk kelas & periode ini sudah ada.";
    }
    if (lower.includes("enrollments_student_id_academic_period_id_key")) {
      return "Siswa sudah terdaftar pada periode akademik ini.";
    }
    if (lower.includes("daily_assessments_assignment_id_assessment_no_key")) {
      return "Nomor tugas harian untuk assignment ini sudah ada.";
    }

    return "Data duplikat terdeteksi.";
  }

  if (lower.includes("foreign key")) {
    return "Relasi data tidak valid atau masih dipakai data lain.";
  }

  if (lower.includes("scores_remedial_score_range_check")) {
    return "Nilai remedial harus di antara 0 sampai 100.";
  }

  if (lower.includes("daily_assessments_assessment_no_check")) {
    return "Nomor tugas harian harus lebih besar dari 0.";
  }

  if (lower.includes("current period and target period cannot be the same")) {
    return "Periode target tidak boleh sama dengan periode saat ini.";
  }

  if (lower.includes("academic period not found")) {
    return "Periode akademik yang dipilih tidak ditemukan.";
  }

  if (lower.includes("uq_academic_periods_single_current")) {
    return "Hanya boleh ada satu periode akademik dengan status current.";
  }

  return errorMessage;
}
