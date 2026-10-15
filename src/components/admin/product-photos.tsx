"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, ImageError } from "@/lib/image-compress";
import {
  deleteProductImage,
  registerProductImage,
  reorderProductImages,
  type PhotoResult,
} from "@/app/(admin)/admin/produits/media-actions";

const BUCKET = "product-images";
const MAX_PHOTOS = 12;
const MAX_BATCH = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type Photo = { id: string; url: string; alt: string };

type UploadItem = {
  key: string;
  name: string;
  state: "working" | "done" | "error";
  message?: string;
};

class UserMessage extends Error {}

function explain(error: unknown): string {
  if (error instanceof UserMessage) return error.message;
  if (error instanceof ImageError) {
    switch (error.code) {
      case "type":
        return "Format non pris en charge (JPEG, PNG, WebP ou AVIF).";
      case "size":
        return "Photo trop lourde (25 Mo maximum).";
      case "decode":
        return "Impossible de lire cette image.";
      default:
        return "Image trop lourde même après compression.";
    }
  }
  return "Envoi impossible. Réessayez.";
}

export function ProductPhotos({
  productId,
  photos,
}: {
  productId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const busy = uploads.some((item) => item.state === "working");
  const full = photos.length >= MAX_PHOTOS;

  function update(key: string, patch: Partial<UploadItem>) {
    setUploads((previous) =>
      previous.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const room = MAX_PHOTOS - photos.length;
    if (files.length === 0 || room <= 0) return;

    const supabase = createClient();

    for (const file of files.slice(0, Math.min(room, MAX_BATCH))) {
      const key = crypto.randomUUID();
      setUploads((previous) => [
        ...previous.filter((item) => item.state !== "done"),
        { key, name: file.name, state: "working" },
      ]);

      try {
        const blob = await compressImage(file);
        const extension = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, {
            contentType: blob.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) throw new UserMessage("Envoi refusé par le stockage.");

        const result = await registerProductImage({ productId, path });
        if (!result.ok) {
          // Pas de fichier orphelin si l'enregistrement échoue.
          await supabase.storage.from(BUCKET).remove([path]);
          throw new UserMessage(result.error);
        }

        update(key, { state: "done" });
      } catch (error) {
        update(key, { state: "error", message: explain(error) });
      }
    }

    router.refresh();
    window.setTimeout(
      () =>
        setUploads((previous) => previous.filter((item) => item.state !== "done")),
      2500
    );
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!full) void handleFiles(event.dataTransfer.files);
  }

  function run(action: () => Promise<PhotoResult>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setActionError(result.error);
    });
  }

  function reorder(ids: string[]) {
    run(() => reorderProductImages({ productId, imageIds: ids }));
  }

  function move(index: number, delta: number) {
    const ids = photos.map((photo) => photo.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder(ids);
  }

  function makeMain(index: number) {
    const ids = photos.map((photo) => photo.id);
    const [moved] = ids.splice(index, 1);
    reorder([moved, ...ids]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Photos</h2>
        <span className="text-xs text-ink-soft">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="relative aspect-square bg-rose/40">
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 200px, 45vw"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-cocoa px-3 py-1 text-[11px] font-semibold text-cream">
                    Principale
                  </span>
                )}
              </div>

              {confirmId === photo.id ? (
                <div className="space-y-2 bg-red-50 p-3">
                  <p className="text-xs text-red-800">Supprimer cette photo ?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setConfirmId(null);
                        run(() => deleteProductImage({ imageId: photo.id }));
                      }}
                      className="h-9 flex-1 rounded-full bg-red-700 text-xs font-medium text-white disabled:opacity-60"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="h-9 flex-1 rounded-full border border-line bg-surface text-xs font-medium text-ink"
                    >
                      Non
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={pending || index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Déplacer vers le début"
                        className="grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-rose/60 disabled:opacity-30"
                      >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || index === photos.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Déplacer vers la fin"
                        className="grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-rose/60 disabled:opacity-30"
                      >
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmId(photo.id)}
                      aria-label="Supprimer cette photo"
                      className="grid size-9 place-items-center rounded-full border border-line text-red-700 transition-colors hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => makeMain(index)}
                      className="w-full rounded-full border border-line py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rose/60 disabled:opacity-50"
                    >
                      Définir comme principale
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {actionError && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {actionError}
        </p>
      )}

      <label
        htmlFor="product-photos"
        onDragOver={(event) => {
          event.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/40 ${
          full
            ? "cursor-not-allowed border-line opacity-50"
            : dragging
              ? "border-ink bg-rose/40"
              : "border-line hover:bg-rose/30"
        }`}
      >
        <input
          id="product-photos"
          type="file"
          multiple
          accept={ACCEPT}
          disabled={full || busy}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Upload className="size-6 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-medium text-ink">
          {full ? "Nombre maximum de photos atteint" : "Ajouter des photos"}
        </span>
        <span className="text-xs text-ink-soft">
          Glissez-les ici ou touchez pour choisir. Elles sont réduites et
          nettoyées automatiquement.
        </span>
      </label>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {uploads.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
            >
              {item.state === "working" && (
                <LoaderCircle
                  className="size-4 shrink-0 text-ink-soft motion-safe:animate-spin"
                  aria-hidden="true"
                />
              )}
              {item.state === "done" && (
                <Check className="size-4 shrink-0 text-ink" aria-hidden="true" />
              )}
              {item.state === "error" && (
                <TriangleAlert
                  className="size-4 shrink-0 text-red-700"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 flex-1 truncate text-ink">{item.name}</span>
              <span
                className={`text-xs ${
                  item.state === "error" ? "text-red-700" : "text-ink-soft"
                }`}
              >
                {item.state === "working" && "Envoi…"}
                {item.state === "done" && "Ajoutée"}
                {item.state === "error" && item.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}