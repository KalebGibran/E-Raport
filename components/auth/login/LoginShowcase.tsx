import Image from "next/image";

export function LoginShowcase() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#1e3b8a] p-10 md:flex">
      <div className="relative z-10">
        <h1 className="mb-4 text-4xl font-black leading-tight text-white">Kelola Nilai Dengan Lebih Mudah</h1>
        <p className="text-lg text-blue-100">
          Akses cepat ke laporan hasil belajar siswa, monitoring perkembangan akademik, dan transparansi nilai dalam
          satu platform terpadu.
        </p>
      </div>

      <div className="relative z-10 mt-8 overflow-hidden rounded-lg border-2 border-white/20 shadow-2xl">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoottx8j2FraFy9tA-12vgfcMucSKeavAc0shA93sAv0aZDWBWqB8a9q42ZvW8zFyGS23Eij2PZxyTqD0Z8c-C74Kuhp89E8tJYx6GxDhV-wjGg-FIKjCD9b3bdFS8fKG6oh4B8qC7p3Cc3ThzIohLMeddfprbjFxZ4udTNgjI6f9QX7TcC_gJOTOjJgFRga1VeEgyH5uRfq-HcMnNnH-zafeyFeTCxSSBlDiLtJLJS4MXL6gQdXZipLMMEEinXLGeaL9dcI0_EBA"
          alt="Digital classroom and data analytics dashboard"
          width={1200}
          height={675}
          className="aspect-video w-full object-cover"
        />
      </div>

      <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-900/50 blur-3xl" />
    </aside>
  );
}
