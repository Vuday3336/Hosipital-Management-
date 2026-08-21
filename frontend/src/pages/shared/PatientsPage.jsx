import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { patientsApi } from "../../api/resources.js";
import { createPatientSchema, updatePatientSchema } from "../../schemas/patient.schema.js";

const BLOOD_GROUPS = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PatientForm = ({ defaultValues, onSubmit, submitLabel, schema }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  return (
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
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </Select>
        <Input label="Phone" {...register("phone")} />
      </div>
      <Input label="Email (optional)" type="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
};

export const PatientsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onCreate = async (values) => {
    await patientsApi.create({ ...values, email: values.email || undefined });
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const onUpdate = async (values) => {
    await patientsApi.update(editTarget._id, {
      ...values,
      email: values.email || undefined,
      dob: values.dob || undefined,
      gender: values.gender || undefined,
    });
    setEditTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const columns = [
    { key: "name", header: "Name", render: (p) => `${p.firstName} ${p.lastName}` },
    { key: "gender", header: "Gender", render: (p) => p.gender || "—" },
    { key: "bloodGroup", header: "Blood group" },
    { key: "phone", header: "Phone", render: (p) => p.phone || "—" },
    { key: "createdAt", header: "Registered", render: (p) => new Date(p.createdAt).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <button
          onClick={() => setEditTarget(p)}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      ),
    },
  ];

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
        <PatientForm
          key="create"
          defaultValues={{ bloodGroup: "unknown" }}
          onSubmit={onCreate}
          submitLabel="Register patient"
          schema={createPatientSchema}
        />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit patient">
        {editTarget && (
          <PatientForm
            key={editTarget._id}
            defaultValues={{
              firstName: editTarget.firstName,
              lastName: editTarget.lastName,
              dob: editTarget.dob ? editTarget.dob.slice(0, 10) : "",
              gender: editTarget.gender || "",
              bloodGroup: editTarget.bloodGroup || "unknown",
              phone: editTarget.phone || "",
              email: editTarget.email || "",
            }}
            onSubmit={onUpdate}
            submitLabel="Save changes"
            schema={updatePatientSchema}
          />
        )}
      </Modal>
    </>
  );
};
