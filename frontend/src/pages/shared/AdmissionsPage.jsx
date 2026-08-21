import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BedDouble } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { admissionsApi, patientsApi, doctorsApi, wardsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

const WardsManager = ({ onWardsChanged }) => {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const wardForm = useForm({ defaultValues: { type: "general" } });
  const bedForm = useForm();

  const loadAll = async () => {
    const [wardRes, bedRes] = await Promise.all([wardsApi.list(), wardsApi.listBeds({})]);
    setWards(wardRes.data);
    setBeds(bedRes.data);
    onWardsChanged?.();
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAddWard = async (values) => {
    await wardsApi.create({ ...values, floor: Number(values.floor || 0), totalBeds: Number(values.totalBeds || 0) });
    wardForm.reset({ type: "general" });
    loadAll();
  };

  const onAddBed = async (values) => {
    await wardsApi.createBed(values);
    bedForm.reset();
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">Wards</h4>
        <div className="mb-3 space-y-1.5">
          {wards.length === 0 && <p className="text-sm text-ink/45">No wards yet — add one below.</p>}
          {wards.map((w) => (
            <div key={w._id} className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2 text-sm">
              <span className="font-medium text-ink">{w.name}</span>
              <span className="text-ink/50">{w.type} · {beds.filter((b) => b.ward?._id === w._id || b.ward === w._id).length} bed(s)</span>
            </div>
          ))}
        </div>
        <form onSubmit={wardForm.handleSubmit(onAddWard)} className="grid grid-cols-2 gap-2">
          <Input placeholder="Ward name" {...wardForm.register("name", { required: true })} />
          <Select {...wardForm.register("type")}>
            <option value="general">General</option>
            <option value="icu">ICU</option>
            <option value="private">Private</option>
            <option value="maternity">Maternity</option>
            <option value="pediatric">Pediatric</option>
          </Select>
          <Button type="submit" size="sm" variant="secondary" className="col-span-2" loading={wardForm.formState.isSubmitting}>
            Add ward
          </Button>
        </form>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">Beds</h4>
        <form onSubmit={bedForm.handleSubmit(onAddBed)} className="grid grid-cols-2 gap-2">
          <Select {...bedForm.register("ward", { required: true })}>
            <option value="">Select ward…</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </Select>
          <Input placeholder="Bed number (e.g. B-12)" {...bedForm.register("bedNumber", { required: true })} />
          <Button type="submit" size="sm" variant="secondary" className="col-span-2" loading={bedForm.formState.isSubmitting}>
            Add bed
          </Button>
        </form>
      </div>
    </div>
  );
};

export const AdmissionsPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [wardsModalOpen, setWardsModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedWard, setSelectedWard] = useState("");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const dischargeForm = useForm();

  const loadWards = () => wardsApi.list().then((res) => setWards(res.data));

  useEffect(() => {
    if (modalOpen) {
      patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
      doctorsApi.list({ limit: 100 }).then((res) => setDoctors(res.data));
      loadWards();
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
      <div className="mb-4 flex justify-end gap-2">
        {role === "admin" && (
          <Button variant="secondary" size="sm" onClick={() => setWardsModalOpen(true)}>
            <BedDouble className="h-4 w-4" /> Manage wards & beds
          </Button>
        )}
      </div>

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
            <option value="">{wards.length ? "Select…" : "No wards yet — ask an admin to add one"}</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.type})</option>
            ))}
          </Select>
          <Select label="Bed" {...register("bed", { required: true })}>
            <option value="">{beds.length ? "Select…" : "Select a ward first"}</option>
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

      <Modal open={wardsModalOpen} onClose={() => setWardsModalOpen(false)} title="Manage wards & beds">
        <WardsManager onWardsChanged={loadWards} />
      </Modal>
    </>
  );
};
