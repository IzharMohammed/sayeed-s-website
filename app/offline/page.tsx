import { Hammer, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="brand-mark">
        <span className="brand-icon">
          <Hammer size={20} />
        </span>
        Karigar
      </div>
      <section className="offline-card">
        <WifiOff size={34} />
        <h1>No internet connection</h1>
        <p>Reconnect to view current orders or update work status.</p>
        <Link className="button button-primary" href="/">
          Try again
        </Link>
      </section>
    </main>
  );
}
