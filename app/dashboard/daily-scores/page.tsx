import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { DailyScoresMatrixTable } from "@/components/daily-scores/admin/DailyScoresMatrixTable";
import {
  createDailyAssessmentAction,
  deleteDailyAssessmentAction,
  submitDailyScoresAction,
  updateDailyAssessmentAction,
} from "@/app/dashboard/_actions/daily-scores";
import { getDailyScorePageData } from "@/lib/daily-scores/service";

type DailyScoresPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    assignment_id?: string;
    classroom_id?: string;
    subject_id?: string;
    task_id?: string;
    period_id?: string;
    teacher_id?: string;
    month?: string;
  }>;
};

function formatIdDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function clampPercent(value: number | null) {
  if (value == null) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DailyScoresPage({ searchParams }: DailyScoresPageProps) {
  const params = await searchParams;
  const data = await getDailyScorePageData({
    assignmentId: params.assignment_id,
    classroomId: params.classroom_id,
    subjectId: params.subject_id,
    taskId: params.task_id,
    periodId: params.period_id,
    teacherId: params.teacher_id,
    month: params.month,
  });

  if (data.role === "guru") {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
        <AdminPageHeader
          title="Nilai Harian (Task)"
          description="Guru membuat task harian dulu, lalu input nilai siswa per task."
        />

        <AdminStatusNotice status={params.status} message={params.message} />

        <AdminFormCard title="Periode Input" description="Nilai harian hanya boleh dikelola pada periode current.">
          {data.currentPeriod ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Periode:</span> {data.currentPeriod.periodName}
              </p>
              <p>
                <span className="font-semibold">Rentang:</span> {data.currentPeriod.startDate} s/d{" "}
                {data.currentPeriod.endDate}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {data.currentPeriod.status}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-700">Belum ada academic period dengan `is_current = true`.</p>
          )}
        </AdminFormCard>

        {data.guru?.isLocked ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Periode ini sudah locked untuk raport. Task dan nilai harian tidak bisa diubah.
          </div>
        ) : null}

        <AdminFormCard title="Filter Kelas & Mapel" description="Pilih kelas, mapel, dan task yang ingin dikelola.">
          <form action="/dashboard/daily-scores" className="grid gap-4 md:grid-cols-[1.1fr_1.4fr_1.8fr_auto]">
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
              <span className="text-sm font-medium text-slate-700">Task Harian</span>
              <select
                name="task_id"
                defaultValue={data.guru?.selectedTaskId ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Pilih task</option>
                {data.guru?.taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.label}
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

          {data.guru?.selectedAssignment ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Kelas:</span> {data.guru.selectedAssignment.classroomName}
              </p>
              <p>
                <span className="font-semibold">Mapel:</span> {data.guru.selectedAssignment.subjectName} (
                {data.guru.selectedAssignment.subjectCode})
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Belum ada assignment untuk guru ini pada periode current.
            </p>
          )}
        </AdminFormCard>

        <AdminFormCard title="Buat Task Harian" description="Task bersifat fleksibel, dibuat saat guru memberi tugas/materi.">
          {data.guru?.selectedAssignment ? (
            <form action={createDailyAssessmentAction} className="grid gap-4 md:grid-cols-[1fr_1.4fr_2fr_auto]">
              <input type="hidden" name="assignment_id" value={data.guru.selectedAssignment.id} />
              <input type="hidden" name="classroom_id" value={data.guru.selectedClassroomId ?? ""} />
              <input type="hidden" name="subject_id" value={data.guru.selectedSubjectId ?? ""} />

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Tanggal Task</span>
                <input
                  type="date"
                  name="task_date"
                  defaultValue={data.guru.defaultTaskDate}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={data.guru.isLocked}
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Judul Task</span>
                <input
                  type="text"
                  name="title"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Contoh: Latihan Pecahan Bab 3"
                  disabled={data.guru.isLocked}
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Deskripsi</span>
                <input
                  type="text"
                  name="description"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Materi/tugas apa yang dinilai (opsional)"
                  disabled={data.guru.isLocked}
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={data.guru.isLocked}
                  className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Tambah Task
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500">Pilih kelas dan mapel dulu untuk membuat task.</p>
          )}

          <div className="mt-6">
            <AdminDataTable
              columns={[
                { key: "task_date", label: "Tanggal" },
                { key: "title", label: "Judul Task" },
                { key: "description", label: "Deskripsi" },
                { key: "actions", label: "Aksi", align: "right" },
              ]}
              hasRows={(data.guru?.taskOptions.length ?? 0) > 0}
              emptyMessage="Belum ada task harian untuk assignment ini."
            >
              {data.guru?.taskOptions.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      form={`update-task-${task.id}`}
                      name="task_date"
                      defaultValue={task.taskDate}
                      className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      disabled={data.guru?.isLocked}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`update-task-${task.id}`}
                      name="title"
                      defaultValue={task.title}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      disabled={data.guru?.isLocked}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`update-task-${task.id}`}
                      name="description"
                      defaultValue={task.description}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      disabled={data.guru?.isLocked}
                      placeholder="Opsional"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <form
                        id={`update-task-${task.id}`}
                        action={updateDailyAssessmentAction}
                        className="inline-flex"
                      >
                        <input type="hidden" name="daily_assessment_id" value={task.id} />
                        <input type="hidden" name="classroom_id" value={data.guru?.selectedClassroomId ?? ""} />
                        <input type="hidden" name="subject_id" value={data.guru?.selectedSubjectId ?? ""} />
                        <button
                          type="submit"
                          disabled={data.guru?.isLocked}
                          className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Update
                        </button>
                      </form>

                      <form action={deleteDailyAssessmentAction} className="inline-flex">
                        <input type="hidden" name="daily_assessment_id" value={task.id} />
                        <input type="hidden" name="classroom_id" value={data.guru?.selectedClassroomId ?? ""} />
                        <input type="hidden" name="subject_id" value={data.guru?.selectedSubjectId ?? ""} />
                        <button
                          type="submit"
                          disabled={data.guru?.isLocked}
                          className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminDataTable>
          </div>
        </AdminFormCard>

        <AdminFormCard title="Input Nilai Harian" description="Isi nilai dan catatan per siswa.">
          {data.guru?.selectedAssignment && data.guru.selectedTask ? (
            <form action={submitDailyScoresAction} className="space-y-4">
              <input type="hidden" name="assignment_id" value={data.guru.selectedAssignment.id} />
              <input type="hidden" name="daily_assessment_id" value={data.guru.selectedTask.id} />
              <input type="hidden" name="classroom_id" value={data.guru.selectedClassroomId ?? ""} />
              <input type="hidden" name="subject_id" value={data.guru.selectedSubjectId ?? ""} />

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Task:</span> {data.guru.selectedTask.title}
                </p>
                <p>
                  <span className="font-semibold">Tanggal:</span> {formatIdDate(data.guru.selectedTask.taskDate)}
                </p>
                <p>
                  <span className="font-semibold">Task No:</span> {data.guru.selectedTask.assessmentNo}
                </p>
              </div>

              <AdminDataTable
                columns={[
                  { key: "student", label: "Siswa" },
                  { key: "score", label: "Nilai" },
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
                        disabled={data.guru?.isLocked}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`notes_${student.enrollmentId}`}
                        defaultValue={student.notes}
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        placeholder="Opsional"
                        disabled={data.guru?.isLocked}
                      />
                    </td>
                  </tr>
                ))}
              </AdminDataTable>

              <button
                type="submit"
                disabled={data.guru.students.length === 0 || data.guru.isLocked}
                className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simpan Nilai Harian
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              Pilih task harian terlebih dahulu untuk mulai input nilai.
            </p>
          )}
        </AdminFormCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Monitor Nilai Harian"
        description="Pantau performa nilai harian dengan filter periode, kelas, mapel, guru, dan bulan."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Filter Monitor" description="Data read-only untuk analisa admin.">
        <form action="/dashboard/daily-scores" className="grid gap-4 md:grid-cols-5">
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
            <span className="text-sm font-medium text-slate-700">Guru</span>
            <select
              name="teacher_id"
              defaultValue={data.admin?.selectedTeacherId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Semua guru</option>
              {data.admin?.teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Bulan</span>
            <select
              name="month"
              defaultValue={data.admin?.selectedMonth ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {data.admin?.monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-5">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </AdminFormCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Final</p>
          <h3 className="mt-2 text-3xl font-black text-[#1e3b8a]">{data.admin?.stats.averageFinalScore ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Task</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.admin?.stats.totalTasks ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Entri Nilai</p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{data.admin?.stats.totalEntries ?? 0}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Tertinggi</p>
          <h3 className="mt-2 text-3xl font-black text-green-600">{data.admin?.stats.highestScore ?? 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminFormCard title="Tren Nilai per Task" description="Rata-rata final tiap task pada filter aktif.">
          {data.admin?.trend.length ? (
            <div className="space-y-3">
              {data.admin.trend.map((point) => (
                <div key={point.taskId}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {point.taskLabel} • {formatIdDate(point.taskDate)} • {point.taskTitle}
                    </span>
                    <span className="font-semibold">
                      {point.averageFinalScore != null ? `${point.averageFinalScore}` : "-"}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-[#1e3b8a]"
                      style={{
                        width: `${clampPercent(point.averageFinalScore)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{point.entryCount} entri nilai</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Belum ada data tren pada filter ini.</p>
          )}
        </AdminFormCard>

        <AdminFormCard title="Top 5 Nilai Tertinggi" description="Diurutkan dari final score tertinggi.">
          {data.admin?.topScores.length ? (
            <div className="space-y-3">
              {data.admin.topScores.map((row, index) => (
                <div
                  key={`${row.studentName}-${row.taskLabel}-${row.finalScore}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      #{index + 1} {row.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.classroomName} - {row.subjectName} ({row.taskLabel})
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#1e3b8a]">{row.finalScore}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Belum ada data top score pada filter ini.</p>
          )}
        </AdminFormCard>
      </div>

      <AdminFormCard
        title="Rekap Nilai Harian (Matrix)"
        description="Baris adalah siswa, kolom adalah task berdasarkan tanggal. Isi cell menampilkan nilai final."
      >
        {data.admin?.trend.length ? (
          <DailyScoresMatrixTable
            taskColumns={data.admin.trend}
            students={data.admin.students}
            rows={data.admin.rows}
          />
        ) : (
          <p className="text-sm text-slate-500">Belum ada task pada filter bulan/periode ini.</p>
        )}
      </AdminFormCard>
    </div>
  );
}
