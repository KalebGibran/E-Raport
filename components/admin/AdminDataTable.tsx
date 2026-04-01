import { ReactNode } from "react";

type TableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type AdminDataTableProps = {
  columns: TableColumn[];
  hasRows: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function AdminDataTable({ columns, hasRows, emptyMessage, children }: AdminDataTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 ${column.align === "right" ? "text-right" : "text-left"}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {hasRows ? (
              children
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6">
                    <span className="material-symbols-outlined text-slate-400">inbox</span>
                    <p className="text-sm font-semibold text-slate-700">Belum ada data</p>
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
