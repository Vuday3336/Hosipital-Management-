import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input, Select } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { staffApi } from "../../api/resources.js";

const columns = (onEdit) => [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
  { key: "status", header: "Status", render: (u) => <Badge tone={u.isActive ? "confirmed" : "cancelled"}>{u.isActive ? "Active" : "Disabled"}</Badge> },
  {
    key: "actions",
    header: "",
    render: (u) => (
      <button onClick={() => onEdit(u)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
        <Pencil className="h-3 w-3" /> Edit
      </button>
    ),
  },
];

export const StaffPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    await staffApi.create(values);
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const toggleActive = async () => {
    await staffApi.setActive(editTarget.id, !editTarget.isActive);
    setEditTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Staff accounts"
        description="Admin and receptionist accounts."
        columns={columns(setEditTarget)}
        fetchFn={staffApi.list}
        rowKey="id"
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

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit staff account">
        {editTarget && (
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium text-ink">{editTarget.name}</p>
              <p className="text-ink/50">{editTarget.email} · <span className="capitalize">{editTarget.role}</span></p>
            </div>
            <p className="text-sm text-ink/60">
              {editTarget.isActive
                ? "This account can currently sign in and use the system."
                : "This account is disabled and cannot sign in."}
            </p>
            <Button variant={editTarget.isActive ? "danger" : "primary"} className="w-full" onClick={toggleActive}>
              {editTarget.isActive ? "Disable account" : "Re-enable account"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};
