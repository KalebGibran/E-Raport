import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecapFiltersForm } from "@/components/recap/RecapFiltersForm";
import { RecapData } from "@/lib/recap/service";

type RecapViewProps = {
  data: RecapData;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string | null) {
  if (!status) return "Belum dibuat";
  if (status === "draft") return "Draft";
  if (status === "published") return "Dipublish";
  if (status === "approved") return "Disetujui";
  return status;
}

function cardTitle(role: RecapData["role"]) {
  return role === "admin" ? "Rekap Hasil Belajar Siswa" : "Hasil Belajar Saya";
}

function readinessBadgeClass(label: "Siap" | "Perlu dilengkapi" | "Belum siap") {
  if (label === "Siap") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (label === "Perlu dilengkapi") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border border-rose-200 bg-rose-50 text-rose-700";
}

function completionBadge(done: boolean) {
  if (done) {
    return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700";
  }
  return "inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700";
}

export function RecapView({ data }: RecapViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title={cardTitle(data.role)}
        description="Ringkasan nilai dan kehadiran untuk persiapan engine raport."
      />

      <AdminFormCard title="Filter Rekap" description="Gunakan filter untuk melihat data siswa yang dituju.">
        <RecapFiltersForm
          role={data.role}
          periodOptions={data.periodOptions}
          classroomOptions={data.classroomOptions}
          studentOptions={data.studentOptions}
          selectedPeriodId={data.selectedPeriodId}
          selectedClassroomId={data.selectedClassroomId}
          selectedStudentId={data.selectedStudentId}
        />

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Siswa:</span> {data.studentName ?? "-"}
            {data.studentNis ? <span className="ml-2 text-xs text-slate-500">(NIS {data.studentNis})</span> : null}
          </p>
          <p>
            <span className="font-semibold">Kelas:</span> {data.studentClassroomName ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Periode:</span> {data.selectedPeriodLabel ?? "-"}
          </p>
        </div>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rata-rata Nilai</p>
            <p className="text-2xl font-bold">{data.cards.averageScore}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined text-3xl">event_available</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Kehadiran</p>
            <p className="text-2xl font-bold">{data.cards.attendancePercent}%</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <span className="material-symbols-outlined text-3xl">leaderboard</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Peringkat Kelas</p>
            <p className="text-2xl font-bold">
              {data.cards.classRank ?? "-"}{" "}
              <span className="text-sm font-normal text-slate-400">dari {data.cards.classSize}</span>
            </p>
          </div>
        </div>
      </div>

      {data.role === "admin" && data.readinessSummary ? (
        <AdminFormCard
          title="Raport Readiness Board"
          description="Pantau kelengkapan data absensi, harian, UTS, dan UAS sebelum validasi raport."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Siswa</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{data.readinessSummary.totalStudents}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase text-emerald-700">Siap Validasi</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{data.readinessSummary.readyStudents}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase text-rose-700">Perlu Tindak Lanjut</p>
              <p className="mt-1 text-2xl font-bold text-rose-800">{data.readinessSummary.notReadyStudents}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase text-blue-700">Rata-rata Kesiapan</p>
              <p className="mt-1 text-2xl font-bold text-blue-800">{data.readinessSummary.avgReadinessPercent}%</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <p className="text-xs text-slate-600">
              Data absensi kurang:{" "}
              <span className="font-semibold text-slate-800">{data.readinessSummary.missingAttendance}</span>
            </p>
            <p className="text-xs text-slate-600">
              Harian belum lengkap:{" "}
              <span className="font-semibold text-slate-800">{data.readinessSummary.missingDaily}</span>
            </p>
            <p className="text-xs text-slate-600">
              UTS belum lengkap: <span className="font-semibold text-slate-800">{data.readinessSummary.missingUts}</span>
            </p>
            <p className="text-xs text-slate-600">
              UAS belum lengkap: <span className="font-semibold text-slate-800">{data.readinessSummary.missingUas}</span>
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Siswa</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Absensi</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Harian</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">UTS</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">UAS</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">Kesiapan</th>
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Status Raport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.readinessRows.length ? (
                  data.readinessRows.map((row) => (
                    <tr key={row.enrollmentId}>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-800">
                        {row.studentName}
                        {row.studentNis ? (
                          <span className="ml-1 text-xs font-medium text-slate-500">(NIS {row.studentNis})</span>
                        ) : null}
                        {row.missingItems.length ? (
                          <p className="mt-1 text-xs font-normal text-rose-700">{row.missingItems.join(", ")}</p>
                        ) : (
                          <p className="mt-1 text-xs font-normal text-emerald-700">Siap lanjut validasi</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={completionBadge(row.attendanceReady)}>{row.attendanceReady ? "OK" : "-"}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={completionBadge(row.dailyReady)}>{row.dailyReady ? "OK" : "-"}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={completionBadge(row.utsReady)}>{row.utsReady ? "OK" : "-"}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={completionBadge(row.uasReady)}>{row.uasReady ? "OK" : "-"}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${readinessBadgeClass(row.readinessLabel)}`}>
                          {row.readinessPercent}% · {row.readinessLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">{statusLabel(row.reportStatus)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                      Belum ada data siswa pada filter periode/kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminFormCard>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold">Hasil Belajar</h3>
          <button
            disabled
            className="flex items-center gap-2 rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-bold text-white opacity-60"
            title="Engine PDF raport menyusul"
          >
            <span className="material-symbols-outlined text-xl">print</span>
            Cetak Raport Digital
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Mata Pelajaran</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Absensi</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">UH</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">UTS</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">UAS</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Akhir</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.subjectId}>
                    <td className="px-6 py-4 text-sm font-semibold">{row.subjectName}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{row.attendancePercent}%</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{row.dailyAverage ?? "-"}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{row.utsScore ?? "-"}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">{row.uasScore ?? "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block rounded-lg bg-[#1e3b8a]/10 px-3 py-1 text-sm font-bold text-[#1e3b8a]">
                        {row.finalScore ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-[#1e3b8a]">
                        {row.predicate}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Belum ada data nilai untuk siswa/periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminFormCard title="Catatan Wali Kelas">
          <div className="rounded-r-lg border-l-4 border-[#1e3b8a] bg-[#1e3b8a]/5 p-4">
            <p className="text-sm italic text-slate-700">
              {data.homeroomNote ??
                "Belum ada catatan wali kelas pada periode ini. Catatan akan muncul setelah proses validasi raport berjalan."}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-500">
                Wali Kelas: {data.homeroomTeacherName ?? "-"}
              </p>
              <span className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                {statusLabel(data.reportStatus)}
              </span>
            </div>
          </div>
        </AdminFormCard>

        <AdminFormCard title="Informasi Raport">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500">
                Rekap ini menjadi fondasi sebelum engine raport akumulasi + publish + PDF diaktifkan.
              </p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Status:</span> {statusLabel(data.reportStatus)}
                </p>
                <p>
                  <span className="font-semibold">Tanggal Publish:</span> {formatDateTime(data.reportPublishedAt)}
                </p>
              </div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <span className="material-symbols-outlined text-4xl text-slate-300">qr_code_2</span>
            </div>
          </div>
        </AdminFormCard>
      </div>
    </div>
  );
}
