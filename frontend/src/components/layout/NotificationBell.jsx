import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { notificationsApi } from "../../api/resources.js";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await notificationsApi.list({ limit: 8 });
      setItems(res.data);
      setUnread(res.meta.unreadCount);
    } catch {
      // Notifications are non-critical — fail silently rather than blocking the layout.
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink/60 hover:bg-black/[0.04] hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-black/[0.06] bg-white p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-ink/40">You're all caught up.</p>}
              {items.map((n) => (
                <div
                  key={n._id}
                  className={`rounded-lg px-2.5 py-2 text-sm ${n.isRead ? "text-ink/50" : "bg-brand-50/60 text-ink"}`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-ink/50">{n.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
