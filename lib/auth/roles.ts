export type ProfileRole = "admin" | "student" | "subject_teacher" | "homeroom_teacher";

export type DashboardRole = "admin" | "guru" | "murid";

export function normalizeDashboardRole(profileRole: ProfileRole | null | undefined): DashboardRole | null {
  switch (profileRole) {
    case "admin":
      return "admin";
    case "student":
      return "murid";
    case "subject_teacher":
    case "homeroom_teacher":
      return "guru";
    default:
      return null;
  }
}
