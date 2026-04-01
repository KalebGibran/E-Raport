import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
        <form action="/dashboard" className="grid gap-4 md:grid-cols-[2fr_auto]">
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
          <h3 className="mt-2 text-3xl font-black text-[#1e3b8a]">{data.scores.overallAverage}</h3>
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
        <AdminFormCard title="Progress per Mapel" description="Rata-rata keseluruhan mapel pada periode ini.">
          {data.subjectRows.length ? (
            <div className="space-y-3">
              {data.subjectRows.map((subject) => (
                <div key={subject.subjectId}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {subject.subjectName} ({subject.subjectCode})
                    </span>
                    <span className="font-semibold">{subject.overallAverage ?? "-"}</span>
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
            <p className="text-sm text-slate-500">Belum ada nilai pada periode ini.</p>
          )}
        </AdminFormCard>

        <AdminFormCard title="Insight Cepat" description="Ringkasan poin penting yang bisa dipantau.">
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

