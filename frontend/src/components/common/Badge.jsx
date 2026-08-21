import clsx from "clsx";

const tones = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  admitted: "bg-blue-50 text-blue-700 ring-blue-600/20",
  discharged: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
  unpaid: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-black/5 text-ink/70 ring-black/10",
};

export const Badge = ({ tone = "neutral", children }) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
      tones[tone] || tones.neutral
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {children}
  </span>
);
