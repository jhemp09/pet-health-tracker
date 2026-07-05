"use client";

import { useRef, useState, useTransition } from "react";
import { PhotoCropModal } from "@/components/photo-crop-modal";
import { removePetPhoto, updatePetPhoto } from "./logging/photo-actions";

export function PetHeaderPhoto({
  petId,
  photoUrl,
  petName,
}: {
  petId: string;
  photoUrl: string | null;
  petName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPendingImageSrc(URL.createObjectURL(file));
  }

  function closeCropModal() {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleCropConfirm(blob: Blob) {
    const formData = new FormData();
    formData.set("photo", blob, "photo.jpg");
    startTransition(async () => {
      const result = await updatePetPhoto(petId, formData);
      if (!result.ok) setError(result.error ?? "Upload failed");
      closeCropModal();
    });
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const result = await removePetPhoto(petId);
      if (!result.ok) setError(result.error ?? "Could not remove photo");
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="group relative h-20 w-20 shrink-0 rounded-full disabled:opacity-50"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-400">
            {petName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-[11px] font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          {isPending ? "Saving…" : photoUrl ? "Change" : "Add photo"}
        </span>
        {photoUrl && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleRemove}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleRemove(e as unknown as React.MouseEvent);
            }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-red-600 shadow"
          >
            ×
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="max-w-[6rem] text-center text-[11px] text-red-700">{error}</p>}

      {pendingImageSrc && (
        <PhotoCropModal
          imageSrc={pendingImageSrc}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
