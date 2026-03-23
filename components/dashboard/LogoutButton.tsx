"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[dashboard] logout failed", error.message);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-slate-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Logout"
    >
      <span className="material-symbols-outlined text-[20px]">logout</span>
    </button>
  );
}
