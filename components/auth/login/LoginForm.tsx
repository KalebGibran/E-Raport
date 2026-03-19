export function LoginForm() {
  return (
    <section className="flex flex-col p-8 md:p-12">
      <div className="mb-10">
        <h2 className="mb-2 text-3xl font-black leading-tight tracking-tight text-slate-900">Selamat Datang</h2>
        <p className="text-base text-slate-500">Silakan masuk ke akun E-Raport Anda untuk melanjutkan.</p>
      </div>

      <form className="space-y-6" action="#" method="post">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-900" htmlFor="identifier">
            Email atau Username
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"
              aria-hidden="true"
            >
              👤
            </span>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="user@sekolah.id atau NIP/NISN"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#1e3b8a]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-900" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"
              aria-hidden="true"
            >
              🔒
            </span>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Masukkan kata sandi"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-12 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#1e3b8a]"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-[#1e3b8a]"
              aria-label="Toggle password visibility"
            >
              👁️
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="group flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              className="h-5 w-5 rounded border-slate-300 bg-white text-[#1e3b8a] focus:ring-[#1e3b8a]"
            />
            <span className="text-sm text-slate-600 transition-colors group-hover:text-slate-900">Ingat Saya</span>
          </label>
          <a className="text-sm font-semibold text-[#1e3b8a] transition-colors hover:text-blue-700" href="#">
            Lupa Password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#1e3b8a] px-6 py-4 font-bold text-white shadow-lg shadow-[#1e3b8a]/20 transition-all hover:-translate-y-0.5 hover:bg-blue-800 active:scale-[0.98]"
        >
          Masuk ke Dashboard
        </button>
      </form>

      <div className="mt-auto border-t border-slate-100 pt-10 text-center">
        <p className="text-sm text-slate-500">
          Mengalami kesulitan login?{" "}
          <a className="font-bold text-[#1e3b8a] hover:underline" href="#">
            Hubungi Admin Sekolah
          </a>
        </p>
      </div>
    </section>
  );
}
