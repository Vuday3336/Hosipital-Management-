import { useEffect, useState } from "react";
import { CalendarClock, FileText, Receipt } from "lucide-react";
import { StatCard } from "../../components/common/Card.jsx";
import { LoadingState } from "../../components/common/States.jsx";
import { appointmentsApi, invoicesApi, prescriptionsApi } from "../../api/resources.js";

export const PatientOverview = () => {
  const [state, setState] = useState({ status: "loading", counts: null });

  useEffect(() => {
    Promise.all([
      appointmentsApi.list({ limit: 1, status: "confirmed" }),
      invoicesApi.list({ limit: 1, paymentStatus: "unpaid" }),
      prescriptionsApi.list({ limit: 1 }),
    ])
      .then(([appts, invoices, prescriptions]) => {
        setState({
          status: "success",
          counts: {
            upcoming: appts.meta.total,
            unpaidBills: invoices.meta.total,
            prescriptions: prescriptions.meta.total,
          },
        });
      })
      .catch(() => setState({ status: "error", counts: null }));
  }, []);

  if (state.status === "loading") return <LoadingState />;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Upcoming appointments" value={state.counts?.upcoming ?? "—"} icon={CalendarClock} />
      <StatCard label="Unpaid bills" value={state.counts?.unpaidBills ?? "—"} icon={Receipt} />
      <StatCard label="Prescriptions on file" value={state.counts?.prescriptions ?? "—"} icon={FileText} />
    </div>
  );
};
