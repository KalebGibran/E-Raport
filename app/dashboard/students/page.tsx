import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createStudentAction,
  deactivateStudentAction,
  updateStudentAction,
} from "@/app/dashboard/_actions/adminCrud";
import { listStudents } from "@/lib/admin/students";

type StudentsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const students = await listStudents();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Data Siswa"
        description="Kelola data siswa aktif/nonaktif. Kelas/periode di tabel diambil dari enrollment terbaru tiap siswa."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Tambah Siswa" description="Input data siswa baru.">
        <form action={createStudentAction} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">NIS</span>
            <input
              name="nis"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Contoh: 2400123"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">NISN</span>
            <input
              name="nisn"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Opsional"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Nama Lengkap</span>
            <input name="full_name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Gender</span>
            <select name="gender" className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">-</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tanggal Lahir</span>
            <input name="birth_date" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" name="is_active" value="1" defaultChecked className="h-4 w-4" />
            <span className="text-sm text-slate-700">Siswa aktif</span>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Siswa
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "nis", label: "NIS" },
          { key: "nisn", label: "NISN" },
          { key: "full_name", label: "Nama" },
          { key: "current_classroom", label: "Kelas Terbaru" },
          { key: "current_period", label: "Periode/Semester Terbaru" },
          { key: "gender", label: "Gender" },
          { key: "birth_date", label: "Tgl Lahir" },
          { key: "is_active", label: "Aktif" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={students.length > 0}
        emptyMessage="Belum ada data siswa."
      >
        {students.map((student) => (
          <tr key={student.id}>
            <td className="px-4 py-3">
              <input
                form={`student-form-${student.id}`}
                name="nis"
                defaultValue={student.nis ?? ""}
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`student-form-${student.id}`}
                name="nisn"
                defaultValue={student.nisn ?? ""}
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`student-form-${student.id}`}
                name="full_name"
                defaultValue={student.full_name}
                className="w-52 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3 text-sm font-medium text-slate-700">
              {student.current_classroom_name ?? "-"}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {student.current_period_name ? (
                <>
                  {student.current_period_name}
                  {student.current_semester ? (
                    <span className="ml-2 text-xs text-slate-500">(Semester {student.current_semester})</span>
                  ) : null}
                </>
              ) : (
                "-"
              )}
            </td>
            <td className="px-4 py-3">
              <select
                form={`student-form-${student.id}`}
                name="gender"
                defaultValue={student.gender ?? ""}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">-</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </td>
            <td className="px-4 py-3">
              <input
                form={`student-form-${student.id}`}
                name="birth_date"
                type="date"
                defaultValue={student.birth_date ?? ""}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  form={`student-form-${student.id}`}
                  type="checkbox"
                  name="is_active"
                  value="1"
                  defaultChecked={student.is_active}
                />
                {student.is_active ? "Ya" : "Tidak"}
              </label>
            </td>
            <td className="px-4 py-3 text-right">
              <form id={`student-form-${student.id}`} className="inline-flex items-center gap-2">
                <input type="hidden" name="student_id" value={student.id} />
                <button
                  formAction={updateStudentAction}
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Update
                </button>
                <button
                  formAction={deactivateStudentAction}
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
