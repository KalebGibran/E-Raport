import { AdminFormCard } from "@/components/admin/AdminFormCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusNotice } from "@/components/admin/AdminStatusNotice";
import { PromotionConfirmModal } from "@/components/admin/PromotionConfirmModal";
import { getPromotionPreview, listPromotionPeriods } from "@/lib/admin/promotion";

type PromotionPageProps = {
  searchParams: Promise<{
    target_period_id?: string;
    status?: string;
    message?: string;
    total?: string;
    inserted?: string;
    skipped?: string;
    moved?: string;
    stayed?: string;
  }>;
};

function findDefaultTargetPeriodId(
  periods: { id: string; startDate: string; isCurrent: boolean }[],
  currentPeriodId: string
) {
  const current = periods.find((period) => period.id === currentPeriodId);
  if (!current) return null;

  const ascending = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const future = ascending.find((period) => period.startDate > current.startDate);
  if (future) return future.id;

  return periods.find((period) => period.id !== currentPeriodId)?.id ?? null;
}

function readNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PromotionPage({ searchParams }: PromotionPageProps) {
  const params = await searchParams;
  const { periods, currentPeriod } = await listPromotionPeriods();

  const defaultTargetPeriodId = currentPeriod ? findDefaultTargetPeriodId(periods, currentPeriod.id) : null;
  const selectedTargetId = params.target_period_id ?? defaultTargetPeriodId ?? "";
  const targetPeriod = periods.find((period) => period.id === selectedTargetId) ?? null;

  const preview =
    currentPeriod && targetPeriod && targetPeriod.id !== currentPeriod.id
      ? await getPromotionPreview({
          currentPeriodId: currentPeriod.id,
          targetPeriodId: targetPeriod.id,
        })
      : null;

  const resultSummary =
    params.status === "success"
      ? {
          total: readNumber(params.total),
          inserted: readNumber(params.inserted),
          skipped: readNumber(params.skipped),
          moved: readNumber(params.moved),
          stayed: readNumber(params.stayed),
        }
      : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <AdminPageHeader
        title="Academic Management"
        description="Kelola promotion siswa ke periode berikutnya secara terkontrol."
      />

      <AdminStatusNotice status={params.status} message={params.message} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Promotion menambahkan enrollment baru di periode target. Enrollment lama tetap disimpan sebagai histori
        akademik dan tidak dihapus.
      </div>

      {resultSummary &&
      resultSummary.total !== null &&
      resultSummary.inserted !== null &&
      resultSummary.skipped !== null &&
      resultSummary.moved !== null &&
      resultSummary.stayed !== null ? (
        <section className="grid gap-4 rounded-xl border border-green-200 bg-green-50 p-5 md:grid-cols-5">
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">Total Diproses</p>
            <p className="mt-1 text-2xl font-bold text-green-900">{resultSummary.total}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">Insert Baru</p>
            <p className="mt-1 text-2xl font-bold text-green-900">{resultSummary.inserted}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">Skipped</p>
            <p className="mt-1 text-2xl font-bold text-green-900">{resultSummary.skipped}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">Pindah Kelas</p>
            <p className="mt-1 text-2xl font-bold text-green-900">{resultSummary.moved}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">Tetap Kelas</p>
            <p className="mt-1 text-2xl font-bold text-green-900">{resultSummary.stayed}</p>
          </div>
        </section>
      ) : null}

      <AdminFormCard title="Current Period" description="Periode aktif saat ini (is_current = true).">
        {currentPeriod ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Periode:</span> {currentPeriod.periodName}
            </p>
            <p>
              <span className="font-semibold">Semester:</span> {currentPeriod.semester}
            </p>
            <p>
              <span className="font-semibold">Rentang:</span> {currentPeriod.startDate} s/d {currentPeriod.endDate}
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-700">Belum ada academic period dengan `is_current = true`.</p>
        )}
      </AdminFormCard>

      <AdminFormCard title="Target Period" description="Pilih periode tujuan sebelum menjalankan promotion.">
        {currentPeriod ? (
          <form method="get" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Periode Tujuan</span>
              <select
                name="target_period_id"
                required
                defaultValue={selectedTargetId}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Pilih periode target</option>
                {periods
                  .filter((period) => period.id !== currentPeriod.id)
                  .map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.label}
                    </option>
                  ))}
              </select>
            </label>

            <button
              type="submit"
              className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tampilkan Preview
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Set current period dulu agar target bisa dipilih.</p>
        )}
      </AdminFormCard>

      <AdminFormCard
        title="Promotion Preview"
        description="Hitung dampak promotion sebelum data enrollment baru dibuat."
      >
        {currentPeriod && targetPeriod && preview ? (
          <div className="space-y-4">
            {preview.eligibleCount <= 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Semua siswa di periode current sudah punya enrollment di periode target.
              </div>
            ) : null}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Target:</span> {targetPeriod.label}
              </p>
              <p>
                <span className="font-semibold">Tipe perpindahan:</span>{" "}
                {preview.transitionType === "same_year"
                  ? "Semester dalam tahun ajaran yang sama (kelas tetap)"
                  : "Tahun ajaran baru (pakai next_classroom_id)"}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Siswa Di Current</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.totalInCurrent}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Akan Dipromosikan</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.eligibleCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Pindah Kelas</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.willMoveClassCount}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Sudah Ada Di Target</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.alreadyInTargetCount}</p>
              </div>
            </div>

            <PromotionConfirmModal
              currentPeriodId={currentPeriod.id}
              targetPeriodId={targetPeriod.id}
              targetPeriodLabel={targetPeriod.label}
              eligibleCount={preview.eligibleCount}
              willMoveClassCount={preview.willMoveClassCount}
              willStayClassCount={preview.willStayClassCount}
              disabled={preview.eligibleCount <= 0}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Pilih periode target untuk melihat preview promotion.</p>
        )}
      </AdminFormCard>
    </div>
  );
}
