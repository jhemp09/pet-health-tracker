"use client";

import { useTransition } from "react";
import {
  deleteBloodworkFile,
  getBloodworkUrl,
  uploadBloodwork,
} from "./actions";

type FileEntry = {
  id: string;
  file_name: string;
  file_type: "image" | "pdf";
  storage_path: string;
  taken_at: string | null;
  notes: string | null;
};

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
          <label className="flex flex-col gap-1 text-xs">
            File (image or PDF)
            <input
              type="file"
              name="file"
              accept="image/*,application/pdf"
              required
              className="text-sm"
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
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-gray-700">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between">
              <span>
                {f.taken_at ? `${f.taken_at} — ` : ""}
                {f.file_name} ({f.file_type})
                {f.notes ? ` — ${f.notes}` : ""}
              </span>
              <span className="flex items-center gap-2">
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No bloodwork uploaded yet.</p>
      )}
    </section>
  );
}
