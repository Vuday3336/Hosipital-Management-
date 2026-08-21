import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Stethoscope,
  BedDouble,
  Pill,
  Receipt,
  BarChart3,
  Bell,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { PublicNavbar } from "../../components/layout/PublicNavbar.jsx";
import { Button } from "../../components/common/Button.jsx";

// three.js/R3F is ~500kB alone — split it into its own chunk so dashboard
// routes (which never render it) don't pay for it on first load.
const Hero3D = lazy(() => import("../../components/three/Hero3D.jsx").then((m) => ({ default: m.Hero3D })));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const modules = [
  { icon: Users, title: "Patient records", desc: "Full medical history, allergies, and visit timeline in one searchable chart." },
  { icon: Stethoscope, title: "Doctor & staff", desc: "Department rosters, specializations, and weekly availability at a glance." },
  { icon: CalendarCheck, title: "Appointments", desc: "Live availability calendar with automatic double-booking prevention." },
  { icon: BedDouble, title: "Admissions", desc: "Ward and bed assignment with one-click discharge summary PDFs." },
  { icon: Pill, title: "Pharmacy", desc: "Stock tracking with automatic low-inventory alerts to admins." },
  { icon: Receipt, title: "Billing", desc: "Itemized invoices per visit, payment tracking, downloadable PDFs." },
  { icon: BarChart3, title: "Analytics", desc: "Role-aware dashboards — hospital-wide for admins, caseload for doctors." },
  { icon: Bell, title: "Notifications", desc: "In-app and email alerts for bookings, reminders, and stock levels." },
];

const roles = [
  { name: "Admin", detail: "Full oversight of staff, departments, inventory, and hospital-wide reporting." },
  { name: "Doctor", detail: "See only your assigned patients, manage your calendar, write prescriptions." },
  { name: "Receptionist", detail: "Register walk-ins, book appointments, and handle front-desk billing." },
  { name: "Patient", detail: "Book visits, and view your own records, prescriptions, and bills — nothing else." },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Role-based access, built in
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
              Hospital operations,
              <br />
              <span className="text-brand-600">running on one record.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/60">
              Meridian Health unifies patients, scheduling, admissions, pharmacy, and
              billing into a single system — so front desk, clinical, and admin teams
              read from the same chart instead of three different ones.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/register")}>
                Book a patient account <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
                Staff sign in
              </Button>
            </div>
            <div className="mt-10 flex gap-8 text-sm">
              <div>
                <p className="font-display text-2xl font-semibold text-ink">9</p>
                <p className="text-ink/45">Core modules</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-ink">4</p>
                <p className="text-ink/45">Dedicated roles</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-ink">0</p>
                <p className="text-ink/45">Double-bookings</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-[380px] md:h-[460px]"
          >
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-2xl bg-brand-50" />}>
              <Hero3D className="h-full w-full" />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-t border-black/[0.06] bg-[#fbfbfa] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Platform</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Every department, one system</h2>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-soft"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <m.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Access control</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Everyone sees exactly what they need</h2>
          </motion.div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-brand-950 p-5 text-white"
              >
                <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{r.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / footer */}
      <section id="contact" className="border-t border-black/[0.06] bg-[#fbfbfa] py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Ready to bring your front desk online?</h2>
            <p className="mt-2 text-sm text-ink/55">Patient accounts are self-serve — staff accounts are provisioned by an admin.</p>
          </div>
          <Button size="lg" onClick={() => navigate("/register")}>
            Create a patient account <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-auto mt-12 max-w-6xl px-6 text-xs text-ink/35">
          © {new Date().getFullYear()} Meridian Health — Hospital Management System
        </div>
      </section>
    </div>
  );
};
