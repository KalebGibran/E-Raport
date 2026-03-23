import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

type ProfileRow = {
  full_name: string;
  role: "student" | "subject_teacher" | "homeroom_teacher" | "admin";
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentPage() {
  const { user } = await requireRole(["student"]);
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (error || !profile) {
    throw new Error(error?.message ?? "Failed to load profile");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 bg-[#f6f6f8] p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-sm text-slate-600">You are authenticated and authorized as student.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Account Info</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Nama:</span> {profile.full_name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user.email ?? "-"}
          </p>
          <p>
            <span className="font-medium">Role:</span> {profile.role}
          </p>
        </div>
      </section>
    </main>
  );
}
