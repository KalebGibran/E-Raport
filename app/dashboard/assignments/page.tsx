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

function parseClassroomSortValue(classroomName: string) {
  const normalized = classroomName.trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^(\d+)([A-Z].*)?$/);
  if (!match) {
    return {
      grade: Number.POSITIVE_INFINITY,
      section: normalized,
    };
  }

  return {
    grade: Number(match[1]),
    section: match[2] ?? "",
  };
}

function compareClassroomName(a: string, b: string) {
  const aKey = parseClassroomSortValue(a);
  const bKey = parseClassroomSortValue(b);

  if (aKey.grade !== bKey.grade) {
    return aKey.grade - bKey.grade;
  }

  return aKey.section.localeCompare(bKey.section);
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const [assignments, options] = await Promise.all([listAssignments(), getAssignmentOptions()]);
  const classroomOptions = [...options.classrooms].sort((a, b) => compareClassroomName(a.label, b.label));

  const assignmentGroups = Array.from(
    assignments.reduce(
      (accumulator, assignment) => {
        const teacherKey = `${assignment.teacherId}:${assignment.teacherCode ?? "-"}`;
        const existing = accumulator.get(teacherKey);

        if (existing) {
          existing.rows.push(assignment);
          return accumulator;
        }

        accumulator.set(teacherKey, {
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          teacherCode: assignment.teacherCode,
          rows: [assignment],
        });
        return accumulator;
      },
      new Map<
        string,
        {
          teacherId: string;
          teacherName: string;
          teacherCode: string | null;
          rows: typeof assignments;
        }
      >()
    )
  )
    .map(([, group]) => {
      const rows = [...group.rows].sort((a, b) => {
        const classroomOrder = compareClassroomName(a.classroomName, b.classroomName);
        if (classroomOrder !== 0) return classroomOrder;
        return a.subjectName.localeCompare(b.subjectName);
      });

      return {
        ...group,
        rows,
      };
    })
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

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
              {classroomOptions.map((classroom) => (
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
          { key: "count", label: "Jumlah Assignment", align: "right" },
        ]}
        hasRows={assignmentGroups.length > 0}
        emptyMessage="Belum ada assignment guru-mapel."
      >
        {assignmentGroups.map((group) => (
          <tr key={`summary-${group.teacherId}`}>
            <td className="px-4 py-3 text-sm font-semibold text-slate-900">
              {group.teacherName}
              {group.teacherCode ? (
                <span className="ml-2 text-xs font-medium text-slate-500">({group.teacherCode})</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{group.rows.length}</td>
          </tr>
        ))}
      </AdminDataTable>

      <AdminFormCard
        title="Detail Assignment Per Guru"
        description="Klik nama guru untuk melihat mapel yang dipegang per kelas. Urutan kelas disusun dari tingkat rendah ke tinggi."
      >
        <div className="space-y-3">
          {assignmentGroups.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada detail assignment.</p>
          ) : (
            assignmentGroups.map((group) => (
              <details key={`group-${group.teacherId}`} className="rounded-lg border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800">
                    {group.teacherName}
                    {group.teacherCode ? (
                      <span className="ml-2 text-xs font-medium text-slate-500">({group.teacherCode})</span>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-slate-500">{group.rows.length} assignment</span>
                </summary>
                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-2 py-2">Kelas</th>
                          <th className="px-2 py-2">Mapel</th>
                          <th className="px-2 py-2">Periode</th>
                          <th className="px-2 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((assignment) => (
                          <tr key={assignment.id} className="border-t border-slate-100">
                            <td className="px-2 py-2">{assignment.classroomName}</td>
                            <td className="px-2 py-2">
                              {assignment.subjectName}
                              {assignment.subjectCode ? (
                                <span className="ml-2 text-xs text-slate-500">({assignment.subjectCode})</span>
                              ) : null}
                            </td>
                            <td className="px-2 py-2">
                              {assignment.periodName}
                              {assignment.semester ? (
                                <span className="ml-2 text-xs text-slate-500">(Semester {assignment.semester})</span>
                              ) : null}
                            </td>
                            <td className="px-2 py-2 text-right">
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
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>
      </AdminFormCard>
    </div>
  );
}
