import "server-only";

import { normalizeDashboardRole } from "@/lib/auth/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type TeacherRole = "subject_teacher" | "homeroom_teacher";
type ProfileRole = "student" | TeacherRole;

type CreateStudentInput = {
  type: "student";
  fullName: string;
  nis: string;
  nisn?: string;
};

type CreateTeacherInput = {
  type: "teacher";
  fullName: string;
  teacherCode: string;
  role?: TeacherRole;
};

export type CreateManagedUserInput = CreateStudentInput | CreateTeacherInput;

export type CreateManagedUserResult = {
  authUserId: string;
  email: string;
  password: string;
  role: ProfileRole;
};

const LOCAL_IDENTIFIER_PATTERN = /^[a-z0-9._-]+$/;

function getAdminClient() {
  return createAdminSupabaseClient();
}

function normalizeIdentifier(raw: string, label: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error(`${label} is required`);
  }

  const localPart = trimmed.toLowerCase();

  if (!LOCAL_IDENTIFIER_PATTERN.test(localPart)) {
    throw new Error(
      `${label} contains invalid characters. Allowed: a-z, 0-9, dot (.), dash (-), underscore (_)`
    );
  }

  return { raw: trimmed, localPart };
}

function resolveCredentials(input: CreateManagedUserInput) {
  if (input.type === "student") {
    const identifier = normalizeIdentifier(input.nis, "NIS");

    return {
      role: "student" as const,
      loginId: identifier.raw,
      email: `${identifier.localPart}@student.local`,
      password: identifier.raw,
    };
  }

  const identifier = normalizeIdentifier(input.teacherCode, "teacher_code");
  const role = input.role ?? "subject_teacher";

  return {
    role,
    loginId: identifier.raw,
    email: `${identifier.localPart}@teacher.local`,
    password: identifier.raw,
  };
}

async function rollbackAuthUser(authUserId: string) {
  const admin = getAdminClient();
  await admin.auth.admin.deleteUser(authUserId);
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<CreateManagedUserResult> {
  const admin = getAdminClient();
  const credentials = resolveCredentials(input);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
    user_metadata: {
      name: input.fullName,
      full_name: input.fullName,
      account_type: input.type,
      login_identifier: credentials.loginId,
      role: normalizeDashboardRole(credentials.role),
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create auth user");
  }

  const authUserId = authData.user.id;

  try {
    const { error: profileError } = await admin.from("profiles").insert({
      id: authUserId,
      role: credentials.role,
      full_name: input.fullName,
      is_active: true,
    });

    if (profileError) {
      throw new Error(`Failed to insert profile: ${profileError.message}`);
    }

    if (input.type === "student") {
      const { error: studentError } = await admin.from("students").insert({
        profile_id: authUserId,
        full_name: input.fullName,
        nis: credentials.loginId,
        nisn: input.nisn?.trim() || null,
      });

      if (studentError) {
        throw new Error(`Failed to insert student: ${studentError.message}`);
      }
    } else {
      const { error: teacherError } = await admin.from("teachers").insert({
        profile_id: authUserId,
        full_name: input.fullName,
        teacher_code: credentials.loginId,
      });

      if (teacherError) {
        throw new Error(`Failed to insert teacher: ${teacherError.message}`);
      }
    }

    return {
      authUserId,
      email: credentials.email,
      password: credentials.password,
      role: credentials.role,
    };
  } catch (error) {
    await rollbackAuthUser(authUserId);
    throw error;
  }
}
