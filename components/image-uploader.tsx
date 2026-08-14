"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ImageUploader({ orderItemId }: { orderItemId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const details = { orderItemId, name: file.name, type: file.type, size: file.size };
      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(details),
      });
      const presign = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presign.error ?? "Could not prepare upload");
      const uploadResponse = await fetch(presign.url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Image upload failed");
      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...details, key: presign.key }),
      });
      const complete = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(complete.error ?? "Could not save image");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <button
        type="button"
        className="button button-secondary button-small"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 size={15} /> : <Camera size={15} />} {busy ? "Uploading…" : "Add photo"}
      </button>
      {error && (
        <div className="hint" style={{ color: "var(--danger)", marginTop: 5 }}>
          {error}
        </div>
      )}
    </div>
  );
}
