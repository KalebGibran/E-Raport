import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AutoSubmitFilterForm } from "@/components/filters/AutoSubmitFilterForm";
import { getStudentLearningPageData } from "@/lib/student-progress/service";

type StudentLearningPageProps = {
  searchParams: Promise<{
    period_id?: string;
    subject_id?: string;
  }>;
};

function formatIdDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function scorePredikat(score: number | null) {
  if (score == null) return null;
  if (score >= 90) return { label: "A", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (score >= 80) return { label: "B", className: "border-blue-200 bg-blue-50 text-blue-700" };
  if (score >= 70) return { label: "C", className: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "D", className: "border-red-200 bg-red-50 text-red-700" };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentLearningPage({ searchParams }: StudentLearningPageProps) {
  const params = await searchParams;
  const data = await getStudentLearningPageData({
    periodId: params.period_id,
    subjectId: params.subject_id,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Riwayat Nilai Saya"
        description="Lihat nilai harian, UTS, dan UAS pada semester yang dipilih."
      />

      <AdminFormCard title="Filter Riwayat Nilai" description="Pilih periode dan mapel untuk memfilter data.">
        <form id="student-learning-filter-form" action="/dashboard/learning" className="grid gap-4 md:grid-cols-[1.4fr_1.4fr_auto]">
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

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Mapel</span>
            <select
              name="subject_id"
              defaultValue={data.selectedSubjectId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Semua mapel</option>
              {data.subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.label}
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
        <AutoSubmitFilterForm formId="student-learning-filter-form" />

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

      <AdminDataTable
        columns={[
          { key: "subject", label: "Mapel" },
          { key: "daily", label: "Harian", align: "right" },
          { key: "uts", label: "UTS", align: "right" },
          { key: "uas", label: "UAS", align: "right" },
          { key: "overall", label: "Rata-rata", align: "right" },
          { key: "predikat", label: "Predikat", align: "right" },
        ]}
        hasRows={data.subjectRows.length > 0}
        emptyMessage="Belum ada nilai pada filter ini."
      >
        {data.subjectRows.map((row) => (
          <tr key={row.subjectId}>
            <td className="px-4 py-3 text-sm">
              {row.subjectName}
              <span className="ml-2 text-xs text-slate-500">({row.subjectCode})</span>
            </td>
            <td className="px-4 py-3 text-right text-sm">{row.dailyAverage ?? "-"}</td>
            <td className="px-4 py-3 text-right text-sm">{row.utsScore ?? "-"}</td>
            <td className="px-4 py-3 text-right text-sm">{row.uasScore ?? "-"}</td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-[#1e3b8a]">
              {row.overallAverage ?? "-"}
            </td>
            <td className="px-4 py-3 text-right text-sm">
              {(() => {
                const predikat = scorePredikat(row.overallAverage);
                return predikat ? (
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${predikat.className}`}>
                    {predikat.label}
                  </span>
                ) : (
                  "-"
                );
              })()}
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <AdminFormCard title="Riwayat Task Harian" description="Nilai tugas harian berdasarkan tanggal input.">
        <AdminDataTable
          columns={[
            { key: "date", label: "Tanggal" },
            { key: "subject", label: "Mapel" },
            { key: "task", label: "Task" },
            { key: "score", label: "Nilai", align: "right" },
            { key: "notes", label: "Catatan" },
          ]}
          hasRows={data.dailyTaskRows.length > 0}
          emptyMessage="Belum ada nilai tugas harian."
        >
          {data.dailyTaskRows.map((task) => (
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
              <td className="px-4 py-3 text-sm text-slate-600">{task.notes || "-"}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminFormCard>
    </div>
  );
}
