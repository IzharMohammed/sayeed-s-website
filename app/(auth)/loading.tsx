import { LoaderCircle } from "lucide-react";

export default function AuthLoading() {
  return (
    <main className="auth-panel auth-loading" role="status" aria-live="polite">
      <LoaderCircle className="spinner" size={28} />
      <span>Loading securely…</span>
    </main>
  );
}
