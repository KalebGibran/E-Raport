const quickLinks = ["Dashboard Guru", "Panel Siswa", "Kalender Akademik", "Pusat Bantuan"];
const legalLinks = ["Syarat & Ketentuan", "Kebijakan Privasi", "Keamanan Data"];

export function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#1e3b8a] p-2 text-white" aria-hidden="true">
                🎓
              </div>
              <h2 className="text-xl font-bold text-slate-900">E-Raport Sekolah Terang Mulia</h2>
            </div>

            <p className="mb-6 max-w-xs text-slate-500">
              Portal resmi manajemen akademik Sekolah Terang Mulia untuk mewujudkan pendidikan yang berkualitas dan
              transparan.
            </p>

            <div className="flex gap-4 text-slate-400">
              <a href="#" className="transition-colors hover:text-[#1e3b8a]" aria-label="Website">
                🌐
              </a>
              <a href="#" className="transition-colors hover:text-[#1e3b8a]" aria-label="Email">
                ✉️
              </a>
              <a href="#" className="transition-colors hover:text-[#1e3b8a]" aria-label="Phone">
                📞
              </a>
            </div>
          </div>

          <div>
            <h6 className="mb-6 font-bold text-slate-900">Akses Cepat</h6>
            <ul className="space-y-4 text-sm text-slate-500">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-[#1e3b8a]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="mb-6 font-bold text-slate-900">Legal</h6>
            <ul className="space-y-4 text-sm text-slate-500">
              {legalLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-[#1e3b8a]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© 2024 Sekolah Terang Mulia. Hak Cipta Dilindungi.</p>
          <div className="flex gap-8">
            <span>Bahasa Indonesia</span>
            <span>English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
