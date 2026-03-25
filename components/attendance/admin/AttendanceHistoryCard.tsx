import { AttendanceHistoryItem } from "@/lib/attendance/service";

type AttendanceHistoryCardProps = {
  history: AttendanceHistoryItem[];
};

function formatInputDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("id-ID");
}

export function AttendanceHistoryCard({ history }: AttendanceHistoryCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Riwayat Absensi</h2>
      <p className="mt-3 text-base text-slate-600">
        Riwayat menampilkan kapan absensi diinput, kelas mana, dan guru yang menginput.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Waktu Input</th>
                <th className="px-6 py-4 font-bold">Kelas</th>
                <th className="px-6 py-4 font-bold">Guru Penginput</th>
                <th className="px-6 py-4 font-bold">Ringkasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-5 text-sm text-slate-500">
                    Belum ada riwayat absensi.
                  </td>
                </tr>
              ) : null}

              {history.map((row) => (
                <tr key={`${row.attendanceDate}-${row.classroomName}-${row.teacherName}-${row.inputAt}`}>
                  <td className="px-6 py-5 text-sm text-slate-800">{row.attendanceDate}</td>
                  <td className="px-6 py-5 text-sm text-slate-800">{formatInputDate(row.inputAt)}</td>
                  <td className="px-6 py-5 text-sm text-slate-800">{row.classroomName}</td>
                  <td className="px-6 py-5 text-sm text-slate-800">{row.teacherName}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {row.totalStudents} siswa | H {row.present} | S {row.sick} | I {row.permission} | A {row.absent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
