"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Profile = {
  role: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("-");
  const [role, setRole] = useState<string>("-");

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle<Profile>();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!profile) {
          throw new Error("Profile not found.");
        }

        if (isMounted) {
          setEmail(user.email ?? "-");
          setRole(profile.role ?? "waiting approval");
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unexpected error.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return <main className="p-6">Loading...</main>;
  }

  if (error) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Welcome Admin</h1>

      <div className="space-y-2 rounded-md border border-slate-200 p-4">
        <p>
          <span className="font-medium">Email:</span> {email}
        </p>
        <p>
          <span className="font-medium">Role:</span> {role}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/users/new"
          className="rounded-md bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Create Student
        </Link>

        <Link
          href="/admin/users/new"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Create Teacher
        </Link>
      </div>
    </main>
  );
}
