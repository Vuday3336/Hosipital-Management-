import { api, unwrap } from "./axios.js";

// Thin, uniform wrappers over the REST list/CRUD endpoints — one factory per collection
// keeps every feature page calling the same shapes instead of hand-rolling axios calls.
const resource = (base) => ({
  list: (params) => unwrap(api.get(base, { params })),
  get: (id) => unwrap(api.get(`${base}/${id}`)),
  create: (payload) => unwrap(api.post(base, payload)),
  update: (id, payload) => unwrap(api.patch(`${base}/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`${base}/${id}`)),
});

export const patientsApi = {
  ...resource("/patients"),
  me: () => unwrap(api.get("/patients/me")),
  addMedicalHistory: (id, payload) => unwrap(api.post(`/patients/${id}/medical-history`, payload)),
};

export const doctorsApi = {
  ...resource("/doctors"),
  me: () => unwrap(api.get("/doctors/me")),
  setSchedule: (id, schedule) => unwrap(api.put(`/doctors/${id}/schedule`, { schedule })),
  deactivate: (id) => unwrap(api.post(`/doctors/${id}/deactivate`)),
};

export const departmentsApi = resource("/departments");

export const staffApi = {
  ...resource("/staff"),
  setActive: (id, isActive) => unwrap(api.patch(`/staff/${id}/status`, { isActive })),
};

export const appointmentsApi = {
  ...resource("/appointments"),
  availability: (doctorId, date) => unwrap(api.get(`/appointments/availability/${doctorId}`, { params: { date } })),
  updateStatus: (id, status, notes) => unwrap(api.patch(`/appointments/${id}/status`, { status, notes })),
  reschedule: (id, payload) => unwrap(api.patch(`/appointments/${id}/reschedule`, payload)),
  cancel: (id) => unwrap(api.post(`/appointments/${id}/cancel`)),
};

export const prescriptionsApi = resource("/prescriptions");

export const wardsApi = {
  list: () => unwrap(api.get("/wards")),
  create: (payload) => unwrap(api.post("/wards", payload)),
  listBeds: (params) => unwrap(api.get("/wards/beds/all", { params })),
  createBed: (payload) => unwrap(api.post("/wards/beds", payload)),
};

export const admissionsApi = {
  ...resource("/admissions"),
  discharge: (id, payload) => unwrap(api.post(`/admissions/${id}/discharge`, payload)),
};

export const medicinesApi = {
  ...resource("/medicines"),
  adjustStock: (id, delta, reason) => unwrap(api.patch(`/medicines/${id}/stock`, { delta, reason })),
  dispense: (payload) => unwrap(api.post("/medicines/dispense", payload)),
  dispensingLogs: (params) => unwrap(api.get("/medicines/dispensing-logs", { params })),
};

export const invoicesApi = {
  ...resource("/invoices"),
  recordPayment: (id, payload) => unwrap(api.post(`/invoices/${id}/payments`, payload)),
  downloadPdf: (id) => unwrap(api.get(`/invoices/${id}/pdf`)),
};

export const analyticsApi = {
  adminOverview: () => unwrap(api.get("/analytics/admin-overview")),
  doctorOverview: () => unwrap(api.get("/analytics/doctor-overview")),
};

export const notificationsApi = {
  list: (params) => unwrap(api.get("/notifications", { params })),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch("/notifications/read-all")),
};
