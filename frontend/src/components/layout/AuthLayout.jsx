import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const Hero3D = lazy(() => import("../three/Hero3D.jsx").then((m) => ({ default: m.Hero3D })));

export const AuthLayout = ({ title, subtitle, children }) => (
  <div className="grid min-h-screen md:grid-cols-2">
    <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
      <Link to="/" className="mb-10 flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Activity className="h-4 w-4" />
        </span>
        Meridian Health
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink/55">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
    <div className="relative hidden overflow-hidden bg-brand-950 md:block">
      <Suspense fallback={null}>
        <Hero3D className="h-full w-full" />
      </Suspense>
      <div className="absolute bottom-10 left-10 right-10 text-white/70">
        <p className="font-display text-lg text-white">"One chart, every department."</p>
        <p className="mt-1 text-sm">Meridian Health keeps admissions, pharmacy, and billing in sync automatically.</p>
      </div>
    </div>
  </div>
);
