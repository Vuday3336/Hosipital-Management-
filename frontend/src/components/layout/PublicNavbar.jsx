import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { Button } from "../common/Button.jsx";

export const PublicNavbar = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Activity className="h-4 w-4" />
          </span>
          Meridian Health
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/60 md:flex">
          <a href="#modules" className="hover:text-ink">Platform</a>
          <a href="#roles" className="hover:text-ink">For your team</a>
          <a href="#contact" className="hover:text-ink">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Button size="sm" onClick={() => navigate(`/${user.role}`)}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
};
