import { useEffect, useState } from "react";
import { Users, Stethoscope, BedDouble, PackageX } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "../../components/common/Card.jsx";
import { LoadingState, ErrorState } from "../../components/common/States.jsx";
import { analyticsApi } from "../../api/resources.js";

const STATUS_COLORS = { pending: "#a6690a", confirmed: "#2f5f9e", completed: "#0f7a6b", cancelled: "#b6433f" };

export const AdminOverview = () => {
  const [state, setState] = useState({ status: "loading", data: null });

  const load = async () => {
    setState({ status: "loading", data: null });
    try {
      const res = await analyticsApi.adminOverview();
      setState({ status: "success", data: res.data });
    } catch {
      setState({ status: "error", data: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <LoadingState label="Crunching hospital-wide numbers…" />;
  if (state.status === "error") return <ErrorState onRetry={load} />;

  const { totals, appointmentsByStatus, appointmentsByDepartment, revenueByMonth } = state.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total patients" value={totals.patients} icon={Users} />
        <StatCard label="Total doctors" value={totals.doctors} icon={Stethoscope} />
        <StatCard label="Currently admitted" value={totals.admitted} icon={BedDouble} />
        <StatCard label="Low stock medicines" value={totals.lowStockMedicines} icon={PackageX} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-soft lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Revenue, last 6 months</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f7a6b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0f7a6b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#0f7a6b" strokeWidth={2} fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold">Appointments by status</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appointmentsByStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {appointmentsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#8a9793"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-soft">
        <h3 className="font-display text-base font-semibold">Appointment load by department</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appointmentsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip />
              <Bar dataKey="count" fill="#3bb99b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
