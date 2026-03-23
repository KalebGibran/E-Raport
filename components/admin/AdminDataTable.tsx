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
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

