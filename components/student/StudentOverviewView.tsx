import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AutoSubmitFilterForm } from "@/components/filters/AutoSubmitFilterForm";
import { StudentOverviewData } from "@/lib/student-progress/service";

type StudentOverviewViewProps = {
  data: StudentOverviewData;
};

function formatIdDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function formatInputDateTime(dateValue: string) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString("id-ID");
}

function clampPercent(value: number | null) {
  if (value == null) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function scorePredikat(score: number | null) {
  if (score == null) return null;
  if (score >= 90) return { label: "A", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (score >= 80) return { label: "B", className: "border-blue-200 bg-blue-50 text-blue-700" };
  if (score >= 70) return { label: "C", className: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "D", className: "border-red-200 bg-red-50 text-red-700" };
}

function statusBadgeClass(status: string) {
  if (status === "Hadir") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Sakit") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Izin") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export function StudentOverviewView({ data }: StudentOverviewViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Capaian Belajar Saya"
        description="Pantau progres nilai dan kehadiran Anda pada periode yang dipilih."
      />

      <AdminFormCard title="Periode Akademik" description="Pilih semester untuk melihat riwayat progres.">
        <form id="student-overview-filter-form" action="/dashboard" className="grid gap-4 md:grid-cols-[2fr_auto]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Periode</span>
            <select
              name="period_id"
              defaultValue={data.selectedPeriodId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {data.periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                  {period.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Terapkan
            </button>
          </div>
        </form>
        <AutoSubmitFilterForm formId="student-overview-filter-form" />

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Siswa:</span> {data.studentName}
            {data.nis ? <span className="ml-2 text-xs text-slate-500">(NIS {data.nis})</span> : null}
          </p>
          <p>
            <span className="font-semibold">Periode:</span> {data.selectedPeriodLabel ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Kelas:</span> {data.currentClassroomName ?? "-"}
          </p>
        </div>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Nilai</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h3 className="text-3xl font-black text-[#1e3b8a]">{data.scores.overallAverage}</h3>
            {(() => {
              const predikat = scorePredikat(data.scores.overallAverage);
              return predikat ? (
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${predikat.className}`}>
                  Predikat {predikat.label}
                </span>
              ) : null;
            })()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kehadiran</p>
          <h3 className="mt-2 text-3xl font-black text-emerald-600">{data.attendance.attendanceRate}%</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Harian Dinilai</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.scores.totalDailyTasks}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Entri UTS/UAS</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.scores.totalExamEntries}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminFormCard title="Progress per Mapel" description="Rata-rata per mapel pada periode ini (gabungan harian + UTS/UAS).">
          {data.subjectRows.length ? (
            <div className="space-y-3">
              {data.subjectRows.map((subject) => (
                <div key={subject.subjectId}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {subject.subjectName} ({subject.subjectCode})
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{subject.overallAverage ?? "-"}</span>
                      {(() => {
                        const predikat = scorePredikat(subject.overallAverage);
                        return predikat ? (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${predikat.className}`}>
                            {predikat.label}
                          </span>
                        ) : null;
                      })()}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-[#1e3b8a]"
                      style={{ width: `${clampPercent(subject.overallAverage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
              <p className="text-sm font-semibold text-slate-700">Belum ada nilai</p>
              <p className="mt-1 text-sm text-slate-500">Nilai akan muncul setelah guru input tugas harian atau UTS/UAS.</p>
            </div>
          )}
        </AdminFormCard>

        <AdminFormCard title="Insight Cepat" description="Ringkasan poin penting pada periode yang dipilih.">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Nilai harian rata-rata: <span className="font-semibold">{data.scores.averageDaily}</span>
            </p>
            <p>
              Nilai UTS/UAS rata-rata: <span className="font-semibold">{data.scores.averageExam}</span>
            </p>
            <p>
              Mapel tertinggi: <span className="font-semibold">{data.scores.bestSubject ?? "-"}</span>
            </p>
            <p>
              Mapel perlu perhatian: <span className="font-semibold">{data.scores.lowestSubject ?? "-"}</span>
            </p>
            <p>
              Rekap absensi: H {data.attendance.present} | S {data.attendance.sick} | I {data.attendance.permission} | A{" "}
              {data.attendance.absent}
            </p>
          </div>
        </AdminFormCard>
      </div>

      <AdminFormCard title="Riwayat Task Harian Terbaru" description="Menampilkan tugas terbaru yang sudah dinilai.">
        <AdminDataTable
          columns={[
            { key: "date", label: "Tanggal" },
            { key: "subject", label: "Mapel" },
            { key: "task", label: "Task" },
            { key: "score", label: "Nilai", align: "right" },
          ]}
          hasRows={data.recentDailyTasks.length > 0}
          emptyMessage="Belum ada data nilai harian."
        >
          {data.recentDailyTasks.map((task) => (
            <tr key={task.scoreId}>
              <td className="px-4 py-3 text-sm">{formatIdDate(task.date)}</td>
              <td className="px-4 py-3 text-sm">
                {task.subjectName}
                <span className="ml-2 text-xs text-slate-500">({task.subjectCode})</span>
              </td>
              <td className="px-4 py-3 text-sm">
                <p className="font-semibold text-slate-800">{task.taskLabel}</p>
                <p className="text-xs text-slate-500">{task.taskTitle}</p>
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-[#1e3b8a]">{task.score}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminFormCard>

      <AdminFormCard title="Riwayat Absensi Terbaru" description="Snapshot absensi terbaru pada periode ini.">
        <AdminDataTable
          columns={[
            { key: "date", label: "Tanggal" },
            { key: "status", label: "Status" },
            { key: "teacher", label: "Guru Penginput" },
            { key: "input", label: "Waktu Input" },
          ]}
          hasRows={data.recentAttendance.length > 0}
          emptyMessage="Belum ada data absensi."
        >
          {data.recentAttendance.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 text-sm">{formatIdDate(row.date)}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`rounded border px-2 py-1 text-xs font-semibold ${statusBadgeClass(row.statusLabel)}`}>
                  {row.statusLabel}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{row.teacherName}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatInputDateTime(row.inputAt)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminFormCard>
    </div>
  );
}
