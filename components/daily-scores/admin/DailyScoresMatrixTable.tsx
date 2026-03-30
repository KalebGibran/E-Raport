import {
  AdminDailyScoreRow,
  AdminDailyStudentRow,
  DailyTrendPoint,
} from "@/lib/daily-scores/service";

type DailyScoresMatrixTableProps = {
  taskColumns: DailyTrendPoint[];
  students: AdminDailyStudentRow[];
  rows: AdminDailyScoreRow[];
};

function formatShortIdDate(dateValue: string) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function clampPercent(value: number | null) {
  if (value == null) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function DailyScoresMatrixTable({ taskColumns, students, rows }: DailyScoresMatrixTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="sticky left-0 z-10 w-72 border-b border-slate-200 bg-slate-50 px-4 py-3">
                Siswa
              </th>
              {taskColumns.map((task) => (
                <th
                  key={task.taskId}
                  title={task.taskTitle}
                  className="w-16 border-b border-slate-200 px-2 py-3 text-center"
                >
                  <div className="flex flex-col items-center gap-0.5 leading-none">
                    <span className="text-[10px] font-extrabold text-slate-600">{task.taskLabel}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {formatShortIdDate(task.taskDate)}
                    </span>
                    <span className="max-w-[64px] truncate text-[10px] font-medium normal-case text-slate-400">
                      {task.taskTitle}
                    </span>
                  </div>
                </th>
              ))}
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">AVG</th>
              <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">N</th>
              <th className="border-b border-slate-200 bg-[#eef2ff] px-4 py-3 text-center text-[#1e3b8a]">
                %
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={taskColumns.length + 4}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  Belum ada siswa untuk filter yang dipilih.
                </td>
              </tr>
            ) : null}

            {(() => {
              const scoreByEnrollmentTask = new Map<string, number>();
              const totalsByEnrollment = new Map<string, { total: number; count: number }>();

              for (const row of rows) {
                scoreByEnrollmentTask.set(`${row.enrollmentId}::${row.taskId}`, row.finalScore);
                const existing = totalsByEnrollment.get(row.enrollmentId) ?? { total: 0, count: 0 };
                existing.total += row.finalScore;
                existing.count += 1;
                totalsByEnrollment.set(row.enrollmentId, existing);
              }

              return students.map((student) => {
                const totals = totalsByEnrollment.get(student.enrollmentId) ?? { total: 0, count: 0 };
                const average = totals.count > 0 ? totals.total / totals.count : null;

                return (
                  <tr key={student.enrollmentId} className="transition-colors hover:bg-slate-50/70">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">{student.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {student.classroomName} • {student.nis ? `NIS ${student.nis}` : "NIS -"}
                      </p>
                    </td>

                    {taskColumns.map((task) => {
                      const value = scoreByEnrollmentTask.get(`${student.enrollmentId}::${task.taskId}`) ?? null;
                      const title =
                        task.averageFinalScore != null
                          ? `Rata-rata task: ${task.averageFinalScore} (${task.entryCount} entri)`
                          : "Belum ada entri";

                      return (
                        <td
                          key={`${student.enrollmentId}-${task.taskId}`}
                          title={title}
                          className="px-2 py-3 text-center text-sm font-semibold text-slate-800"
                        >
                          {value ?? "-"}
                        </td>
                      );
                    })}

                    <td className="px-3 py-3 text-center text-sm font-semibold text-slate-800">
                      {average != null ? Number(average.toFixed(1)) : "-"}
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-slate-800">
                      {totals.count}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#1e3b8a]">
                      {taskColumns.length > 0
                        ? `${clampPercent(
                            totals.count > 0 ? (totals.count / taskColumns.length) * 100 : 0
                          )}%`
                        : "0%"}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Showing {students.length} siswa • {taskColumns.length} task
        </p>
      </div>
    </div>
  );
}
