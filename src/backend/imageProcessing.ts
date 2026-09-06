import sharp from "sharp";
import { env } from "./env";

// Re-encoded output is always one of these raster formats. The extension is
// derived from the sharp-produced format, never from the client filename.
export type AllowedImageExtension = "jpg" | "png" | "webp" | "gif" | "avif";

// Bound re-encoding so decompression bombs can't exhaust memory.
export const MAX_IMAGE_DIMENSION = 4000;

function extForFormat(format: string): AllowedImageExtension {
  switch (format) {
    case "jpeg":
      return "jpg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "gif":
      return "gif";
    case "avif":
      return "avif";
    default:
      return "png";
  }
}

/**
 * Sanitize an uploaded buffer by fully re-encoding it as a raster image.
 *
 * The returned bytes are sharp's own output — never the client's bytes — with
 * all metadata (EXIF/ICC/IPTC) stripped and dimensions bounded. If sharp cannot
 * safely decode and re-encode the input, it throws and the caller rejects.
 *
 * Returns the sanitized bytes plus the safe on-disk extension to use.
 */
export async function sanitizeImageUpload(input: Buffer): Promise<{
  buffer: Buffer;
  extension: AllowedImageExtension;
}> {
  const metadata = await sharp(input).metadata();
  if (!metadata.format) {
    throw new Error("unrecognized image format");
  }

  // Load ALL frames/pages so animated GIFs survive the re-encode; harmless for
  // single-image inputs. Without { pages: -1 } libvips collapses multi-frame
  // GIFs to their first frame.
  let pipeline = sharp(input, { pages: -1 })
    .rotate()
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .withMetadata({}); // strip EXIF/ICC/IPTC (only generic sharp output kept)

  // Preserve animated GIFs; static GIFs (and any unrecognized format) become PNG.
  const isAnimatedGif = metadata.format === "gif" && (metadata.pages ?? 1) > 1;
  if (metadata.format === "gif" && !isAnimatedGif) {
    pipeline = pipeline.png();
  }

  const buffer = await pipeline.toBuffer();
  const outputMetadata = await sharp(buffer).metadata();
  const extension = extForFormat(outputMetadata.format ?? "png");
  return { buffer, extension };
}

/**
 * Resolve a stored serverPath to a bare, validated filename inside UPLOAD_DIR.
 *
 * Only paths shaped exactly like our own uploads (<prefix>/<uuid>.<ext>) are
 * accepted; anything else returns null so callers can reject it. No filesystem
 * path is ever derived from an unvalidated client string.
 */
export function toSafeUploadFilename(serverPath: string): string | null {
  const prefix = env.UPLOAD_URL_PREFIX.endsWith("/")
    ? env.UPLOAD_URL_PREFIX
    : `${env.UPLOAD_URL_PREFIX}/`;

  if (!serverPath.startsWith(prefix)) {
    return null;
  }
  const filename = serverPath.slice(prefix.length);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|gif|avif)$/i.test(filename)) {
    return null;
  }
  return filename;
}
