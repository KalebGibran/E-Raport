import Link from "next/link";

const navLinks = [
  { label: "Fitur", href: "#features" },
  { label: "Pengguna", href: "#users" },
  { label: "Tentang Kami", href: "#about" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#1e3b8a] p-2 text-white" aria-hidden="true">
            🎓
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[#1e3b8a]">
            E-Raport Sekolah Terang Mulia
          </h2>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1e3b8a]"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden h-10 min-w-[100px] items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-bold text-slate-900 transition-all hover:bg-slate-200 sm:flex"
          >
            Masuk
          </Link>
          <Link
            href="/login"
            className="flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#1e3b8a] px-5 text-sm font-bold text-white shadow-lg shadow-[#1e3b8a]/20 transition-all hover:opacity-90"
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  );
}
