"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { FormState } from "../../actions";

const MAX_SIDE = 1200;

/** Shrink the photo in the browser so phone pictures (often 5–10 MB) upload quickly. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Could not process the photo.");
  return blob;
}

export function PhotoUpload({
  photoSrc,
  upload,
  remove,
}: {
  photoSrc: string | null;
  upload: (prev: FormState, formData: FormData) => Promise<FormState>;
  remove: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, uploadAction, uploading] = useActionState(upload, null);
  const [removing, startRemove] = useTransition();
  const [, startUpload] = useTransition();

  async function onChoose(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    try {
      const blob = await shrink(file);
      const formData = new FormData();
      formData.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      startUpload(() => uploadAction(formData));
    } catch {
      setLocalError("Couldn't read that file. Please choose a JPG or PNG photo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const error = localError ?? state?.error;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-stone-100 ring-4 ring-gold-400 ring-offset-2">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- served from our own route
          <img src={photoSrc} alt="Your photo" className="h-full w-full object-cover object-[50%_25%]" />
        ) : (
          <span className="text-xs text-stone-400">No photo</span>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-stone-600">
          Shown at the top of the invitation and on the WhatsApp preview.
        </p>
        <div className="flex gap-2">
          <label className={`btn-primary cursor-pointer ${uploading ? "opacity-60" : ""}`}>
            {uploading ? "Uploading…" : photoSrc ? "Change photo" : "Upload photo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => onChoose(e.target.files?.[0])}
            />
          </label>
          {photoSrc && (
            <button
              type="button"
              disabled={removing}
              onClick={() => startRemove(remove)}
              className="btn-secondary text-red-600"
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      </div>
    </div>
  );
}
