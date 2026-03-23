import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f8] p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">403 Unauthorized</h1>
        <p className="text-sm text-slate-600">
          You are signed in, but your role is not allowed to access this page.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Back to Home
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
