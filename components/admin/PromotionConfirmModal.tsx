"use client";

import { useState } from "react";

import { promoteStudentsAction } from "@/app/dashboard/_actions/adminCrud";

type PromotionConfirmModalProps = {
  currentPeriodId: string;
  targetPeriodId: string;
  targetPeriodLabel: string;
  eligibleCount: number;
  willMoveClassCount: number;
  willStayClassCount: number;
  disabled?: boolean;
};

export function PromotionConfirmModal({
  currentPeriodId,
  targetPeriodId,
  targetPeriodLabel,
  eligibleCount,
  willMoveClassCount,
  willStayClassCount,
  disabled = false,
}: PromotionConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Promote Students
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Konfirmasi Promotion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Kamu akan membuat enrollment baru ke periode <strong>{targetPeriodLabel}</strong>.
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>Total siswa diproses: {eligibleCount}</p>
              <p>Akan pindah kelas: {willMoveClassCount}</p>
              <p>Tetap di kelas yang sama: {willStayClassCount}</p>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Aksi ini menambah data enrollment baru dan tidak mengubah enrollment lama.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <form action={promoteStudentsAction}>
                <input type="hidden" name="current_period_id" value={currentPeriodId} />
                <input type="hidden" name="target_period_id" value={targetPeriodId} />
                <button
                  type="submit"
                  className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Ya, Jalankan Promotion
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
