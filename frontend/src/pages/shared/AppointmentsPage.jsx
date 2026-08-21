import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ResourceListPage } from "../../components/common/ResourceListPage.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Select } from "../../components/common/Input.jsx";
import { appointmentsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

export const AppointmentsPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const setStatus = async (id, status) => {
    await appointmentsApi.updateStatus(id, status);
    setRefreshKey((k) => k + 1);
  };

  const canBook = role === "patient" || role === "receptionist" || role === "admin";
  const canManage = role === "doctor" || role === "receptionist" || role === "admin";

  const columns = [
    { key: "date", header: "Date", render: (a) => `${a.date} · ${a.startTime}-${a.endTime}` },
    { key: "patient", header: "Patient", render: (a) => (a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "—") },
    { key: "doctor", header: "Doctor", render: (a) => (a.doctor?.user ? `Dr. ${a.doctor.user.name}` : "—") },
    { key: "status", header: "Status", render: (a) => <Badge tone={a.status}>{a.status}</Badge> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (a) =>
              a.status !== "completed" && a.status !== "cancelled" ? (
                <div className="flex gap-2">
                  {a.status === "pending" && (
                    <button onClick={() => setStatus(a._id, "confirmed")} className="text-xs font-medium text-brand-600 hover:underline">
                      Confirm
                    </button>
                  )}
                  {a.status === "confirmed" && (
                    <button onClick={() => setStatus(a._id, "completed")} className="text-xs font-medium text-brand-600 hover:underline">
                      Mark complete
                    </button>
                  )}
                  <button onClick={() => setStatus(a._id, "cancelled")} className="text-xs font-medium text-red-500 hover:underline">
                    Cancel
                  </button>
                </div>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <ResourceListPage
      key={refreshKey}
      title="Appointments"
      description="Scheduled visits across the hospital."
      columns={columns}
      fetchFn={appointmentsApi.list}
      searchable={false}
      extraFilters={(filters, setFilters) => (
        <Select
          value={filters.status || ""}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          className="w-40"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      )}
      createLabel={canBook ? "Book appointment" : undefined}
      onCreate={canBook ? () => navigate("book") : undefined}
      emptyHint={
        canBook ? (
          <Link to="book">
            <Button size="sm">Book the first appointment</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
