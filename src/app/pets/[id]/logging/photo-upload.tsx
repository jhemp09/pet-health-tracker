"use client";

import { useRef, useTransition } from "react";
import { removePetPhoto, updatePetPhoto } from "./photo-actions";

export function PhotoUpload({
  petId,
  photoUrl,
}: {
  petId: string;
  photoUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("photo", file);
    startTransition(() => updatePetPhoto(petId, formData));
  }

  return (
    <div className="flex items-center gap-3 rounded border border-gray-200 p-3">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">
          No photo
        </div>
      )}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="w-fit rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {photoUrl ? "Change photo" : "Add photo"}
        </button>
        {photoUrl && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => removePetPhoto(petId))}
            className="w-fit text-xs text-red-600 underline"
          >
            Remove photo
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
