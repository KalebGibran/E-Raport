import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { AutoSubmitFilterForm } from "@/components/filters/AutoSubmitFilterForm";
import { saveReportValidationAction } from "@/app/dashboard/_actions/reportValidation";
import { getReportValidationPageData } from "@/lib/report-validation/service";

type ValidationPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    assignment_id?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readinessBadgeClass(label: "Siap" | "Perlu dilengkapi" | "Belum siap") {
  if (label === "Siap") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (label === "Perlu dilengkapi") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border border-rose-200 bg-rose-50 text-rose-700";
}

function statusLabel(status: "draft" | "pending_approval" | "approved" | "published") {
  if (status === "draft") return "Draft";
  if (status === "pending_approval") return "Menunggu";
  if (status === "approved") return "Approved";
  return "Published";
}

export default async function ValidationPage({ searchParams }: ValidationPageProps) {
  const params = await searchParams;
  const data = await getReportValidationPageData(params.assignment_id);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Validasi Raport Wali Kelas"
        description="Wali kelas dapat memberi catatan dan memvalidasi kesiapan raport per siswa."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Pilih Kelas Wali" description="Pilih assignment wali kelas untuk menampilkan siswa.">
        {data.assignments.length ? (
          <>
            <form id="guru-validation-filter-form" action="/dashboard/validation" className="grid gap-4 md:grid-cols-[2fr_auto]">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Kelas - Periode</span>
                <select
                  name="assignment_id"
                  defaultValue={data.selectedAssignmentId ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {data.assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tampilkan
                </button>
              </div>
            </form>
            <AutoSubmitFilterForm formId="guru-validation-filter-form" />
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Belum ada assignment wali kelas untuk akun guru ini. Minta admin menetapkan wali kelas di menu Master Wali Kelas.
          </p>
        )}

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Guru:</span> {data.teacherName ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Kelas:</span> {data.selectedClassroomName ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Periode:</span> {data.selectedPeriodLabel ?? "-"}
          </p>
        </div>
      </AdminFormCard>

      <AdminFormCard
        title="Validasi Per Siswa"
        description="Status `approved` hanya bisa disimpan jika data absensi, harian, UTS, dan UAS siswa sudah lengkap."
      >
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Siswa</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Kesiapan</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Status Raport</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Catatan Wali Kelas</th>
                <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.rows.length ? (
                data.rows.map((row) => {
                  const formId = `validation-form-${row.enrollmentId}`;

                  return (
                  <tr key={row.enrollmentId}>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                      {row.studentName}
                      {row.nis ? <span className="ml-1 text-xs font-medium text-slate-500">(NIS {row.nis})</span> : null}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${readinessBadgeClass(row.readinessLabel)}`}>
                        {row.readinessPercent}% · {row.readinessLabel}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.missingItems.length ? row.missingItems.join(", ") : "Data lengkap"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <select
                        form={formId}
                        name="status"
                        defaultValue={row.reportStatus === "published" ? "approved" : row.reportStatus}
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500">Status saat ini: {statusLabel(row.reportStatus)}</p>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <textarea
                        form={formId}
                        name="homeroom_notes"
                        defaultValue={row.homeroomNotes}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Catatan perkembangan siswa..."
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <form id={formId} action={saveReportValidationAction}>
                        <input type="hidden" name="assignment_id" value={data.selectedAssignmentId ?? ""} />
                        <input type="hidden" name="enrollment_id" value={row.enrollmentId} />
                        <button
                          type="submit"
                          className="rounded-md bg-[#1e3b8a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          Simpan
                        </button>
                      </form>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">
                    Tidak ada siswa di kelas/periode wali kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminFormCard>
    </div>
  );
}
