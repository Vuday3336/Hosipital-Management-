import { useState } from "react";
import { useForm } from "react-hook-form";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { departmentsApi } from "../../api/resources.js";

const columns = [
  { key: "name", header: "Department" },
  { key: "description", header: "Description", render: (d) => d.description || "—" },
  { key: "headDoctor", header: "Head doctor", render: (d) => d.headDoctor?.specialization || "Unassigned" },
];

export const DepartmentsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    await departmentsApi.create(values);
    reset();
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Departments"
        description="Clinical departments and their heads."
        columns={columns}
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
    </>
  );
};
