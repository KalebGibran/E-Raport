import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createTeacherAction,
  deleteTeacherAction,
  updateTeacherAction,
} from "@/app/dashboard/_actions/adminCrud";
import { listTeachers } from "@/lib/admin/teachers";

type TeachersPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams;
  const teachers = await listTeachers();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Data Guru"
        description="Kelola data guru untuk assignment mapel, input nilai, dan absensi."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Tambah Guru" description="Membuat akun guru beserta record data guru.">
        <form action={createTeacherAction} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kode Guru</span>
            <input
              name="teacher_code"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nama Lengkap</span>
            <input name="full_name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Guru
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "teacher_code", label: "Kode Guru" },
          { key: "full_name", label: "Nama Lengkap" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={teachers.length > 0}
        emptyMessage="Belum ada data guru."
      >
        {teachers.map((teacher) => (
          <tr key={teacher.id}>
            <td className="px-4 py-3">
              <input
                form={`teacher-form-${teacher.id}`}
                name="teacher_code"
                defaultValue={teacher.teacher_code ?? ""}
                className="w-48 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`teacher-form-${teacher.id}`}
                name="full_name"
                defaultValue={teacher.full_name}
                className="w-64 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3 text-right">
              <form id={`teacher-form-${teacher.id}`} className="inline-flex items-center gap-2">
                <input type="hidden" name="teacher_id" value={teacher.id} />
                <button
                  formAction={updateTeacherAction}
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Update
                </button>
                <button
                  formAction={deleteTeacherAction}
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

