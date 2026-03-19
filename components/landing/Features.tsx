const features = [
  {
    title: "Digital Grading",
    description:
      "Input dan kalkulasi nilai otomatis sesuai kurikulum Merdeka atau K13 dengan validasi data yang akurat.",
    icon: "🧮",
  },
  {
    title: "Attendance Tracking",
    description:
      "Pantau kehadiran harian dan per mata pelajaran siswa secara real-time dengan rekapitulasi otomatis.",
    icon: "✅",
  },
  {
    title: "Student Reports",
    description:
      "Generate raport digital dalam format PDF resmi dengan satu klik. Siap cetak atau bagikan langsung ke orang tua.",
    icon: "📄",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#1e3b8a]">Fitur Unggulan</h2>
          <h3 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Segala yang Anda butuhkan untuk mengelola administrasi akademik
          </h3>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-slate-100 bg-[#f6f6f8] p-8 transition-all hover:border-[#1e3b8a]/30 hover:shadow-xl"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1e3b8a]/10 text-3xl transition-all group-hover:bg-[#1e3b8a] group-hover:text-white">
                {feature.icon}
              </div>
              <h4 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h4>
              <p className="leading-relaxed text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
