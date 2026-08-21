import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { patientsApi } from "../../api/resources.js";
import { createPatientSchema } from "../../schemas/patient.schema.js";

const columns = [
  { key: "name", header: "Name", render: (p) => `${p.firstName} ${p.lastName}` },
  { key: "gender", header: "Gender" },
  { key: "bloodGroup", header: "Blood group" },
  { key: "phone", header: "Phone", render: (p) => p.phone || "—" },
  { key: "createdAt", header: "Registered", render: (p) => new Date(p.createdAt).toLocaleDateString() },
];

export const PatientsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createPatientSchema), defaultValues: { bloodGroup: "unknown" } });

  const onSubmit = async (values) => {
    await patientsApi.create({ ...values, email: values.email || undefined });
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Patients"
        description="Registered patients across the hospital."
        columns={columns}
        fetchFn={patientsApi.list}
        createLabel="Register patient"
        onCreate={() => setModalOpen(true)}
        emptyHint="Register your first patient to get started."
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register patient">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date of birth" type="date" error={errors.dob?.message} {...register("dob")} />
            <Select label="Gender" error={errors.gender?.message} {...register("gender")}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Blood group" {...register("bloodGroup")}>
              {["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </Select>
            <Input label="Phone" {...register("phone")} />
          </div>
          <Input label="Email (optional)" type="email" error={errors.email?.message} {...register("email")} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Register patient
          </Button>
        </form>
      </Modal>
    </>
  );
};
