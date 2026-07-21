/**
 * Klientská komprese obrázků před uploadem.
 *
 * Fotka z mobilu má běžně 3–8 MB. Po zmenšení na 2000 px a překódování do WebP
 * spadne na ~300–600 kB při prakticky nerozeznatelné kvalitě. Šetří to nginx
 * limit, S3 i data uživatele s pomalým připojením.
 */

export const IMAGE_LIMITS = {
  /** Maximum pro soubor, který ještě zkusíme zkomprimovat. */
  maxInputBytes: 30 * 1024 * 1024,
  /** Pokud je i po kompresi větší, upload zamítneme (musí sedět s backendem). */
  maxOutputBytes: 12 * 1024 * 1024,
  /** Delší strana po zmenšení. Pro e-shop listing bohatě stačí. */
  maxDimension: 2000,
  quality: 0.82,
  maxFiles: 10,
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Chyba, kterou umíme uživateli vysvětlit včetně rady, co s tím. */
export class ImageUploadError extends Error {
  constructor(message: string, readonly tip?: string) {
    super(message);
    this.name = "ImageUploadError";
  }

  /** Hláška do toastu — problém i rada dohromady. */
  get fullMessage(): string {
    return this.tip ? `${this.message} ${this.tip}` : this.message;
  }
}

function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Zmenší a překóduje obrázek. Vrací původní soubor, pokud by komprese
 * nepomohla (např. už optimalizovaný malý obrázek).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError(
      `Soubor „${file.name}" není obrázek.`,
      "Nahrát lze jen JPG, PNG, WebP nebo AVIF.",
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      `Formát ${file.type.replace("image/", "").toUpperCase()} nepodporujeme.`,
      "Uložte fotku jako JPG nebo PNG a zkuste to znovu.",
    );
  }

  if (file.size > IMAGE_LIMITS.maxInputBytes) {
    throw new ImageUploadError(
      `Fotka „${file.name}" má ${formatBytes(file.size)}, což je nad limit ${formatBytes(IMAGE_LIMITS.maxInputBytes)}.`,
      "Zmenšete ji ve Fotkách (Upravit → Změnit velikost) nebo na squoosh.app a nahrajte znovu.",
    );
  }

  // GIF necháváme být — canvas by z animace udělal statický snímek.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    // imageOrientation zajistí, že se respektuje EXIF rotace z mobilu.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new ImageUploadError(
        `Fotku „${file.name}" se nepodařilo načíst — prohlížeč tento formát neumí otevřít.`,
        `Bývá to u HEIC fotek z iPhonu. V Nastavení → Fotoaparát → Formáty přepněte na „Nejkompatibilnější", nebo fotku vyexportujte jako JPG.`,
      );
    }
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, IMAGE_LIMITS.maxDimension / Math.max(width, height));
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const outputType = supportsWebP() ? "image/webp" : "image/jpeg";
  const blob = await canvasToBlob(canvas, outputType, IMAGE_LIMITS.quality);

  // Komprese selhala, nebo výsledek není menší — necháme originál.
  if (!blob || blob.size >= file.size) {
    if (file.size > IMAGE_LIMITS.maxOutputBytes) {
      throw new ImageUploadError(
        `Fotku „${file.name}" (${formatBytes(file.size)}) se nepodařilo zmenšit pod ${formatBytes(IMAGE_LIMITS.maxOutputBytes)}.`,
        "Zkuste ji uložit jako JPG v nižší kvalitě, nebo použijte squoosh.app.",
      );
    }
    return file;
  }

  if (blob.size > IMAGE_LIMITS.maxOutputBytes) {
    throw new ImageUploadError(
      `Fotka „${file.name}" je i po zmenšení ${formatBytes(blob.size)}.`,
      "Zkuste fotku s menším rozlišením — pro listing stačí zhruba 2000 × 2000 px.",
    );
  }

  const extension = outputType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${extension}`, {
    type: outputType,
    lastModified: file.lastModified,
  });
}

export interface PreparedImages {
  files: File[];
  /** Chybové hlášky souborů, které neprošly — zbytek se nahraje. */
  errors: string[];
  originalBytes: number;
  compressedBytes: number;
}

/**
 * Připraví dávku souborů k uploadu. Vadné soubory přeskočí a vrátí je
 * v `errors` — jedna špatná fotka nezablokuje zbytek výběru.
 */
export async function prepareImages(input: File[]): Promise<PreparedImages> {
  const errors: string[] = [];
  const files: File[] = [];
  let originalBytes = 0;
  let compressedBytes = 0;

  const accepted = input.slice(0, IMAGE_LIMITS.maxFiles);
  if (input.length > IMAGE_LIMITS.maxFiles) {
    errors.push(
      `Najednou lze nahrát nejvýš ${IMAGE_LIMITS.maxFiles} fotek — ${input.length - IMAGE_LIMITS.maxFiles} jsme vynechali. Zbytek nahrajte v další dávce.`,
    );
  }

  for (const file of accepted) {
    try {
      const compressed = await compressImage(file);
      originalBytes += file.size;
      compressedBytes += compressed.size;
      files.push(compressed);
    } catch (err) {
      errors.push(
        err instanceof ImageUploadError
          ? err.fullMessage
          : `Fotku „${file.name}" se nepodařilo zpracovat.`,
      );
    }
  }

  return { files, errors, originalBytes, compressedBytes };
}
