import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createAssignmentAction,
  deleteAssignmentAction,
} from "@/app/dashboard/_actions/adminCrud";
import { getAssignmentOptions, listAssignments } from "@/lib/admin/assignments";

type AssignmentsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const [assignments, options] = await Promise.all([listAssignments(), getAssignmentOptions()]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Assignment Guru Mapel"
        description="Tetapkan guru untuk mapel, kelas, dan periode akademik tertentu."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Tambah Assignment" description="Semua dropdown menyimpan ID relasi.">
        <form action={createAssignmentAction} className="grid gap-4 md:grid-cols-2">
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
            <span className="text-sm font-medium text-slate-700">Mapel</span>
            <select name="subject_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Pilih mapel</option>
              {options.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.label}
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Pilih periode</option>
              {options.academicPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Assignment
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "teacher", label: "Guru" },
          { key: "subject", label: "Mapel" },
          { key: "classroom", label: "Kelas" },
          { key: "period", label: "Periode" },
          { key: "actions", label: "Aksi", align: "right" },
        ]}
        hasRows={assignments.length > 0}
        emptyMessage="Belum ada assignment guru-mapel."
      >
        {assignments.map((assignment) => (
          <tr key={assignment.id}>
            <td className="px-4 py-3 text-sm">
              {assignment.teacherName}
              {assignment.teacherCode ? (
                <span className="ml-2 text-xs text-slate-500">({assignment.teacherCode})</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-sm">
              {assignment.subjectName}
              {assignment.subjectCode ? (
                <span className="ml-2 text-xs text-slate-500">({assignment.subjectCode})</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-sm">{assignment.classroomName}</td>
            <td className="px-4 py-3 text-sm">
              {assignment.periodName}
              {assignment.semester ? (
                <span className="ml-2 text-xs text-slate-500">(Semester {assignment.semester})</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-right">
              <form className="inline-flex">
                <input type="hidden" name="assignment_id" value={assignment.id} />
                <button
                  formAction={deleteAssignmentAction}
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
