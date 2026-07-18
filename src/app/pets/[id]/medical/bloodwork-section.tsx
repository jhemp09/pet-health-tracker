"use client";

import { useState, useTransition } from "react";
import {
  deleteBloodworkFile,
  getBloodworkUrl,
  retryParseBloodwork,
  uploadBloodwork,
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
        {file.results.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-blue-600 underline"
            >
              {expanded ? "Hide" : "View"} lab results ({file.results.length})
            </button>
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
          </>
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

export function BloodworkSection({
  petId,
  files,
}: {
  petId: string;
  files: FileEntry[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Bloodwork</h2>
      <div className="rounded border border-gray-200 p-4">
        <form
          action={(formData) => uploadBloodwork(petId, formData)}
          className="flex flex-wrap items-end gap-2"
        >
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
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Upload
          </button>
        </form>
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
