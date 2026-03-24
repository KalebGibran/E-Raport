"use client";

import { useMemo, useState } from "react";

type AcademicYearOption = {
  id: string;
  label: string;
};

type AcademicPeriodCreateFormProps = {
  academicYears: AcademicYearOption[];
  action: (formData: FormData) => void | Promise<void>;
};

function parseStartYear(yearLabel: string): number | null {
  const match = /^(\d{4})\/\d{4}$/.exec(yearLabel);
  if (!match) return null;
  return Number(match[1]);
}

function getSuggestedDates(yearLabel: string, semester: "1" | "2") {
  const startYear = parseStartYear(yearLabel);
  if (!startYear) {
    return {
      startDate: "",
      endDate: "",
      periodName: "",
    };
  }

  if (semester === "1") {
    return {
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-12-31`,
      periodName: `${yearLabel} - Semester 1`,
    };
  }

  const nextYear = startYear + 1;
  return {
    startDate: `${nextYear}-01-01`,
    endDate: `${nextYear}-06-30`,
    periodName: `${yearLabel} - Semester 2`,
  };
}

export function AcademicPeriodCreateForm({ academicYears, action }: AcademicPeriodCreateFormProps) {
  const defaultAcademicYearId = academicYears[0]?.id ?? "";
  const [academicYearId, setAcademicYearId] = useState(defaultAcademicYearId);
  const [semester, setSemester] = useState<"1" | "2">("1");
  const selectedYearLabel = useMemo(
    () => academicYears.find((year) => year.id === academicYearId)?.label ?? "",
    [academicYearId, academicYears]
  );
  const suggested = useMemo(
    () => getSuggestedDates(selectedYearLabel, semester),
    [selectedYearLabel, semester]
  );
  const [periodName, setPeriodName] = useState(suggested.periodName);
  const [startDate, setStartDate] = useState(suggested.startDate);
  const [endDate, setEndDate] = useState(suggested.endDate);

  function handleAcademicYearChange(value: string) {
    setAcademicYearId(value);
    const yearLabel = academicYears.find((year) => year.id === value)?.label ?? "";
    const nextSuggested = getSuggestedDates(yearLabel, semester);
    setPeriodName(nextSuggested.periodName);
    setStartDate(nextSuggested.startDate);
    setEndDate(nextSuggested.endDate);
  }

  function handleSemesterChange(value: "1" | "2") {
    setSemester(value);
    const nextSuggested = getSuggestedDates(selectedYearLabel, value);
    setPeriodName(nextSuggested.periodName);
    setStartDate(nextSuggested.startDate);
    setEndDate(nextSuggested.endDate);
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-3">
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tahun Ajaran</span>
        <select
          name="academic_year_id"
          required
          value={academicYearId}
          onChange={(event) => handleAcademicYearChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Pilih tahun ajaran</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Semester</span>
        <select
          name="semester"
          required
          value={semester}
          onChange={(event) => handleSemesterChange(event.target.value as "1" | "2")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <select name="status" required className="w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="planned">planned</option>
          <option value="active">active</option>
          <option value="closed">closed</option>
        </select>
      </label>

      <label className="space-y-1 md:col-span-3">
        <span className="text-sm font-medium text-slate-700">Nama Periode</span>
        <input
          name="period_name"
          required
          value={periodName}
          onChange={(event) => setPeriodName(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="2025/2026 - Semester 1"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tanggal Mulai</span>
        <input
          name="start_date"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Tanggal Akhir</span>
        <input
          name="end_date"
          type="date"
          required
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 md:col-span-3">
        <input type="checkbox" name="is_current" value="1" className="h-4 w-4" />
        <span className="text-sm text-slate-700">Set sebagai current period</span>
      </label>

      <div className="md:col-span-3">
        <button
          type="submit"
          className="rounded-lg bg-[#1e3b8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Simpan Periode
        </button>
      </div>
    </form>
  );
}
