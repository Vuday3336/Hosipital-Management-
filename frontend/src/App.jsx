import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthBootstrap } from "./hooks/useAuth.js";
import { ProtectedRoute, RoleRoute } from "./routes/ProtectedRoute.jsx";
import { DashboardLayout } from "./components/layout/DashboardLayout.jsx";
import { LoadingState } from "./components/common/States.jsx";

// Every page below is route-level code-split: the entry bundle only ships the
// shell (router, layout, auth store) — each role's dashboard, and heavy deps
// like Recharts, load on navigation instead of on first paint.
const Landing = lazy(() => import("./pages/public/Landing.jsx").then((m) => ({ default: m.Landing })));
const Login = lazy(() => import("./pages/public/Login.jsx").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/public/Register.jsx").then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword.jsx").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword.jsx").then((m) => ({ default: m.ResetPassword })));
const NotFound = lazy(() => import("./pages/public/NotFound.jsx").then((m) => ({ default: m.NotFound })));

const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.jsx").then((m) => ({ default: m.AdminOverview })));
const DoctorsPage = lazy(() => import("./pages/admin/DoctorsPage.jsx").then((m) => ({ default: m.DoctorsPage })));
const DepartmentsPage = lazy(() => import("./pages/admin/DepartmentsPage.jsx").then((m) => ({ default: m.DepartmentsPage })));
const StaffPage = lazy(() => import("./pages/admin/StaffPage.jsx").then((m) => ({ default: m.StaffPage })));

const DoctorOverview = lazy(() => import("./pages/doctor/DoctorOverview.jsx").then((m) => ({ default: m.DoctorOverview })));
const MyPatientsPage = lazy(() => import("./pages/doctor/MyPatientsPage.jsx").then((m) => ({ default: m.MyPatientsPage })));

const ReceptionistOverview = lazy(() =>
  import("./pages/receptionist/ReceptionistOverview.jsx").then((m) => ({ default: m.ReceptionistOverview }))
);

const PatientOverview = lazy(() => import("./pages/patient/PatientOverview.jsx").then((m) => ({ default: m.PatientOverview })));
const PatientRecords = lazy(() => import("./pages/patient/PatientRecords.jsx").then((m) => ({ default: m.PatientRecords })));

const PatientsPage = lazy(() => import("./pages/shared/PatientsPage.jsx").then((m) => ({ default: m.PatientsPage })));
const AppointmentsPage = lazy(() => import("./pages/shared/AppointmentsPage.jsx").then((m) => ({ default: m.AppointmentsPage })));
const BookAppointmentPage = lazy(() =>
  import("./pages/shared/BookAppointmentPage.jsx").then((m) => ({ default: m.BookAppointmentPage }))
);
const AdmissionsPage = lazy(() => import("./pages/shared/AdmissionsPage.jsx").then((m) => ({ default: m.AdmissionsPage })));
const PharmacyPage = lazy(() => import("./pages/shared/PharmacyPage.jsx").then((m) => ({ default: m.PharmacyPage })));
const BillingPage = lazy(() => import("./pages/shared/BillingPage.jsx").then((m) => ({ default: m.BillingPage })));
const PrescriptionsPage = lazy(() =>
  import("./pages/shared/PrescriptionsPage.jsx").then((m) => ({ default: m.PrescriptionsPage }))
);

const AppointmentRoutes = () => (
  <>
    <Route index element={<AppointmentsPage />} />
    <Route path="book" element={<BookAppointmentPage />} />
  </>
);

export default function App() {
  const ready = useAuthBootstrap();
  if (!ready) return <LoadingState label="Loading Meridian Health…" />;

  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allow={["admin"]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="doctors" element={<DoctorsPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="appointments">{AppointmentRoutes()}</Route>
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="pharmacy" element={<PharmacyPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={["doctor"]} />}>
            <Route path="/doctor" element={<DashboardLayout />}>
              <Route index element={<DoctorOverview />} />
              <Route path="appointments">{AppointmentRoutes()}</Route>
              <Route path="patients" element={<MyPatientsPage />} />
              <Route path="prescriptions" element={<PrescriptionsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={["receptionist"]} />}>
            <Route path="/receptionist" element={<DashboardLayout />}>
              <Route index element={<ReceptionistOverview />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="appointments">{AppointmentRoutes()}</Route>
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={["patient"]} />}>
            <Route path="/patient" element={<DashboardLayout />}>
              <Route index element={<PatientOverview />} />
              <Route path="appointments">{AppointmentRoutes()}</Route>
              <Route path="records" element={<PatientRecords />} />
              <Route path="prescriptions" element={<PrescriptionsPage />} />
              <Route path="bills" element={<BillingPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
