import { useEffect, useState } from "react";
import { Card } from "../../components/common/Card.jsx";
import { LoadingState, EmptyState, ErrorState } from "../../components/common/States.jsx";
import { patientsApi } from "../../api/resources.js";

export const PatientRecords = () => {
  const [state, setState] = useState({ status: "loading", patient: null });

  const load = async () => {
    setState({ status: "loading", patient: null });
    try {
      const res = await patientsApi.me();
      setState({ status: "success", patient: res.data.patient });
    } catch {
      setState({ status: "error", patient: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState onRetry={load} />;

  const { patient } = state;
  const history = patient.medicalHistory || [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">My medical records</h2>
        <p className="mt-1 text-sm text-ink/50">Blood group {patient.bloodGroup} · {patient.allergies?.length ? `Allergic to ${patient.allergies.join(", ")}` : "No known allergies"}</p>
      </div>

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
  );
};
