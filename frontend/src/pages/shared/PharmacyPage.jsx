import { useState } from "react";
import { useForm } from "react-hook-form";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { medicinesApi } from "../../api/resources.js";

export const PharmacyPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

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
      <div className="flex gap-2">
        <button onClick={() => adjust(m._id, 10)} className="text-xs font-medium text-brand-600 hover:underline">+10</button>
        <button onClick={() => adjust(m._id, -10)} className="text-xs font-medium text-red-500 hover:underline">-10</button>
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
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Generic name" {...register("genericName")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Stock qty" type="number" {...register("stockQuantity")} />
            <Input label="Reorder level" type="number" {...register("reorderLevel")} />
            <Input label="Unit price" type="number" step="0.01" {...register("unitPrice")} />
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Add medicine
          </Button>
        </form>
      </Modal>
    </>
  );
};
