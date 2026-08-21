import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { admissionsApi, patientsApi, doctorsApi, wardsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

export const AdmissionsPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedWard, setSelectedWard] = useState("");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const dischargeForm = useForm();

  useEffect(() => {
    if (modalOpen) {
      patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
      doctorsApi.list({ limit: 100 }).then((res) => setDoctors(res.data));
      wardsApi.list().then((res) => setWards(res.data));
    }
  }, [modalOpen]);

  useEffect(() => {
    if (selectedWard) wardsApi.listBeds({ ward: selectedWard, available: "true" }).then((res) => setBeds(res.data));
  }, [selectedWard]);

  const onSubmit = async (values) => {
    await admissionsApi.create(values);
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const onDischarge = async (values) => {
    await admissionsApi.discharge(dischargeTarget, values);
    dischargeForm.reset();
    setDischargeTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const canManage = role === "admin" || role === "receptionist" || role === "doctor";

  const columns = [
    { key: "patient", header: "Patient", render: (a) => (a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "—") },
    { key: "ward", header: "Ward / Bed", render: (a) => `${a.ward?.name || "—"} / ${a.bed?.bedNumber || "—"}` },
    { key: "admissionDate", header: "Admitted", render: (a) => new Date(a.admissionDate).toLocaleDateString() },
    { key: "status", header: "Status", render: (a) => <Badge tone={a.status}>{a.status}</Badge> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (a) =>
              a.status === "admitted" ? (
                <button onClick={() => setDischargeTarget(a._id)} className="text-xs font-medium text-brand-600 hover:underline">
                  Discharge
                </button>
              ) : (
                a.dischargeSummary?.pdfUrl && (
                  <a href={a.dischargeSummary.pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                    Discharge PDF
                  </a>
                )
              ),
          },
        ]
      : []),
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Admissions"
        description="Ward and bed assignment for admitted patients."
        columns={columns}
        fetchFn={admissionsApi.list}
        searchable={false}
        createLabel={role !== "doctor" ? "Admit patient" : undefined}
        onCreate={role !== "doctor" ? () => setModalOpen(true) : undefined}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Admit patient">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Patient" {...register("patient", { required: true })}>
            <option value="">Select…</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </Select>
          <Select label="Attending doctor" {...register("attendingDoctor", { required: true })}>
            <option value="">Select…</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>
            ))}
          </Select>
          <Select label="Ward" {...register("ward", { required: true, onChange: (e) => setSelectedWard(e.target.value) })}>
            <option value="">Select…</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.type})</option>
            ))}
          </Select>
          <Select label="Bed" {...register("bed", { required: true })}>
            <option value="">Select…</option>
            {beds.map((b) => (
              <option key={b._id} value={b._id}>{b.bedNumber}</option>
            ))}
          </Select>
          <Input label="Reason for admission" {...register("reasonForAdmission", { required: true })} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Admit patient
          </Button>
        </form>
      </Modal>

      <Modal open={!!dischargeTarget} onClose={() => setDischargeTarget(null)} title="Discharge patient">
        <form onSubmit={dischargeForm.handleSubmit(onDischarge)} className="space-y-4">
          <Input label="Discharge summary" {...dischargeForm.register("summary", { required: true })} />
          <Input label="Follow-up instructions" {...dischargeForm.register("followUpInstructions")} />
          <Button type="submit" loading={dischargeForm.formState.isSubmitting} className="w-full">
            Discharge & generate PDF
          </Button>
        </form>
      </Modal>
    </>
  );
};
