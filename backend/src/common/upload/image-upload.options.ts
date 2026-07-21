import { UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/**
 * Limity musí zůstat v souladu s `frontend/lib/image-upload.ts` a s
 * `client_max_body_size` v nginx na serveru (ten musí být vyšší než
 * maxFileBytes × maxFiles, jinak request zabije nginx dřív než backend).
 */
export const IMAGE_UPLOAD = {
  maxFileBytes: 12 * 1024 * 1024,
  maxFiles: 10,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
  ],
} as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Soubory držíme v paměti (jdou rovnou na S3), proto je limit velikosti
 * důležitý — bez něj by pár velkých uploadů naráz vyčerpalo RAM kontejneru.
 */
export const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: IMAGE_UPLOAD.maxFileBytes,
    files: IMAGE_UPLOAD.maxFiles,
  },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_UPLOAD.allowedMimeTypes.includes(file.mimetype as never)) {
      return callback(
        new UnsupportedMediaTypeException(
          `Formát souboru „${file.originalname}" nepodporujeme. Nahrát lze JPG, PNG, WebP nebo AVIF.`,
        ),
        false,
      );
    }
    callback(null, true);
  },
};
