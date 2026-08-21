import clsx from "clsx";

export const Table = ({ columns, rows, keyField = "_id", onRowClick }) => (
  <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-black/[0.06] bg-black/[0.015] text-left">
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 font-medium text-ink/50">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row[keyField]}
            onClick={() => onRowClick?.(row)}
            className={clsx(
              "border-b border-black/[0.04] last:border-0",
              onRowClick && "cursor-pointer hover:bg-brand-50/50"
            )}
          >
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-ink/80">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-ink/60">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-black/10 px-3 py-1.5 disabled:opacity-40 hover:bg-black/[0.03]"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-black/10 px-3 py-1.5 disabled:opacity-40 hover:bg-black/[0.03]"
        >
          Next
        </button>
      </div>
    </div>
  );
};
