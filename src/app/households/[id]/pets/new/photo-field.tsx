"use client";

import { useRef, useState } from "react";
import { PhotoCropModal } from "@/components/photo-crop-modal";

// A single file input named "photo" whose value gets swapped for the
// cropped image before the surrounding <form> submits, so the plain
// server-action form flow on this page needs no changes to receive the
// already-cropped file.
export function PhotoField() {
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageSrc(URL.createObjectURL(file));
  }

  function closeCropModal() {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
  }

  function handleCropConfirm(blob: Blob) {
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (inputRef.current) inputRef.current.files = dataTransfer.files;
    setPreviewUrl(URL.createObjectURL(blob));
    closeCropModal();
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      Photo (optional)
      <div className="flex items-center gap-3">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        >
          {previewUrl ? "Change photo" : "Choose photo"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {pendingImageSrc && (
        <PhotoCropModal
          imageSrc={pendingImageSrc}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </label>
  );
}
