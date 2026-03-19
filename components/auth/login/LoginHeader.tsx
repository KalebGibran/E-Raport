export function LoginHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-10">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3b8a] text-white"
          aria-hidden="true"
        >
          🎓
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900">E-Raport</h2>
      </div>

      <div className="hidden md:block">
        <span className="text-sm text-slate-500">Sistem Informasi Penilaian Siswa</span>
      </div>
    </header>
  );
}
