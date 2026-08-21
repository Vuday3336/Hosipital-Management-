import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Download, CreditCard } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { invoicesApi, patientsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

const emptyItem = { description: "", category: "other", quantity: 1, unitPrice: 0 };

export const BillingPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [patients, setPatients] = useState([]);

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { items: [emptyItem], taxRate: 0, discount: 0 },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const paymentForm = useForm({ defaultValues: { amount: "", paymentMethod: "cash" } });

  useEffect(() => {
    if (modalOpen && role !== "patient") patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
  }, [modalOpen, role]);

  const onSubmit = async (values) => {
    await invoicesApi.create({
      ...values,
      taxRate: Number(values.taxRate || 0),
      discount: Number(values.discount || 0),
      items: values.items.map((i) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    });
    reset({ items: [emptyItem], taxRate: 0, discount: 0 });
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const onRecordPayment = async (values) => {
    await invoicesApi.recordPayment(paymentTarget._id, { ...values, amount: Number(values.amount) });
    paymentForm.reset({ amount: "", paymentMethod: "cash" });
    setPaymentTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const openPaymentModal = (invoice) => {
    setPaymentTarget(invoice);
    paymentForm.reset({ amount: (invoice.totalAmount - invoice.paidAmount).toFixed(2), paymentMethod: "cash" });
  };

  const downloadPdf = async (id) => {
    const res = await invoicesApi.downloadPdf(id);
    window.open(res.data.pdfUrl, "_blank");
  };

  const canManagePayments = role === "admin" || role === "receptionist";

  const columns = [
    { key: "patient", header: "Patient", render: (i) => (i.patient ? `${i.patient.firstName} ${i.patient.lastName}` : "—") },
    { key: "totalAmount", header: "Total", render: (i) => `$${i.totalAmount.toFixed(2)}` },
    { key: "paidAmount", header: "Paid", render: (i) => `$${i.paidAmount.toFixed(2)}` },
    { key: "status", header: "Status", render: (i) => <Badge tone={i.paymentStatus}>{i.paymentStatus}</Badge> },
    { key: "actions", header: "", render: (i) => (
      <div className="flex items-center gap-3">
        {canManagePayments && i.paymentStatus !== "paid" && (
          <button
            onClick={() => openPaymentModal(i)}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
          >
            <CreditCard className="h-3 w-3" /> Record payment
          </button>
        )}
        <button onClick={() => downloadPdf(i._id)} className="flex items-center gap-1 text-xs font-medium text-ink/60 hover:underline">
          <Download className="h-3 w-3" /> PDF
        </button>
      </div>
    ) },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Billing"
        description="Itemized invoices per visit or admission."
        columns={columns}
        fetchFn={invoicesApi.list}
        searchable={false}
        createLabel={role !== "patient" ? "New invoice" : undefined}
        onCreate={role !== "patient" ? () => setModalOpen(true) : undefined}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New invoice" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Patient" {...register("patient", { required: true })}>
            <option value="">Select…</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
            ))}
          </Select>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink/80">Line items</p>
            <div className="space-y-2 overflow-x-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_130px_90px_110px_36px] items-end gap-2">
                  <Input placeholder="Description" {...register(`items.${index}.description`, { required: true })} />
                  <Select {...register(`items.${index}.category`)}>
                    {["consultation", "medicine", "room", "lab", "procedure", "other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  <Input type="number" placeholder="Qty" {...register(`items.${index}.quantity`, { required: true })} />
                  <Input type="number" step="0.01" placeholder="Price" {...register(`items.${index}.unitPrice`, { required: true })} />
                  <button type="button" onClick={() => remove(index)} className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => append(emptyItem)}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Tax rate (0-1)" type="number" step="0.01" {...register("taxRate")} />
            <Input label="Discount ($)" type="number" step="0.01" {...register("discount")} />
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Create invoice
          </Button>
        </form>
      </Modal>

      <Modal open={!!paymentTarget} onClose={() => setPaymentTarget(null)} title="Record payment">
        {paymentTarget && (
          <form onSubmit={paymentForm.handleSubmit(onRecordPayment)} className="space-y-4">
            <p className="text-sm text-ink/60">
              Balance due: <span className="font-medium text-ink">${(paymentTarget.totalAmount - paymentTarget.paidAmount).toFixed(2)}</span>
            </p>
            <Input label="Amount" type="number" step="0.01" {...paymentForm.register("amount", { required: true, min: 0.01 })} />
            <Select label="Payment method" {...paymentForm.register("paymentMethod", { required: true })}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </Select>
            <Button type="submit" loading={paymentForm.formState.isSubmitting} className="w-full">
              Record payment
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
};
