import { redirect } from "next/navigation";

import { createManagedUser } from "@/lib/actions/createUser";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

// ✅ FIXED
async function createStudentAction(formData: FormData) {
  "use server";

  let result;

  try {
    result = await createManagedUser({
      type: "student",
      fullName: getValue(formData, "fullName"),
      nis: getValue(formData, "nis"),
      nisn: getValue(formData, "nisn") || undefined,
    });
  } catch (error) {
    // redirect error tetap boleh di catch, karena ini bukan redirect asli
    redirect(`/admin/users/new?status=error&message=${encodeURIComponent(toErrorMessage(error))}`);
  }

  // ❗ redirect HARUS di luar try-catch
  redirect(
    `/admin/users/new?status=success&message=${encodeURIComponent(`Student created: ${result.email}`)}`
  );
}

// ✅ FIXED
async function createTeacherAction(formData: FormData) {
  "use server";

  let result;

  try {
    result = await createManagedUser({
      type: "teacher",
      fullName: getValue(formData, "fullName"),
      teacherCode: getValue(formData, "teacherCode"),
      role:
        (getValue(formData, "role") as "subject_teacher" | "homeroom_teacher") ||
        "subject_teacher",
    });
  } catch (error) {
    redirect(`/admin/users/new?status=error&message=${encodeURIComponent(toErrorMessage(error))}`);
  }

  // ❗ redirect HARUS di luar try-catch
  redirect(
    `/admin/users/new?status=success&message=${encodeURIComponent(`Teacher created: ${result.email}`)}`
  );
}

export default async function AdminCreateUserPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Admin: Create Teacher/Student Account
        </h1>
        <p className="text-sm text-slate-500">
          Login format dibuat otomatis: <code>{"{nis}@student.local"}</code> /{" "}
          <code>{"{teacher_code}@teacher.local"}</code>.
        </p>
      </header>

      {params.message ? (
        <div
          className={
            params.status === "success"
              ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {params.message}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <form
          action={createStudentAction}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-900">Create Student</h2>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input name="fullName" required className="w-full rounded-md border px-3 py-2" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">NIS</span>
            <input name="nis" required className="w-full rounded-md border px-3 py-2" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">NISN (optional)</span>
            <input name="nisn" className="w-full rounded-md border px-3 py-2" />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[#1e3b8a] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create Student Account
          </button>
        </form>

        <form
          action={createTeacherAction}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-slate-900">Create Teacher</h2>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input name="fullName" required className="w-full rounded-md border px-3 py-2" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Teacher Code</span>
            <input name="teacherCode" required className="w-full rounded-md border px-3 py-2" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select name="role" className="w-full rounded-md border px-3 py-2">
              <option value="subject_teacher">subject_teacher</option>
              <option value="homeroom_teacher">homeroom_teacher</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-[#1e3b8a] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create Teacher Account
          </button>
        </form>
      </section>
    </main>
  );
}