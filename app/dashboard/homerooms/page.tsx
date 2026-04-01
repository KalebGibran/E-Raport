import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { AutoSubmitFilterForm } from "@/components/filters/AutoSubmitFilterForm";
import {
  createHomeroomAssignmentAction,
  deleteHomeroomAssignmentAction,
} from "@/app/dashboard/_actions/adminCrud";
import { getHomeroomOptions, listHomeroomAssignments } from "@/lib/admin/homerooms";

type HomeroomsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    period_id?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomeroomsPage({ searchParams }: HomeroomsPageProps) {
  const params = await searchParams;
  const options = await getHomeroomOptions();
  const selectedPeriodId =
    params.period_id && options.periods.some((period) => period.id === params.period_id)
      ? params.period_id
      : options.periods.find((period) => period.isCurrent)?.id ?? options.periods[0]?.id ?? "";
  const rows = await listHomeroomAssignments(selectedPeriodId || null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Master Wali Kelas"
        description="Tetapkan wali kelas per periode akademik. Satu kelas hanya boleh punya satu wali kelas per periode."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Filter Periode" description="Pilih periode untuk menampilkan assignment wali kelas.">
        <form id="admin-homerooms-filter-form" action="/dashboard/homerooms" className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Periode Akademik</span>
            <select
              name="period_id"
              defaultValue={selectedPeriodId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {options.periods.map((period) => (
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tampilkan
            </button>
          </div>
        </form>
        <AutoSubmitFilterForm formId="admin-homerooms-filter-form" />
      </AdminFormCard>

      <AdminFormCard title="Set Wali Kelas" description="Pilih guru, kelas, dan periode lalu simpan assignment.">
        <form action={createHomeroomAssignmentAction} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Guru</span>
            <select name="teacher_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Pilih guru</option>
              {options.teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kelas</span>
            <select name="classroom_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Pilih kelas</option>
              {options.classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Periode Akademik</span>
            <select
              name="academic_period_id"
              required
              defaultValue={selectedPeriodId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Pilih periode</option>
              {options.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                  {period.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Wali Kelas
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "teacher", label: "Guru" },
          { key: "classroom", label: "Kelas" },
          { key: "period", label: "Periode" },
          { key: "action", label: "Aksi", align: "right" },
        ]}
        hasRows={rows.length > 0}
        emptyMessage="Belum ada assignment wali kelas untuk periode ini."
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {row.teacherName}
              {row.teacherCode ? <span className="ml-2 text-xs text-slate-500">({row.teacherCode})</span> : null}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.classroomName}</td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {row.periodName}
              <span className="ml-2 text-xs text-slate-500">(Semester {row.semester})</span>
            </td>
            <td className="px-4 py-3 text-right">
              <form className="inline-flex">
                <input type="hidden" name="assignment_id" value={row.id} />
                <button
                  formAction={deleteHomeroomAssignmentAction}
                  className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Hapus
                </button>
              </form>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
