import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { departmentsApi } from "../../api/resources.js";

const columns = (onEdit) => [
  { key: "name", header: "Department" },
  { key: "description", header: "Description", render: (d) => d.description || "—" },
  { key: "headDoctor", header: "Head doctor", render: (d) => d.headDoctor?.specialization || "Unassigned" },
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

export const DepartmentsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const editForm = useForm();

  const onSubmit = async (values) => {
    await departmentsApi.create(values);
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const openEdit = (dept) => {
    setEditTarget(dept);
    editForm.reset({ name: dept.name, description: dept.description || "" });
  };

  const onEditSubmit = async (values) => {
    await departmentsApi.update(editTarget._id, values);
    setEditTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Departments"
        description="Clinical departments and their heads."
        columns={columns(openEdit)}
        fetchFn={departmentsApi.list}
        searchable={false}
        createLabel="Add department"
        onCreate={() => setModalOpen(true)}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add department">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" required {...register("name")} />
          <Input label="Description" {...register("description")} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Add department
          </Button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit department">
        {editTarget && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <Input label="Name" required {...editForm.register("name")} />
            <Input label="Description" {...editForm.register("description")} />
            <Button type="submit" loading={editForm.formState.isSubmitting} className="w-full">
              Save changes
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
};
