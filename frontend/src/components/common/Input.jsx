import { forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef(({ label, error, className, id, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35",
          "transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40",
          error ? "border-red-400" : "border-black/10 focus:border-brand-400",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});
Input.displayName = "Input";

export const Select = forwardRef(({ label, error, className, id, children, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={clsx(
          "rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink",
          "transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40",
          error ? "border-red-400" : "border-black/10 focus:border-brand-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});
Select.displayName = "Select";
