import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createAcademicPeriodAction,
  setCurrentAcademicPeriodAction,
  updateAcademicPeriodAction,
} from "@/app/dashboard/_actions/adminCrud";
import { AcademicPeriodCreateForm } from "@/components/admin/AcademicPeriodCreateForm";
import { getAcademicYearOptions, listAcademicPeriods } from "@/lib/admin/periods";

type PeriodsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PeriodsPage({ searchParams }: PeriodsPageProps) {
  const params = await searchParams;
  const [periods, academicYears] = await Promise.all([listAcademicPeriods(), getAcademicYearOptions()]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Periode Akademik"
        description="Kelola semester/periode akademik dan tentukan satu periode current."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard
        title="Tambah Periode Akademik"
        description="Pastikan tanggal dan semester benar agar enrollment & promotion konsisten."
      >
        <AcademicPeriodCreateForm academicYears={academicYears} action={createAcademicPeriodAction} />
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "academic_year", label: "Tahun Ajaran" },
          { key: "semester", label: "Semester" },
          { key: "period_name", label: "Nama Periode" },
          { key: "date_range", label: "Rentang" },
          { key: "status", label: "Status" },
          { key: "current", label: "Current" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={periods.length > 0}
        emptyMessage="Belum ada data periode akademik."
      >
        {periods.map((period) => (
          <tr key={period.id}>
            <td className="px-4 py-3">
              <select
                form={`period-form-${period.id}`}
                name="academic_year_id"
                defaultValue={period.academicYearId}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-4 py-3">
              <select
                form={`period-form-${period.id}`}
                name="semester"
                defaultValue={period.semester}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </td>
            <td className="px-4 py-3">
              <input
                form={`period-form-${period.id}`}
                name="period_name"
                defaultValue={period.periodName}
                className="w-56 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <div className="space-y-1">
                <input
                  form={`period-form-${period.id}`}
                  name="start_date"
                  type="date"
                  defaultValue={period.startDate}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                <input
                  form={`period-form-${period.id}`}
                  name="end_date"
                  type="date"
                  defaultValue={period.endDate}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
            </td>
            <td className="px-4 py-3">
              <select
                form={`period-form-${period.id}`}
                name="status"
                defaultValue={period.status}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="planned">planned</option>
                <option value="active">active</option>
                <option value="closed">closed</option>
              </select>
            </td>
            <td className="px-4 py-3 text-sm">{period.isCurrent ? "Ya" : "Tidak"}</td>
            <td className="px-4 py-3 text-right">
              <form id={`period-form-${period.id}`} className="inline-flex items-center gap-2">
                <input type="hidden" name="period_id" value={period.id} />
                <input type="hidden" name="is_current" value={period.isCurrent ? "1" : "0"} />
                <button
                  formAction={updateAcademicPeriodAction}
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Update
                </button>
                <button
                  formAction={setCurrentAcademicPeriodAction}
                  className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Set Current
                </button>
              </form>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
