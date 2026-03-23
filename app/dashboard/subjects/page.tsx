import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createSubjectAction,
  deactivateSubjectAction,
  updateSubjectAction,
} from "@/app/dashboard/_actions/adminCrud";
import { listSubjects } from "@/lib/admin/subjects";

type SubjectsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SubjectsPage({ searchParams }: SubjectsPageProps) {
  const params = await searchParams;
  const subjects = await listSubjects();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Mata Pelajaran"
        description="Kelola master data mapel. Pemilihan guru dilakukan pada menu assignment."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Tambah Mata Pelajaran" description="Buat master mapel baru.">
        <form action={createSubjectAction} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kode Mapel</span>
            <input
              name="subject_code"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nama Mapel</span>
            <input name="subject_name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" name="is_active" value="1" defaultChecked className="h-4 w-4" />
            <span className="text-sm text-slate-700">Mapel aktif</span>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Mapel
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "subject_code", label: "Kode" },
          { key: "subject_name", label: "Nama Mata Pelajaran" },
          { key: "is_active", label: "Aktif" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={subjects.length > 0}
        emptyMessage="Belum ada data mata pelajaran."
      >
        {subjects.map((subject) => (
          <tr key={subject.id}>
            <td className="px-4 py-3">
              <input
                form={`subject-form-${subject.id}`}
                name="subject_code"
                defaultValue={subject.subject_code}
                className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3">
              <input
                form={`subject-form-${subject.id}`}
                name="subject_name"
                defaultValue={subject.subject_name}
                className="w-64 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="px-4 py-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  form={`subject-form-${subject.id}`}
                  type="checkbox"
                  name="is_active"
                  value="1"
                  defaultChecked={subject.is_active}
                />
                {subject.is_active ? "Ya" : "Tidak"}
              </label>
            </td>
            <td className="px-4 py-3 text-right">
              <form id={`subject-form-${subject.id}`} className="inline-flex items-center gap-2">
                <input type="hidden" name="subject_id" value={subject.id} />
                <button
                  formAction={updateSubjectAction}
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Update
                </button>
                <button
                  formAction={deactivateSubjectAction}
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

