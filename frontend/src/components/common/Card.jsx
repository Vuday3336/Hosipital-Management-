import clsx from "clsx";

export const Card = ({ className, children, ...props }) => (
  <div
    className={clsx("rounded-xl border border-black/[0.06] bg-white shadow-soft", className)}
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({ label, value, hint, icon: Icon, trend }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      </div>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
    {trend && (
      <p className={clsx("mt-3 text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-500")}>
        {trend.label}
      </p>
    )}
  </Card>
);
