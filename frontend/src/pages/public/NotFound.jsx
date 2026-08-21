import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";

export const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-center">
    <p className="font-display text-6xl font-semibold text-brand-500">404</p>
    <p className="text-ink/60">This page doesn't exist.</p>
    <Link to="/">
      <Button variant="secondary">Back to home</Button>
    </Link>
  </div>
);
