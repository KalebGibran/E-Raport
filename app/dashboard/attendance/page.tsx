import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { AdminAttendanceRecapView } from "@/components/attendance/admin/AdminAttendanceRecapView";
import { submitAttendanceAction } from "@/app/dashboard/_actions/attendance";
import { getAttendancePageData } from "@/lib/attendance/service";

type AttendancePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    classroom_id?: string;
    date?: string;
    month?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  sick: "Sakit",
  permission: "Izin",
  absent: "Alpa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const params = await searchParams;
  const data = await getAttendancePageData({
    classroomId: params.classroom_id,
    date: params.date,
    month: params.month,
  });

  if (data.role === "admin") {
    return (
      <div className="space-y-3">
        <div className="mx-auto w-full max-w-7xl px-8 pt-3">
          <AdminStatusNotice status={params.status} message={params.message} />
        </div>

        <AdminAttendanceRecapView
          selectedClassroom={data.selectedClassroom}
          classrooms={data.classrooms}
          monthOptions={data.monthOptions}
          selectedMonth={data.selectedMonth}
          recap={data.adminMonthlyRecap}
          history={data.history}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Absensi Harian"
        description="Absensi dilakukan per hari per kelas, bukan per mata pelajaran."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <AdminFormCard title="Periode Aktif" description="Absensi dihitung berdasarkan periode current.">
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

      <AdminFormCard title="Filter Absensi" description="Pilih kelas dan tanggal untuk menampilkan siswa.">
        <form action="/dashboard/attendance" className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kelas</span>
            <select
              name="classroom_id"
              defaultValue={data.selectedClassroom?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Pilih kelas</option>
              {data.classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tanggal</span>
            <input
              type="date"
              name="date"
              defaultValue={data.selectedDate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
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

        {data.isWeekend ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Sabtu dan Minggu otomatis libur, jadi tidak masuk hitungan akumulasi.
          </div>
        ) : null}

        {data.isHoliday ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tanggal merah terdeteksi ({data.holidayName ?? "Libur Nasional"}), jadi tidak masuk hitungan akumulasi.
          </div>
        ) : null}
      </AdminFormCard>

      {data.role === "guru" ? (
        <AdminFormCard
          title="Input Absensi Siswa"
          description="Guru bisa mengabsen kelas mana pun untuk sementara. Tersimpan siapa guru yang menginput."
        >
          {data.selectedClassroom ? (
            <form action={submitAttendanceAction} className="space-y-4">
              <input type="hidden" name="classroom_id" value={data.selectedClassroom.id} />
              <input type="hidden" name="attendance_date" value={data.selectedDate} />

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Kelas:</span> {data.selectedClassroom.classroomName}
                </p>
                <p>
                  <span className="font-semibold">Tanggal:</span> {data.selectedDate}
                </p>
              </div>

              <AdminDataTable
                columns={[
                  { key: "student", label: "Siswa" },
                  { key: "status", label: "Status Hari Ini" },
                  { key: "notes", label: "Catatan" },
                  { key: "summary", label: "Akumulasi" },
                ]}
                hasRows={data.students.length > 0}
                emptyMessage="Belum ada siswa pada kelas ini."
              >
                {data.students.map((student) => (
                  <tr key={student.enrollmentId}>
                    <td className="px-4 py-3 text-sm">
                      <input type="hidden" name="enrollment_ids" value={student.enrollmentId} />
                      <p className="font-semibold text-slate-900">{student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.nis ? `NIS ${student.nis}` : "NIS -"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        name={`status_${student.enrollmentId}`}
                        defaultValue={student.status}
                        disabled={data.isWeekend || data.isHoliday}
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="present">Hadir</option>
                        <option value="sick">Sakit</option>
                        <option value="permission">Izin</option>
                        <option value="absent">Alpa</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`notes_${student.enrollmentId}`}
                        defaultValue={student.notes}
                        disabled={data.isWeekend || data.isHoliday}
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        placeholder="Opsional"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="space-y-1">
                        <p>
                          Hadir {student.summary.present} | Sakit {student.summary.sick} | Izin{" "}
                          {student.summary.permission} | Alpa {student.summary.absent}
                        </p>
                        <p>Hari efektif: {student.summary.effectiveSchoolDays}</p>
                        <p className="font-semibold text-[#1e3b8a]">Persen hadir: {student.summary.attendanceRate}%</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminDataTable>

              <button
                type="submit"
                disabled={data.isWeekend || data.isHoliday || data.students.length === 0}
                className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simpan Absensi
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">Pilih kelas terlebih dahulu untuk mulai absensi.</p>
          )}
        </AdminFormCard>
      ) : null}

      <AdminFormCard
        title="Riwayat Absensi"
        description="Riwayat menampilkan kapan absensi diinput, kelas mana, dan guru yang menginput."
      >
        <AdminDataTable
          columns={[
            { key: "date", label: "Tanggal" },
            { key: "input_at", label: "Waktu Input" },
            { key: "classroom", label: "Kelas" },
            { key: "teacher", label: "Guru Penginput" },
            { key: "summary", label: "Ringkasan" },
          ]}
          hasRows={data.history.length > 0}
          emptyMessage="Belum ada riwayat absensi."
        >
          {data.history.map((row) => (
            <tr key={`${row.attendanceDate}-${row.classroomName}-${row.teacherName}-${row.inputAt}`}>
              <td className="px-4 py-3 text-sm">{row.attendanceDate}</td>
              <td className="px-4 py-3 text-sm">{new Date(row.inputAt).toLocaleString("id-ID")}</td>
              <td className="px-4 py-3 text-sm">{row.classroomName}</td>
              <td className="px-4 py-3 text-sm">{row.teacherName}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {row.totalStudents} siswa | H {row.present} | S {row.sick} | I {row.permission} | A {row.absent}
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminFormCard>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Keterangan status:
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="ml-3 inline-block rounded bg-white px-2 py-1 text-xs text-slate-600">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
