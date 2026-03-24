import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import {
  createEnrollmentAction,
  deleteEnrollmentAction,
} from "@/app/dashboard/_actions/adminCrud";
import { getEnrollmentOptions, listEnrollments } from "@/lib/admin/enrollments";

type EnrollmentsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EnrollmentsPage({ searchParams }: EnrollmentsPageProps) {
  const params = await searchParams;
  const [enrollments, options] = await Promise.all([listEnrollments(), getEnrollmentOptions()]);
  const enrollmentByStudent = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      nis: string | null;
      history: typeof enrollments;
    }
  >();

  for (const enrollment of enrollments) {
    const existing = enrollmentByStudent.get(enrollment.studentId);
    if (existing) {
      existing.history.push(enrollment);
      continue;
    }

    enrollmentByStudent.set(enrollment.studentId, {
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      nis: enrollment.nis,
      history: [enrollment],
    });
  }

  const studentEnrollmentGroups = Array.from(enrollmentByStudent.values())
    .map((group) => {
      const history = [...group.history].sort((a, b) => {
        const aKey = a.periodStartDate ?? a.enrolledAt;
        const bKey = b.periodStartDate ?? b.enrolledAt;
        return bKey.localeCompare(aKey);
      });
      return {
        ...group,
        history,
        latest: history[0] ?? null,
      };
    })
    .sort((a, b) => {
      const aKey = a.latest ? a.latest.periodStartDate ?? a.latest.enrolledAt : "";
      const bKey = b.latest ? b.latest.periodStartDate ?? b.latest.enrolledAt : "";
      if (aKey !== bKey) return bKey.localeCompare(aKey);
      return a.studentName.localeCompare(b.studentName);
    });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Enrollment Management"
        description="Tetapkan siswa ke kelas dan periode akademik. Data ini dipakai oleh sistem promotion."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Enrollment adalah snapshot posisi siswa per periode akademik. Saat promote, sistem menambah enrollment baru
        dan tetap menyimpan histori enrollment sebelumnya.
      </div>

      <AdminFormCard
        title="Tambah Enrollment"
        description="Satu siswa hanya boleh punya satu enrollment per periode."
      >
        <form action={createEnrollmentAction} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Siswa</span>
            <select name="student_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Pilih siswa</option>
              {options.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
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

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Simpan Enrollment
            </button>
          </div>
        </form>
      </AdminFormCard>

      <AdminDataTable
        columns={[
          { key: "student", label: "Siswa" },
          { key: "classroom", label: "Kelas Saat Ini" },
          { key: "period", label: "Periode Terbaru" },
          { key: "status", label: "Status" },
          { key: "history", label: "Jumlah Histori", align: "right" },
        ]}
        hasRows={studentEnrollmentGroups.length > 0}
        emptyMessage="Belum ada data enrollment."
      >
        {studentEnrollmentGroups.map((group) => {
          const latest = group.latest;
          if (!latest) return null;

          return (
            <tr key={group.studentId}>
              <td className="px-4 py-3 text-sm">
                {group.studentName}
                {group.nis ? <span className="ml-2 text-xs text-slate-500">({group.nis})</span> : null}
              </td>
              <td className="px-4 py-3 text-sm">{latest.classroomName}</td>
              <td className="px-4 py-3 text-sm">
                {latest.periodName}
                {latest.semester ? (
                  <span className="ml-2 text-xs text-slate-500">(Semester {latest.semester})</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-sm capitalize">{latest.status}</td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{group.history.length}</td>
            </tr>
          );
        })}
      </AdminDataTable>

      <AdminFormCard
        title="Riwayat Enrollment"
        description="Lihat histori lengkap per siswa. Histori lama dipertahankan untuk jejak nilai dan absensi tiap semester."
      >
        <div className="space-y-3">
          {studentEnrollmentGroups.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada histori enrollment.</p>
          ) : (
            studentEnrollmentGroups.map((group) => (
              <details key={`history-${group.studentId}`} className="rounded-lg border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800">
                    {group.studentName}
                    {group.nis ? <span className="ml-2 text-xs font-medium text-slate-500">({group.nis})</span> : null}
                  </div>
                  <span className="text-xs font-medium text-slate-500">{group.history.length} periode</span>
                </summary>
                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-2 py-2">Periode</th>
                          <th className="px-2 py-2">Kelas</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.history.map((enrollment) => (
                          <tr key={enrollment.id} className="border-t border-slate-100">
                            <td className="px-2 py-2">
                              {enrollment.periodName}
                              {enrollment.semester ? (
                                <span className="ml-2 text-xs text-slate-500">(Semester {enrollment.semester})</span>
                              ) : null}
                            </td>
                            <td className="px-2 py-2">{enrollment.classroomName}</td>
                            <td className="px-2 py-2 capitalize">{enrollment.status}</td>
                            <td className="px-2 py-2 text-right">
                              <form className="inline-flex">
                                <input type="hidden" name="enrollment_id" value={enrollment.id} />
                                <button
                                  formAction={deleteEnrollmentAction}
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
