import { useEffect, useState, useCallback } from "react";

// Shared list-fetching logic for every paginated + searchable module page
// (patients, doctors, appointments, medicines, invoices, ...).
export const useResourceList = (fetchFn, params, deps = []) => {
  const [state, setState] = useState({ status: "loading", rows: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const res = await fetchFn(params);
      setState({ status: "success", rows: res.data, meta: res.meta, error: null });
    } catch (err) {
      setState({ status: "error", rows: [], meta: null, error: err.response?.data?.message || "Failed to load" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
};
