import { useEffect, useState } from "react";
import { Table } from "../../components/common/Table.jsx";
import { LoadingState, EmptyState, ErrorState } from "../../components/common/States.jsx";
import { appointmentsApi } from "../../api/resources.js";

const columns = [
  { key: "name", header: "Patient", render: (p) => `${p.firstName} ${p.lastName}` },
  { key: "phone", header: "Phone", render: (p) => p.phone || "—" },
  { key: "lastVisit", header: "Last appointment", render: (p) => p.lastVisit },
];

export const MyPatientsPage = () => {
  const [state, setState] = useState({ status: "loading", rows: [] });

  const load = async () => {
    setState({ status: "loading", rows: [] });
    try {
      const res = await appointmentsApi.list({ limit: 100 });
      const byPatient = new Map();
      for (const appt of res.data) {
        if (!appt.patient) continue;
        const existing = byPatient.get(appt.patient._id);
        if (!existing || appt.date > existing.lastVisit) {
          byPatient.set(appt.patient._id, { ...appt.patient, lastVisit: appt.date });
        }
      }
      setState({ status: "success", rows: [...byPatient.values()] });
    } catch {
      setState({ status: "error", rows: [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">My patients</h2>
        <p className="mt-1 text-sm text-ink/50">Everyone you've had an appointment with.</p>
      </div>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={load} />}
      {state.status === "success" && state.rows.length === 0 && <EmptyState title="No patients yet" />}
      {state.status === "success" && state.rows.length > 0 && <Table columns={columns} rows={state.rows} />}
    </div>
  );
};
