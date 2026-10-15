const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIDE = 1600;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2.5 * 1024 * 1024;

export class ImageError extends Error {
  constructor(public code: "type" | "size" | "decode" | "output") {
    super(code);
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Redessine l'image sur un nouveau support : toutes les métadonnées
// (position GPS, appareil, date…) disparaissent, et la taille est réduite.
export async function compressImage(file: File): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError("type");
  if (file.size > MAX_INPUT_BYTES) throw new ImageError("size");

  let bitmap: ImageBitmap;
  try {
    // Respecte l'orientation de la photo avant de supprimer ses métadonnées.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new ImageError("decode");
    }
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new ImageError("decode");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP si le navigateur sait l'écrire, sinon JPEG (Safari).
  let blob = await toBlob(canvas, "image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg", 0.85);
  }
  if (blob && blob.size > MAX_OUTPUT_BYTES) {
    blob = await toBlob(canvas, blob.type, 0.7);
  }

  if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new ImageError("output");
  return blob;
}