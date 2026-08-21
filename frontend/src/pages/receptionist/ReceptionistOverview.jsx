import { useEffect, useState } from "react";
import { CalendarClock, Users, Receipt } from "lucide-react";
import { StatCard } from "../../components/common/Card.jsx";
import { LoadingState } from "../../components/common/States.jsx";
import { appointmentsApi, patientsApi, invoicesApi } from "../../api/resources.js";

export const ReceptionistOverview = () => {
  const [state, setState] = useState({ status: "loading", counts: null });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      appointmentsApi.list({ limit: 1, date: today }),
      patientsApi.list({ limit: 1 }),
      invoicesApi.list({ limit: 1, paymentStatus: "unpaid" }),
    ])
      .then(([appts, patients, invoices]) => {
        setState({
          status: "success",
          counts: { today: appts.meta.total, patients: patients.meta.total, unpaid: invoices.meta.total },
        });
      })
      .catch(() => setState({ status: "error", counts: null }));
  }, []);

  if (state.status === "loading") return <LoadingState />;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Today's appointments" value={state.counts?.today ?? "—"} icon={CalendarClock} />
      <StatCard label="Registered patients" value={state.counts?.patients ?? "—"} icon={Users} />
      <StatCard label="Unpaid invoices" value={state.counts?.unpaid ?? "—"} icon={Receipt} />
    </div>
  );
};
