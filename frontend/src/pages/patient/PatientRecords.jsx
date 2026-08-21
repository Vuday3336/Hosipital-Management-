import { useEffect, useState } from "react";
import { Card } from "../../components/common/Card.jsx";
import { LoadingState, EmptyState, ErrorState } from "../../components/common/States.jsx";
import { patientsApi, medicinesApi } from "../../api/resources.js";

export const PatientRecords = () => {
  const [state, setState] = useState({ status: "loading", patient: null, medicines: [] });

  const load = async () => {
    setState({ status: "loading", patient: null, medicines: [] });
    try {
      const [profile, dispensed] = await Promise.all([patientsApi.me(), medicinesApi.myDispensingLog({ limit: 20 })]);
      setState({ status: "success", patient: profile.data.patient, medicines: dispensed.data });
    } catch {
      setState({ status: "error", patient: null, medicines: [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState onRetry={load} />;

  const { patient, medicines } = state;
  const history = patient.medicalHistory || [];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold">My medical records</h2>
        <p className="mt-1 text-sm text-ink/50">Blood group {patient.bloodGroup} · {patient.allergies?.length ? `Allergic to ${patient.allergies.join(", ")}` : "No known allergies"}</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">Medical history</h3>
        {history.length === 0 ? (
          <EmptyState title="No history recorded yet" hint="Your doctor will add entries after each visit." />
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <Card key={h._id} className="p-4">
                <p className="font-medium text-ink">{h.condition}</p>
                {h.diagnosedDate && <p className="text-xs text-ink/40">{new Date(h.diagnosedDate).toLocaleDateString()}</p>}
                {h.notes && <p className="mt-1 text-sm text-ink/60">{h.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/40">Medicines dispensed</h3>
        {medicines.length === 0 ? (
          <EmptyState title="No medicines dispensed yet" hint="Medicines picked up from the pharmacy will show up here." />
        ) : (
          <div className="space-y-3">
            {medicines.map((log) => (
              <Card key={log._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-ink">{log.medicine?.name}</p>
                  <p className="text-xs text-ink/40">{new Date(log.dispensedAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-ink/60">{log.quantity} {log.medicine?.unit}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
