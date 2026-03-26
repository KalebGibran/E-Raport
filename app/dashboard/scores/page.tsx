import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { submitExamScoresAction } from "@/app/dashboard/_actions/scores";
import { getScorePageData } from "@/lib/scores/service";

type ScoresPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    assignment_id?: string;
    score_type?: string;
    period_id?: string;
    classroom_id?: string;
    subject_id?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScoresPage({ searchParams }: ScoresPageProps) {
  const params = await searchParams;
  const data = await getScorePageData({
    assignmentId: params.assignment_id,
    scoreType: params.score_type,
    periodId: params.period_id,
    classroomId: params.classroom_id,
    subjectId: params.subject_id,
  });

  if (data.role === "guru") {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
        <AdminPageHeader
          title="Nilai UTS/UAS"
          description="Input nilai per kelas-mapel assignment guru pada periode current."
        />

        <AdminStatusNotice status={params.status} message={params.message} />

        <AdminFormCard title="Periode Input" description="Guru hanya bisa input nilai pada periode current.">
          {data.currentPeriod ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Periode:</span> {data.currentPeriod.periodName}
              </p>
              <p>
                <span className="font-semibold">Rentang:</span> {data.currentPeriod.startDate} s/d {data.currentPeriod.endDate}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-700">Belum ada academic period dengan `is_current = true`.</p>
          )}
        </AdminFormCard>

        <AdminFormCard title="Filter Input Nilai" description="Pilih kelas, mapel, dan tipe nilai untuk mulai input.">
          <form action="/dashboard/scores" className="grid gap-4 md:grid-cols-[1.2fr_1.4fr_1fr_auto]">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Kelas</span>
              <select
                name="classroom_id"
                defaultValue={data.guru?.selectedClassroomId ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Pilih kelas</option>
                {data.guru?.classroomOptions.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Mapel</span>
              <select
                name="subject_id"
                defaultValue={data.guru?.selectedSubjectId ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Pilih mapel</option>
                {data.guru?.subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Tipe Nilai</span>
              <select
                name="score_type"
                defaultValue={data.selectedScoreType}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
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

          {data.guru?.selectedAssignment ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Kelas:</span> {data.guru.selectedAssignment.classroomName}
              </p>
              <p>
                <span className="font-semibold">Mapel:</span> {data.guru.selectedAssignment.subjectName} ({data.guru.selectedAssignment.subjectCode})
              </p>
              <p>
                <span className="font-semibold">Rumus Final:</span> nilai tertinggi dari nilai awal vs remedial.
              </p>
            </div>
          ) : null}
        </AdminFormCard>

        <AdminFormCard title={`Input Nilai ${data.selectedScoreType.toUpperCase()}`} description="Isi nilai awal, remedial opsional, dan catatan per siswa.">
          {data.guru?.selectedAssignment ? (
            <form action={submitExamScoresAction} className="space-y-4">
              <input type="hidden" name="assignment_id" value={data.guru.selectedAssignment.id} />
              <input type="hidden" name="score_type" value={data.selectedScoreType} />

              <AdminDataTable
                columns={[
                  { key: "student", label: "Siswa" },
                  { key: "score", label: "Nilai Awal" },
                  { key: "remedial", label: "Remedial" },
                  { key: "final", label: "Final" },
                  { key: "notes", label: "Catatan" },
                ]}
                hasRows={(data.guru.students.length ?? 0) > 0}
                emptyMessage="Belum ada siswa pada assignment ini."
              >
                {data.guru.students.map((student) => (
                  <tr key={student.enrollmentId}>
                    <td className="px-4 py-3 text-sm">
                      <input type="hidden" name="enrollment_ids" value={student.enrollmentId} />
                      <p className="font-semibold text-slate-900">{student.studentName}</p>
                      <p className="text-xs text-slate-500">{student.nis ? `NIS ${student.nis}` : "NIS -"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`score_${student.enrollmentId}`}
                        defaultValue={student.originalScore ?? ""}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        inputMode="decimal"
                        placeholder="0-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`remedial_${student.enrollmentId}`}
                        defaultValue={student.remedialScore ?? ""}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        inputMode="decimal"
                        placeholder="opsional"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#1e3b8a]">
                      {student.finalScore != null ? student.finalScore : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`notes_${student.enrollmentId}`}
                        defaultValue={student.notes}
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        placeholder="Opsional"
                      />
                    </td>
                  </tr>
                ))}
              </AdminDataTable>

              <button
                type="submit"
                disabled={data.guru.students.length === 0}
                className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simpan Nilai {data.selectedScoreType.toUpperCase()}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">Pilih assignment terlebih dahulu untuk mulai input nilai.</p>
          )}
        </AdminFormCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Monitor Nilai UTS/UAS"
        description="Pantau nilai final siswa berdasarkan filter periode, kelas, mapel, dan tipe nilai."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Filter Monitor" description="Filter data monitoring nilai untuk analisis cepat.">
        <form action="/dashboard/scores" className="grid gap-4 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Periode</span>
            <select
              name="period_id"
              defaultValue={data.admin?.selectedPeriodId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {data.admin?.periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                  {period.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kelas</span>
            <select
              name="classroom_id"
              defaultValue={data.admin?.selectedClassroomId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Semua kelas</option>
              {data.admin?.classroomOptions.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Mapel</span>
            <select
              name="subject_id"
              defaultValue={data.admin?.selectedSubjectId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Semua mapel</option>
              {data.admin?.subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tipe Nilai</span>
            <select
              name="score_type"
              defaultValue={data.selectedScoreType}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="uts">UTS</option>
              <option value="uas">UAS</option>
            </select>
          </label>

          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Nilai Final</p>
          <h3 className="mt-2 text-3xl font-black text-[#1e3b8a]">{data.admin?.stats.averageFinalScore ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Siswa Ternilai</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.admin?.stats.totalScoredStudents ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Tertinggi</p>
          <h3 className="mt-2 text-3xl font-black text-green-600">{data.admin?.stats.highestScore ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Siswa Remedial</p>
          <h3 className="mt-2 text-3xl font-black text-amber-600">{data.admin?.stats.remedialCount ?? 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminFormCard title="Top 5 Highest Score" description="Diurutkan berdasarkan nilai final tertinggi.">
          <div className="space-y-3">
            {data.admin?.topScores.length ? (
              data.admin.topScores.map((row, index) => (
                <div key={`${row.studentName}-${row.subjectName}-${row.finalScore}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">#{index + 1} {row.studentName}</p>
                    <p className="text-xs text-slate-500">{row.classroomName} - {row.subjectName}</p>
                  </div>
                  <span className="text-sm font-bold text-[#1e3b8a]">{row.finalScore}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada data nilai pada filter ini.</p>
            )}
          </div>
        </AdminFormCard>

        <AdminFormCard title="Ringkasan" description="Nilai final dihitung dari nilai tertinggi nilai awal vs remedial.">
          <div className="rounded-lg border border-[#1e3b8a]/20 bg-[#1e3b8a]/5 px-4 py-3 text-sm text-slate-700">
            <p>
              Total data yang sedang dipantau: <span className="font-semibold">{data.admin?.rows.length ?? 0}</span> baris nilai.
            </p>
            <p className="mt-1">
              Tipe nilai aktif: <span className="font-semibold uppercase">{data.selectedScoreType}</span>.
            </p>
          </div>
        </AdminFormCard>
      </div>

      <AdminDataTable
        columns={[
          { key: "student", label: "Siswa" },
          { key: "classroom", label: "Kelas" },
          { key: "subject", label: "Mapel" },
          { key: "type", label: "Tipe" },
          { key: "original", label: "Nilai Awal" },
          { key: "remedial", label: "Remedial" },
          { key: "final", label: "Final" },
        ]}
        hasRows={(data.admin?.rows.length ?? 0) > 0}
        emptyMessage="Belum ada data nilai UTS/UAS untuk filter ini."
      >
        {data.admin?.rows.map((row) => (
          <tr key={row.scoreId}>
            <td className="px-4 py-3 text-sm font-medium text-slate-800">
              {row.studentName}
              <p className="text-xs text-slate-500">{row.nis ? `NIS ${row.nis}` : "NIS -"}</p>
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.classroomName}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.subjectName}</td>
            <td className="px-4 py-3 text-sm uppercase text-slate-700">{row.scoreType}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.originalScore}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{row.remedialScore ?? "-"}</td>
            <td className="px-4 py-3 text-sm font-semibold text-[#1e3b8a]">{row.finalScore}</td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
