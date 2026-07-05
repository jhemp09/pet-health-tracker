"use client";

import { useRef, useState, useTransition } from "react";
import { PhotoCropModal } from "@/components/photo-crop-modal";
import { removePetPhoto, updatePetPhoto } from "./photo-actions";

export function PhotoUpload({
  petId,
  photoUrl,
}: {
  petId: string;
  photoUrl: string | null;
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

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removePetPhoto(petId);
      if (!result.ok) setError(result.error ?? "Could not remove photo");
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 p-3">
      <div className="flex items-center gap-3">
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
            {isPending ? "Saving…" : photoUrl ? "Change photo" : "Add photo"}
          </button>
          {photoUrl && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRemove}
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
      {error && <p className="text-xs text-red-700">{error}</p>}

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
