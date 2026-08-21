import { useState } from "react";
import { useForm } from "react-hook-form";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { staffApi } from "../../api/resources.js";

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
  { key: "status", header: "Status", render: (u) => <Badge tone={u.isActive ? "confirmed" : "cancelled"}>{u.isActive ? "Active" : "Disabled"}</Badge> },
];

export const StaffPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    await staffApi.create(values);
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Staff accounts"
        description="Admin and receptionist accounts."
        columns={columns}
        fetchFn={staffApi.list}
        createLabel="Add staff"
        onCreate={() => setModalOpen(true)}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add staff account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" {...register("name", { required: true })} />
          <Input label="Email" type="email" {...register("email", { required: true })} />
          <Input label="Temporary password" type="password" {...register("password", { required: true, minLength: 8 })} />
          <Select label="Role" {...register("role", { required: true })}>
            <option value="">Select…</option>
            <option value="receptionist">Receptionist</option>
            <option value="admin">Admin</option>
          </Select>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Add staff
          </Button>
        </form>
      </Modal>
    </>
  );
};
