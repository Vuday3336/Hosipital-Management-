import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { doctorsApi, departmentsApi } from "../../api/resources.js";

const columns = (onEdit) => [
  { key: "name", header: "Name", render: (d) => d.user?.name || "—" },
  { key: "specialization", header: "Specialization" },
  { key: "department", header: "Department", render: (d) => d.department?.name || "—" },
  { key: "fee", header: "Fee", render: (d) => `$${d.consultationFee}` },
  {
    key: "status",
    header: "Status",
    render: (d) => <Badge tone={d.isAvailable ? "confirmed" : "cancelled"}>{d.isAvailable ? "Available" : "Unavailable"}</Badge>,
  },
  {
    key: "actions",
    header: "",
    render: (d) => (
      <button onClick={() => onEdit(d)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
        <Pencil className="h-3 w-3" /> Edit
      </button>
    ),
  },
];

export const DoctorsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [departments, setDepartments] = useState([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const editForm = useForm();

  useEffect(() => {
    if (modalOpen || editTarget) departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data));
  }, [modalOpen, editTarget]);

  useEffect(() => {
    if (editTarget) {
      editForm.reset({
        department: editTarget.department?._id || "",
        specialization: editTarget.specialization,
        experienceYears: editTarget.experienceYears,
        consultationFee: editTarget.consultationFee,
        isAvailable: editTarget.isAvailable,
      });
    }
  }, [editTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    await doctorsApi.create({ ...values, experienceYears: Number(values.experienceYears || 0), consultationFee: Number(values.consultationFee || 0) });
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const onEditSubmit = async (values) => {
    await doctorsApi.update(editTarget._id, {
      ...values,
      experienceYears: Number(values.experienceYears || 0),
      consultationFee: Number(values.consultationFee || 0),
    });
    setEditTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Doctors"
        description="Clinical staff and their assigned departments."
        columns={columns(setEditTarget)}
        fetchFn={doctorsApi.list}
        createLabel="Add doctor"
        onCreate={() => setModalOpen(true)}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add doctor">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" error={errors.name?.message} {...register("name", { required: true })} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: true })} />
          <Input label="Temporary password" type="password" {...register("password", { required: true, minLength: 8 })} />
          <Select label="Department" {...register("department", { required: true })}>
            <option value="">Select…</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </Select>
          <Input label="Specialization" {...register("specialization", { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Experience (years)" type="number" {...register("experienceYears")} />
            <Input label="Consultation fee" type="number" {...register("consultationFee")} />
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Add doctor
          </Button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit doctor">
        {editTarget && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <Input label="Name" value={editTarget.user?.name || ""} disabled className="opacity-60" />
            <Select label="Department" {...editForm.register("department", { required: true })}>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </Select>
            <Input label="Specialization" {...editForm.register("specialization", { required: true })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Experience (years)" type="number" {...editForm.register("experienceYears")} />
              <Input label="Consultation fee" type="number" {...editForm.register("consultationFee")} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...editForm.register("isAvailable")} />
              Accepting new appointments
            </label>
            <Button type="submit" loading={editForm.formState.isSubmitting} className="w-full">
              Save changes
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
};
