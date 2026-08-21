import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Pill } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { medicinesApi, patientsApi } from "../../api/resources.js";

const medicineFields = ({ register }) => (
  <>
    <Input label="Name" {...register("name", { required: true })} />
    <Input label="Generic name" {...register("genericName")} />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Category" {...register("category")} />
      <Input label="Manufacturer" {...register("manufacturer")} />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Input label="Stock qty" type="number" {...register("stockQuantity")} />
      <Input label="Reorder level" type="number" {...register("reorderLevel")} />
      <Input label="Unit price" type="number" step="0.01" {...register("unitPrice")} />
    </div>
  </>
);

export const PharmacyPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [dispenseTarget, setDispenseTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState([]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const editForm = useForm();
  const dispenseForm = useForm({ defaultValues: { quantity: 1 } });

  useEffect(() => {
    if (dispenseTarget) patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
  }, [dispenseTarget]);

  const onSubmit = async (values) => {
    await medicinesApi.create({
      ...values,
      stockQuantity: Number(values.stockQuantity || 0),
      reorderLevel: Number(values.reorderLevel || 20),
      unitPrice: Number(values.unitPrice || 0),
    });
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const openEdit = (medicine) => {
    setEditTarget(medicine);
    editForm.reset({
      name: medicine.name,
      genericName: medicine.genericName || "",
      category: medicine.category || "",
      manufacturer: medicine.manufacturer || "",
      stockQuantity: medicine.stockQuantity,
      reorderLevel: medicine.reorderLevel,
      unitPrice: medicine.unitPrice,
    });
  };

  const onEditSubmit = async (values) => {
    await medicinesApi.update(editTarget._id, {
      ...values,
      stockQuantity: Number(values.stockQuantity),
      reorderLevel: Number(values.reorderLevel),
      unitPrice: Number(values.unitPrice),
    });
    setEditTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const onDispenseSubmit = async (values) => {
    await medicinesApi.dispense({ medicine: dispenseTarget._id, patient: values.patient, quantity: Number(values.quantity) });
    dispenseForm.reset({ quantity: 1 });
    setDispenseTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const adjust = async (id, delta) => {
    await medicinesApi.adjustStock(id, delta);
    setRefreshKey((k) => k + 1);
  };

  const columns = [
    { key: "name", header: "Medicine", render: (m) => (
      <div>
        <p className="font-medium">{m.name}</p>
        {m.genericName && <p className="text-xs text-ink/40">{m.genericName}</p>}
      </div>
    ) },
    { key: "stock", header: "Stock", render: (m) => (
      <div className="flex items-center gap-2">
        <span>{m.stockQuantity} {m.unit}</span>
        {m.stockQuantity <= m.reorderLevel && <Badge tone="cancelled">Low</Badge>}
      </div>
    ) },
    { key: "unitPrice", header: "Unit price", render: (m) => `$${m.unitPrice.toFixed(2)}` },
    { key: "actions", header: "", render: (m) => (
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => adjust(m._id, 10)} className="text-xs font-medium text-brand-600 hover:underline">+10</button>
        <button onClick={() => adjust(m._id, -10)} className="text-xs font-medium text-red-500 hover:underline">-10</button>
        <button onClick={() => setDispenseTarget(m)} className="flex items-center gap-1 text-xs font-medium text-ink/60 hover:underline">
          <Pill className="h-3 w-3" /> Dispense
        </button>
        <button onClick={() => openEdit(m)} className="flex items-center gap-1 text-xs font-medium text-ink/60 hover:underline">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
    ) },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Pharmacy inventory"
        description="Stock levels across all medicines. Admins are alerted automatically when stock drops to reorder level."
        columns={columns}
        fetchFn={medicinesApi.list}
        createLabel="Add medicine"
        onCreate={() => setModalOpen(true)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add medicine">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {medicineFields({ register })}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Add medicine
          </Button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit medicine">
        {editTarget && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            {medicineFields({ register: editForm.register })}
            <Button type="submit" loading={editForm.formState.isSubmitting} className="w-full">
              Save changes
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={!!dispenseTarget} onClose={() => setDispenseTarget(null)} title="Dispense medicine">
        {dispenseTarget && (
          <form onSubmit={dispenseForm.handleSubmit(onDispenseSubmit)} className="space-y-4">
            <p className="text-sm text-ink/60">
              Dispensing <span className="font-medium text-ink">{dispenseTarget.name}</span> — {dispenseTarget.stockQuantity} {dispenseTarget.unit} in stock.
            </p>
            <Select label="Patient" {...dispenseForm.register("patient", { required: true })}>
              <option value="">Select…</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
              ))}
            </Select>
            <Input
              label="Quantity"
              type="number"
              min={1}
              max={dispenseTarget.stockQuantity}
              {...dispenseForm.register("quantity", { required: true, min: 1, max: dispenseTarget.stockQuantity })}
            />
            <Button type="submit" loading={dispenseForm.formState.isSubmitting} className="w-full">
              Dispense
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
};
