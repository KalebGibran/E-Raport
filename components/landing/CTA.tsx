export function CTA() {
  return (
    <section className="px-4 py-12">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#1e3b8a] p-8 text-center text-white sm:p-16">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl font-black sm:text-5xl">Akses Portal Akademik Anda</h2>
          <p className="max-w-2xl text-lg opacity-90">
            Gunakan kredensial resmi sekolah untuk masuk dan mulai mengelola data akademik Anda.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-[#1e3b8a] transition-all hover:bg-slate-50"
            >
              Masuk ke Portal
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/30 bg-transparent px-10 py-4 text-lg font-bold text-white transition-all hover:bg-white/10"
            >
              Panduan Pengguna
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
