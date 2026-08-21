import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Select, Input } from "../../components/common/Input.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Card } from "../../components/common/Card.jsx";
import { LoadingState, EmptyState } from "../../components/common/States.jsx";
import { doctorsApi, appointmentsApi, patientsApi } from "../../api/resources.js";
import { useAuthStore } from "../../store/authStore.js";

export const BookAppointmentPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [slots, setSlots] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    doctorsApi.list({ limit: 100 }).then((res) => setDoctors(res.data));
    if (role === "patient") {
      patientsApi.me().then((res) => setPatientId(res.data.patient._id)).catch(() => {});
    } else {
      patientsApi.list({ limit: 100 }).then((res) => setPatients(res.data));
    }
  }, [role]);

  useEffect(() => {
    if (!doctorId || !date) return;
    setSlots(null);
    setSelectedSlot(null);
    appointmentsApi.availability(doctorId, date).then((res) => setSlots(res.data.slots));
  }, [doctorId, date]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        doctor: doctorId,
        patient: patientId,
        date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason,
      });
      navigate("..", { relative: "path" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not book this slot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Book an appointment</h2>
        <p className="mt-1 text-sm text-ink/50">Pick a doctor and date to see live availability.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          {role !== "patient" && (
            <Select label="Patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
              <option value="">Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>Dr. {d.user?.name} — {d.specialization}</option>
              ))}
            </Select>
            <Input label="Date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {doctorId && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink/80">Available slots</p>
              {slots === null && <LoadingState label="Checking availability…" />}
              {slots?.length === 0 && <EmptyState title="No slots this day" hint="Try a different date." />}
              {slots?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.startTime}
                      disabled={!s.available}
                      onClick={() => setSelectedSlot(s)}
                      className={clsx(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        !s.available && "cursor-not-allowed border-black/5 bg-black/[0.02] text-ink/25 line-through",
                        s.available && selectedSlot?.startTime === s.startTime && "border-brand-500 bg-brand-500 text-white",
                        s.available && selectedSlot?.startTime !== s.startTime && "border-black/10 text-ink/70 hover:border-brand-400"
                      )}
                    >
                      {s.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Input label="Reason for visit (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={!selectedSlot} loading={submitting}>
            Confirm booking
          </Button>
        </form>
      </Card>
    </div>
  );
};
