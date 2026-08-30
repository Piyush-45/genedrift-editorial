import type { PublicationHandoff, PublishedMediaAsset } from "./domain";
import { PublicationError } from "./errors";
import type { CreatorMediaSource, ImmutableObjectStore } from "./ports";
import { sha256Hex } from "./security";

type SourceAsset = PublicationHandoff["media"][number];

const MIME_EXTENSIONS: Record<SourceAsset["mimeType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp"
};

function detectedMime(buffer: Buffer): SourceAsset["mimeType"] | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return "image/gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

function detectedDimensions(buffer: Buffer, mimeType: SourceAsset["mimeType"]): { width: number; height: number } | null {
  if (mimeType === "image/png" && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (mimeType === "image/gif" && buffer.length >= 10) return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  if (mimeType === "image/jpeg") return jpegDimensions(buffer);
  if (mimeType === "image/webp") return webpDimensions(buffer);
  return null;
}

function validateAsset(asset: SourceAsset, buffer: Buffer, maxBytes: number): void {
  if (buffer.length > maxBytes) {
    throw new PublicationError(`Media ${asset.mediaId} exceeds the ${maxBytes}-byte publication limit`, "MEDIA_TOO_LARGE", false, 422);
  }
  if (buffer.length !== asset.fileSizeBytes) {
    throw new PublicationError(`Media ${asset.mediaId} size changed after approval`, "MEDIA_SIZE_MISMATCH", false, 422);
  }
  const mimeType = detectedMime(buffer);
  if (!mimeType || mimeType !== asset.mimeType) {
    throw new PublicationError(`Media ${asset.mediaId} file signature does not match ${asset.mimeType}`, "MEDIA_TYPE_MISMATCH", false, 422);
  }
  const checksum = sha256Hex(buffer);
  if (checksum !== asset.checksum.toLowerCase()) {
    throw new PublicationError(`Media ${asset.mediaId} checksum changed after approval`, "MEDIA_CHECKSUM_MISMATCH", false, 422);
  }
  const dimensions = detectedDimensions(buffer, mimeType);
  if (!dimensions || dimensions.width !== asset.widthPixels || dimensions.height !== asset.heightPixels) {
    throw new PublicationError(`Media ${asset.mediaId} dimensions changed after approval`, "MEDIA_DIMENSIONS_MISMATCH", false, 422);
  }
}

export async function publishMediaAssets(
  assets: PublicationHandoff["media"],
  source: CreatorMediaSource,
  objects: ImmutableObjectStore,
  maxBytes: number
): Promise<PublishedMediaAsset[]> {
  const published: PublishedMediaAsset[] = [];
  for (const asset of assets) {
    const bytes = await source.download(asset);
    validateAsset(asset, bytes, maxBytes);
    const checksum = asset.checksum.toLowerCase();
    const objectKey = `media/${checksum.slice(0, 2)}/${checksum}.${MIME_EXTENSIONS[asset.mimeType]}`;
    const stored = await objects.putPublicMedia(objectKey, bytes, asset.mimeType, {
      checksum,
      mediaId: asset.mediaId,
      creatorRecordId: asset.creatorRecordId
    });
    published.push({ ...asset, checksum, objectKey: stored.objectKey, publishedUrl: stored.publicUrl });
  }
  return published;
}
