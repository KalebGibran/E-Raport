import { DashboardRole } from "@/lib/auth/roles";
import { DashboardStudentRow, DashboardStudentStats } from "@/lib/dashboard/data";

type StudentsDashboardViewProps = {
  role: DashboardRole;
  stats: DashboardStudentStats;
  students: DashboardStudentRow[];
};

function getRoleCopy(role: DashboardRole) {
  if (role === "admin") {
    return {
      title: "Manajemen Siswa",
      description: "Kelola dan pantau seluruh informasi data siswa dengan mudah dalam satu tempat.",
      buttonLabel: "Tambah Siswa",
    };
  }

  if (role === "guru") {
    return {
      title: "Data Siswa",
      description: "Pantau data siswa yang berada dalam tanggung jawab pengajaran Anda.",
      buttonLabel: null,
    };
  }

  return {
    title: "Data Siswa Saya",
    description: "Lihat ringkasan data akademik Anda dalam tampilan dashboard yang sama.",
    buttonLabel: null,
  };
}

export function StudentsDashboardView({ role, stats, students }: StudentsDashboardViewProps) {
  const copy = getRoleCopy(role);
  const canManageStudents = role === "admin";
  const hasData = students.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {copy.title}
          </h2>
          <p className="text-slate-500">{copy.description}</p>
        </div>

        {copy.buttonLabel ? (
          <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1e3b8a] px-6 font-bold text-white shadow-lg shadow-[#1e3b8a]/20 transition-all hover:bg-[#1e3b8a]/90 active:scale-95">
            <span className="material-symbols-outlined">person_add</span>
            <span>{copy.buttonLabel}</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <span className="material-symbols-outlined">male</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Laki-laki</p>
            <p className="text-2xl font-bold">{stats.male}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <span className="material-symbols-outlined">female</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Perempuan</p>
            <p className="text-2xl font-bold">{stats.female}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#1e3b8a]"
              placeholder="Cari berdasarkan NISN atau Nama Siswa..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-2">
            <select className="rounded-lg border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-[#1e3b8a]">
              <option>Semua Kelas</option>
              <option>X-A</option>
              <option>X-B</option>
              <option>X-C</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 text-slate-600 transition-colors hover:bg-slate-50">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span className="text-sm font-semibold">Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Jenis Kelamin</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {hasData ? (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="group transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-slate-500">
                      {student.nisn}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${student.accentClassName}`}
                        >
                          {student.initials}
                        </div>
                        <span className="text-sm font-bold">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {student.classroomName}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">{student.genderLabel}</td>
                    <td className="px-6 py-5 text-right">
                      {canManageStudents ? (
                        <div className="flex items-center justify-end gap-2">
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-[#1e3b8a]/10 hover:text-[#1e3b8a]">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-600">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Read only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    Belum ada data siswa yang dapat ditampilkan untuk akun ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-6">
          <p className="text-sm font-medium text-slate-500">
            Menampilkan {hasData ? `1-${students.length}` : "0"} dari {stats.total} siswa
          </p>

          <div className="flex items-center gap-1">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="h-9 w-9 rounded-lg bg-[#1e3b8a] text-sm font-bold text-white">1</button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
