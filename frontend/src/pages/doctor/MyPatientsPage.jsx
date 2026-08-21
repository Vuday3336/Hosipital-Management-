import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Table } from "../../components/common/Table.jsx";
import { LoadingState, EmptyState, ErrorState } from "../../components/common/States.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Card } from "../../components/common/Card.jsx";
import { appointmentsApi, patientsApi } from "../../api/resources.js";

const columns = (onView) => [
  { key: "name", header: "Patient", render: (p) => `${p.firstName} ${p.lastName}` },
  { key: "phone", header: "Phone", render: (p) => p.phone || "—" },
  { key: "lastVisit", header: "Last appointment", render: (p) => p.lastVisit },
  {
    key: "actions",
    header: "",
    render: (p) => (
      <button onClick={() => onView(p)} className="text-xs font-medium text-brand-600 hover:underline">
        View record
      </button>
    ),
  },
];

const PatientDetail = ({ patientId, onClose }) => {
  const [state, setState] = useState({ status: "loading", patient: null });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    setState({ status: "loading", patient: null });
    try {
      const res = await patientsApi.get(patientId);
      setState({ status: "success", patient: res.data.patient });
    } catch {
      setState({ status: "error", patient: null });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const onAddHistory = async (values) => {
    await patientsApi.addMedicalHistory(patientId, values);
    reset();
    load();
  };

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState onRetry={load} />;

  const { patient } = state;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-ink/40">Date of birth</p>
          <p className="font-medium text-ink">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not on file"}</p>
        </div>
        <div>
          <p className="text-ink/40">Gender</p>
          <p className="font-medium text-ink capitalize">{patient.gender || "Not on file"}</p>
        </div>
        <div>
          <p className="text-ink/40">Blood group</p>
          <p className="font-medium text-ink">{patient.bloodGroup}</p>
        </div>
        <div>
          <p className="text-ink/40">Allergies</p>
          <p className="font-medium text-ink">{patient.allergies?.length ? patient.allergies.join(", ") : "None recorded"}</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">Medical history</h4>
        {patient.medicalHistory?.length ? (
          <div className="space-y-2">
            {patient.medicalHistory.map((h) => (
              <Card key={h._id} className="p-3">
                <p className="text-sm font-medium text-ink">{h.condition}</p>
                {h.diagnosedDate && <p className="text-xs text-ink/40">{new Date(h.diagnosedDate).toLocaleDateString()}</p>}
                {h.notes && <p className="mt-1 text-sm text-ink/60">{h.notes}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/45">No history recorded yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onAddHistory)} className="space-y-3 border-t border-black/[0.06] pt-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-ink/40">Add history entry</h4>
        <Input label="Condition" {...register("condition", { required: true })} />
        <Input label="Notes (optional)" {...register("notes")} />
        <Button type="submit" size="sm" loading={isSubmitting}>
          Add entry
        </Button>
      </form>
    </div>
  );
};

export const MyPatientsPage = () => {
  const [state, setState] = useState({ status: "loading", rows: [] });
  const [viewing, setViewing] = useState(null);

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
      {state.status === "success" && state.rows.length > 0 && (
        <Table columns={columns(setViewing)} rows={state.rows} />
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.firstName} ${viewing.lastName}` : ""} size="lg">
        {viewing && <PatientDetail patientId={viewing._id} onClose={() => setViewing(null)} />}
      </Modal>
    </div>
  );
};
