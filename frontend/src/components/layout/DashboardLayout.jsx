import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { useAuthActions } from "../../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export const DashboardLayout = () => {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f6f7f5]">
      <Sidebar role={user?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/[0.06] bg-white px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
              {user?.role}
            </p>
            <h1 className="font-display text-lg font-semibold">Welcome back, {user?.name?.split(" ")[0]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-px bg-black/10" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/60 hover:bg-black/[0.04] hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
