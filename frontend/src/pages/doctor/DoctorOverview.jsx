import { useEffect, useState } from "react";
import { Users, CalendarClock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { StatCard } from "../../components/common/Card.jsx";
import { LoadingState, ErrorState } from "../../components/common/States.jsx";
import { analyticsApi } from "../../api/resources.js";

export const DoctorOverview = () => {
  const [state, setState] = useState({ status: "loading", data: null });

  const load = async () => {
    setState({ status: "loading", data: null });
    try {
      const res = await analyticsApi.doctorOverview();
      setState({ status: "success", data: res.data });
    } catch {
      setState({ status: "error", data: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <LoadingState label="Loading your patient load…" />;
  if (state.status === "error") return <ErrorState onRetry={load} />;

  const { totals, appointmentsByDay } = state.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Unique patients seen" value={totals.uniquePatients} icon={Users} />
        <StatCard label="Upcoming appointments" value={totals.upcomingAppointments} icon={CalendarClock} />
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-soft">
        <h3 className="font-display text-base font-semibold">Appointments, last 30 days</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={appointmentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0f7a6b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
