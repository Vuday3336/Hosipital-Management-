import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { prescriptionsApi, patientsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

const emptyMedicine = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

export const PrescriptionsPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState([]);

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { medicines: [emptyMedicine] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

  useEffect(() => {
    if (modalOpen) patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
  }, [modalOpen]);

  const onSubmit = async (values) => {
    await prescriptionsApi.create(values);
    reset({ medicines: [emptyMedicine] });
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const columns = [
    { key: "patient", header: "Patient", render: (p) => (p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : "—") },
    { key: "doctor", header: "Doctor", render: (p) => (p.doctor?.user ? `Dr. ${p.doctor.user.name}` : "—") },
    { key: "diagnosis", header: "Diagnosis" },
    { key: "medicines", header: "Medicines", render: (p) => p.medicines.map((m) => m.name).join(", ") },
    { key: "createdAt", header: "Date", render: (p) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Prescriptions"
        description={role === "doctor" ? "Prescriptions you've written." : "Your prescription history."}
        columns={columns}
        fetchFn={prescriptionsApi.list}
        searchable={false}
        createLabel={role === "doctor" ? "Write prescription" : undefined}
        onCreate={role === "doctor" ? () => setModalOpen(true) : undefined}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Write prescription">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Patient" {...register("patient", { required: true })}>
            <option value="">Select…</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </Select>
          <Input label="Diagnosis" {...register("diagnosis", { required: true })} />

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink/80">Medicines</p>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                <Input placeholder="Name" {...register(`medicines.${index}.name`, { required: true })} />
                <Input placeholder="Dosage" {...register(`medicines.${index}.dosage`, { required: true })} />
                <Input placeholder="Frequency" {...register(`medicines.${index}.frequency`, { required: true })} />
                <Input placeholder="Duration" {...register(`medicines.${index}.duration`, { required: true })} />
                <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => append(emptyMedicine)}>
              <Plus className="h-4 w-4" /> Add medicine
            </Button>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Save prescription
          </Button>
        </form>
      </Modal>
    </>
  );
};
