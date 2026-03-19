import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 lg:pb-32 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-2 flex flex-col gap-8 lg:order-1">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center rounded-full bg-[#1e3b8a]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1e3b8a]">
              Sistem Akademik Terintegrasi
            </span>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Selamat Datang di Portal Akademik Digital Sekolah Terang Mulia
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Sistem terpadu untuk pengelolaan nilai, absensi, dan perkembangan siswa secara transparan dan
              akuntabel dalam satu lingkungan digital sekolah.
            </p>
          </div>

          <div>
            <button
              type="button"
              className="flex h-14 min-w-[160px] items-center justify-center rounded-xl bg-[#1e3b8a] px-8 text-lg font-bold text-white shadow-xl shadow-[#1e3b8a]/20 transition-all hover:scale-[1.02]"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="absolute -inset-4 rounded-full bg-[#1e3b8a]/10 opacity-50 blur-3xl" />
          <div className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAzl6qlU8-ETER1xNzFFdQw5WI7XxGuRtRbS07OEZj2tRPURkxMCr-IP4TJd12Na7ZZK7syRw30DEsCRxhlja2Vi9jn4aPxp0iZS8zFz9LIAWBqc__w7Y4A1yqanZuuwZL6Rae167Up1Ba3KdHJdIjDeG-W_kuQm3t6mOHTo50qUW70P4ySQ-LLnRW3sq39gWNC7CC3jkXl9AdYW7q2UvK6pqKGHSThTMPjt6O1NvL1GiTkdD3AgzT2sqZeNTXKGdB5bGO7og8OW4"
              alt="School management visual dashboard"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />

            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-slate-100 bg-white p-4 shadow-lg sm:block">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 text-green-600" aria-hidden="true">
                  📈
                </div>
                <div>
                  <p className="text-xs text-slate-500">Efisiensi Admin</p>
                  <p className="text-lg font-bold text-slate-900">Naik 85%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
