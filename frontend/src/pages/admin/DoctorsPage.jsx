import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { doctorsApi, departmentsApi } from "../../api/resources.js";

const columns = [
  { key: "name", header: "Name", render: (d) => d.user?.name || "—" },
  { key: "specialization", header: "Specialization" },
  { key: "department", header: "Department", render: (d) => d.department?.name || "—" },
  { key: "fee", header: "Fee", render: (d) => `$${d.consultationFee}` },
  { key: "status", header: "Status", render: (d) => (d.isAvailable ? "Available" : "Unavailable") },
];

export const DoctorsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [departments, setDepartments] = useState([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (modalOpen) departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data));
  }, [modalOpen]);

  const onSubmit = async (values) => {
    await doctorsApi.create({ ...values, experienceYears: Number(values.experienceYears || 0), consultationFee: Number(values.consultationFee || 0) });
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Doctors"
        description="Clinical staff and their assigned departments."
        columns={columns}
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
    </>
  );
};
