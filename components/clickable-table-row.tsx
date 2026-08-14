"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClickableTableRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  function openOrder() {
    if (navigating) return;
    setNavigating(true);
    router.push(href);
  }

  return (
    <tr
      className={`clickable-row${navigating ? " is-loading" : ""}`}
      role="link"
      tabIndex={0}
      aria-label="Open order details"
      aria-busy={navigating}
      onClick={openOrder}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openOrder();
        }
      }}
    >
      {children}
      {navigating && (
        <td className="row-loader" aria-hidden="true">
          <LoaderCircle className="spinner" size={18} />
        </td>
      )}
    </tr>
  );
}
