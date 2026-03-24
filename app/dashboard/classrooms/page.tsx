import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createClassroomAction,
  deactivateClassroomAction,
  updateClassroomAction,
} from "@/app/dashboard/_actions/adminCrud";
import { getClassroomOptions, listClassrooms } from "@/lib/admin/classrooms";

type ClassroomsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClassroomsPage({ searchParams }: ClassroomsPageProps) {
  const params = await searchParams;
  const [classrooms, options] = await Promise.all([listClassrooms(), getClassroomOptions()]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Data Kelas"
        description="Kelola kelas (contoh 4A, 4B) dan relasi next_classroom untuk promotion tahun berikutnya."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Tambah Kelas" description="Isi level, tingkat, rombel, dan kelas tujuan berikutnya.">
        <form action={createClassroomAction} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Level Sekolah</span>
            <select name="school_level" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="sd">SD</option>
              <option value="smp">SMP</option>
              <option value="sma">SMA</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tingkat</span>
            <input
              name="grade_level"
              type="number"
              min={1}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="4"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Rombel/Section</span>
            <input
              name="section"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="A"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nama Kelas</span>
            <input
              name="classroom_name"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="4A"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Next Classroom (opsional)</span>
            <select name="next_classroom_id" className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">-</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 md:col-span-3">
            <input type="checkbox" name="is_active" value="1" defaultChecked className="h-4 w-4" />
            <span className="text-sm text-slate-700">Kelas aktif</span>
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "school_level", label: "Level" },
          { key: "grade_level", label: "Tingkat" },
          { key: "section", label: "Section" },
          { key: "classroom_name", label: "Nama Kelas" },
          { key: "next_classroom", label: "Next Kelas" },
          { key: "is_active", label: "Aktif" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={classrooms.length > 0}
        emptyMessage="Belum ada data kelas."
      >
        {classrooms.map((classroom) => (
          <tr key={classroom.id}>
            <td className="px-4 py-3">
              <select
                form={`classroom-form-${classroom.id}`}
                name="school_level"
                defaultValue={classroom.school_level}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="sd">SD</option>
                <option value="smp">SMP</option>
                <option value="sma">SMA</option>
              </select>
            </td>
            <td className="px-4 py-3">
              <input
                form={`classroom-form-${classroom.id}`}
                name="grade_level"
                type="number"
                min={1}
                defaultValue={classroom.grade_level}
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`classroom-form-${classroom.id}`}
                name="section"
                defaultValue={classroom.section}
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`classroom-form-${classroom.id}`}
                name="classroom_name"
                defaultValue={classroom.classroom_name}
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <select
                form={`classroom-form-${classroom.id}`}
                name="next_classroom_id"
                defaultValue={classroom.next_classroom_id ?? ""}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">-</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{classroom.next_classroom_name ?? "-"}</p>
            </td>
            <td className="px-4 py-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  form={`classroom-form-${classroom.id}`}
                  type="checkbox"
                  name="is_active"
                  value="1"
                  defaultChecked={classroom.is_active}
                />
                {classroom.is_active ? "Ya" : "Tidak"}
              </label>
            </td>
            <td className="px-4 py-3 text-right">
              <form id={`classroom-form-${classroom.id}`} className="inline-flex items-center gap-2">
                <input type="hidden" name="classroom_id" value={classroom.id} />
                <button
                  formAction={updateClassroomAction}
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Update
                </button>
                <button
                  formAction={deactivateClassroomAction}
                  className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Nonaktifkan
                </button>
              </form>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
