"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  deleteBloodworkFile,
  getBloodworkUrl,
  registerBloodwork,
  retryParseBloodwork,
} from "./actions";

type Result = {
  id: string;
  test_name: string;
  value: string;
  unit: string | null;
  reference_range: string | null;
  flag: "low" | "high" | "normal" | "abnormal" | null;
};

type FileEntry = {
  id: string;
  file_name: string;
  file_type: "image" | "pdf";
  storage_path: string;
  taken_at: string | null;
  notes: string | null;
  parse_status: "pending" | "done" | "failed";
  parsed_summary: string | null;
  results: Result[];
};

const FLAG_COLOR: Record<NonNullable<Result["flag"]>, string> = {
  low: "#d97706",
  high: "#dc2626",
  abnormal: "#dc2626",
  normal: "#78716c",
};

function BloodworkResults({ file, petId }: { file: FileEntry; petId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (file.parse_status === "done") {
    return (
      <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-xs">
        {file.parsed_summary && <p className="mb-1 text-gray-700">{file.parsed_summary}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {file.results.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-blue-600 underline"
            >
              {expanded ? "Hide" : "View"} lab results ({file.results.length})
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => retryParseBloodwork(petId, file.id))}
            className="shrink-0 text-blue-600 underline disabled:opacity-50"
          >
            {isPending ? "Scanning…" : "Re-scan"}
          </button>
        </div>
        {expanded && (
          <ul className="mt-2 flex flex-col gap-1">
            {file.results.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-words">
                  {r.test_name}: {r.value}
                  {r.unit ? ` ${r.unit}` : ""}
                  {r.reference_range ? ` (ref: ${r.reference_range})` : ""}
                </span>
                {r.flag && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase text-white"
                    style={{ background: FLAG_COLOR[r.flag] }}
                  >
                    {r.flag}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (file.parse_status === "failed" || file.parse_status === "pending") {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="min-w-0 break-words">
          {file.parse_status === "failed"
            ? "Automatic lab result parsing didn't work for this file."
            : "This file hasn't been scanned for lab values yet."}
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => retryParseBloodwork(petId, file.id))}
          className="shrink-0 text-blue-600 underline disabled:opacity-50"
        >
          {isPending
            ? "Scanning…"
            : file.parse_status === "failed"
              ? "Retry"
              : "Scan for lab values"}
        </button>
      </div>
    );
  }

  return null;
}

// Browsers (especially mobile file pickers) sometimes report an empty or
// generic type for PDFs/images, so fall back to the file extension.
function inferMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  switch (file.name.toLowerCase().split(".").pop()) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return file.type;
  }
}

function UploadForm({ petId, householdId }: { petId: string; householdId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "scanning">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;

    setError(null);
    const mimeType = inferMimeType(file);
    if (mimeType !== "application/pdf" && !mimeType.startsWith("image/")) {
      setError("That file type isn't supported — upload a PDF or an image.");
      return;
    }
    setStatus("uploading");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${householdId}/${petId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await createClient()
      .storage.from("bloodwork")
      .upload(storagePath, file, { contentType: mimeType });
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setStatus("idle");
      return;
    }

    setStatus("scanning");
    const result = await registerBloodwork(petId, {
      storagePath,
      fileName: file.name,
      mimeType,
      takenAt: String(formData.get("taken_at") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    });
    setStatus("idle");
    if (!result.ok) {
      setError(result.error ?? "Could not save the upload");
      return;
    }
    form.reset();
  }

  const busy = status !== "idle";

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 max-w-full flex-1 flex-col gap-1 text-xs">
          File (image or PDF)
          <input
            type="file"
            name="file"
            accept="image/*,application/pdf"
            required
            className="w-full max-w-full text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Date
          <input
            type="date"
            name="taken_at"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Notes
          <input
            type="text"
            name="notes"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading…" : status === "scanning" ? "Scanning…" : "Upload"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </>
  );
}

export function BloodworkSection({
  petId,
  householdId,
  files,
}: {
  petId: string;
  householdId: string;
  files: FileEntry[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Bloodwork</h2>
      <div className="rounded border border-gray-200 p-4">
        <UploadForm petId={petId} householdId={householdId} />
        <p className="mt-2 text-xs text-gray-500">
          Uploads are automatically scanned for lab values — this can take a few seconds.
        </p>
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm text-gray-700">
          {files.map((f) => (
            <li key={f.id} className="rounded border border-gray-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 flex-1 break-words">
                  {f.taken_at ? `${f.taken_at} — ` : ""}
                  {f.file_name} ({f.file_type})
                  {f.notes ? ` — ${f.notes}` : ""}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => {
                      startTransition(async () => {
                        const url = await getBloodworkUrl(f.storage_path);
                        if (url) window.open(url, "_blank");
                      });
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className="text-xs text-red-600 underline"
                    onClick={() =>
                      startTransition(() =>
                        deleteBloodworkFile(petId, f.id, f.storage_path)
                      )
                    }
                  >
                    Delete
                  </button>
                </span>
              </div>
              <BloodworkResults file={f} petId={petId} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No bloodwork uploaded yet.</p>
      )}
    </section>
  );
}
