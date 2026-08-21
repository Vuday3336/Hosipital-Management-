import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { Activity } from "lucide-react";

const NAV_BY_ROLE = {
  admin: [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/patients", label: "Patients" },
    { to: "/admin/doctors", label: "Doctors" },
    { to: "/admin/departments", label: "Departments" },
    { to: "/admin/staff", label: "Staff" },
    { to: "/admin/appointments", label: "Appointments" },
    { to: "/admin/admissions", label: "Admissions" },
    { to: "/admin/pharmacy", label: "Pharmacy" },
    { to: "/admin/billing", label: "Billing" },
  ],
  doctor: [
    { to: "/doctor", label: "Overview", end: true },
    { to: "/doctor/appointments", label: "My Appointments" },
    { to: "/doctor/patients", label: "My Patients" },
    { to: "/doctor/prescriptions", label: "Prescriptions" },
  ],
  receptionist: [
    { to: "/receptionist", label: "Overview", end: true },
    { to: "/receptionist/patients", label: "Patients" },
    { to: "/receptionist/appointments", label: "Appointments" },
    { to: "/receptionist/admissions", label: "Admissions" },
    { to: "/receptionist/billing", label: "Billing" },
  ],
  patient: [
    { to: "/patient", label: "Overview", end: true },
    { to: "/patient/appointments", label: "My Appointments" },
    { to: "/patient/records", label: "My Records" },
    { to: "/patient/prescriptions", label: "Prescriptions" },
    { to: "/patient/bills", label: "My Bills" },
  ],
};

export const Sidebar = ({ role }) => (
  <aside className="hidden w-60 shrink-0 flex-col border-r border-black/[0.06] bg-white md:flex">
    <div className="flex items-center gap-2 px-6 py-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
        <Activity className="h-4 w-4" />
      </span>
      <span className="font-display font-semibold">Meridian Health</span>
    </div>
    <nav className="flex-1 space-y-1 px-3">
      {(NAV_BY_ROLE[role] || []).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            clsx(
              "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-brand-50 text-brand-700" : "text-ink/60 hover:bg-black/[0.03] hover:text-ink"
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
    <div className="px-4 py-4 text-xs text-ink/35">Hospital Management System</div>
  </aside>
);
