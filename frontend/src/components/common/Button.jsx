import { forwardRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-brand-500 text-white shadow-soft hover:bg-brand-600 focus-visible:ring-brand-500",
  secondary:
    "bg-white text-ink border border-black/10 hover:border-black/20 hover:bg-black/[0.02] focus-visible:ring-brand-500",
  ghost: "bg-transparent text-ink hover:bg-black/5 focus-visible:ring-brand-500",
  danger: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
};

const sizes = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

export const Button = forwardRef(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  )
);
Button.displayName = "Button";
