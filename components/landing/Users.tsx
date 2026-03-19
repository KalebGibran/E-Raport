import Image from "next/image";

const users = [
  {
    title: "Guru",
    description: "Kemudahan input nilai harian, UTS, dan UAS tanpa repot menghitung manual.",
    icon: "👨‍🏫",
  },
  {
    title: "Siswa",
    description: "Akses nilai transparan dan riwayat perkembangan belajar untuk motivasi diri.",
    icon: "🧑‍🎓",
  },
  {
    title: "Orang Tua",
    description: "Pantau perkembangan akademik dan absensi anak secara langsung dari smartphone.",
    icon: "👪",
  },
];

export function Users() {
  return (
    <section id="users" className="overflow-hidden py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          <div className="lg:w-1/2">
            <h2 className="mb-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Dirancang Untuk Semua Komunitas Sekolah
            </h2>
            <p className="mb-10 text-lg text-slate-600">
              Kami menciptakan ekosistem yang menghubungkan semua pihak untuk menciptakan transparansi pendidikan.
            </p>

            <div className="space-y-6">
              {users.map((user) => (
                <article key={user.title} className="flex gap-4 rounded-xl p-4 transition-colors hover:bg-white">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e3b8a]/10">
                    {user.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{user.title}</h5>
                    <p className="text-sm text-slate-500">{user.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative lg:w-1/2">
            <div className="overflow-hidden rounded-3xl bg-[#1e3b8a] p-1 shadow-2xl">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV4zACQ-52b1RuE_XSvRvV5NYW82UF3QJ8ok9AGesSP-Ay9pIhECtGZKQm8qdJkBmI7pl-KdQarzK9MTF19hxB9XhsNcs7CItq6aOQhQ0IhffSa5aOh1HAMdMeTEUUmCfUoKSke1EmO8gxYtPKNOGKwLKlcR8NnbkD7WOaJXwus87KoyLlAbPwdI0LBhNFDAkxW67jsWBcD3TkG70ZOWhKo_GiEk9LadA1gw6_LL4fdnTsWGtZ__Rb6DZuXYmg8ehEPDiuuyAD09Q"
                alt="Students learning with digital tools"
                width={1200}
                height={900}
                className="h-full w-full rounded-[1.4rem] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
