import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export const LoadingState = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/50">
    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState = ({ title = "Nothing here yet", hint, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
      <Inbox className="h-6 w-6" />
    </div>
    <p className="font-medium text-ink/70">{title}</p>
    {hint && <p className="max-w-sm text-sm text-ink/45">{hint}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message = "Something went wrong.", onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <p className="font-medium text-ink/70">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-sm font-medium text-brand-600 hover:underline">
        Try again
      </button>
    )}
  </div>
);
