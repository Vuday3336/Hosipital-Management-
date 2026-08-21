import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Table, Pagination } from "./Table.jsx";
import { LoadingState, EmptyState, ErrorState } from "./States.jsx";
import { Button } from "./Button.jsx";
import { Input } from "./Input.jsx";
import { useResourceList } from "../../hooks/useResourceList.js";

// Config-driven list page: search + pagination + table + loading/empty/error states,
// reused across Patients, Doctors, Departments, Staff, Appointments, Admissions,
// Medicines and Invoices instead of six near-identical page components.
export const ResourceListPage = ({
  title,
  description,
  columns,
  fetchFn,
  searchable = true,
  onRowClick,
  createLabel,
  onCreate,
  extraFilters,
  emptyHint,
  rowKey = "_id",
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const params = { page, limit: 10, ...(search ? { search } : {}), ...filters };
  const { status, rows, meta, error, reload } = useResourceList(fetchFn, params, [page, search, JSON.stringify(filters)]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
        </div>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            {createLabel || "Add new"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {searchable && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              placeholder="Search..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        )}
        {extraFilters?.(filters, (next) => {
          setPage(1);
          setFilters(next);
        })}
      </div>

      {status === "loading" && <LoadingState label={`Loading ${title.toLowerCase()}…`} />}
      {status === "error" && <ErrorState message={error} onRetry={reload} />}
      {status === "success" && rows.length === 0 && (
        <EmptyState title={`No ${title.toLowerCase()} found`} hint={emptyHint} />
      )}
      {status === "success" && rows.length > 0 && (
        <>
          <Table columns={columns} rows={rows} onRowClick={onRowClick} keyField={rowKey} />
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
};
