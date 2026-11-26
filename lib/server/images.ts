import { HttpError } from "./http";

export type ImageInfo = { mime: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp"; width: number; height: number };

export function inspectImage(bytes: Uint8Array): ImageInfo {
  if (bytes.length < 24) throw new HttpError(400, "照片文件不完整，请重新选择。");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let image: ImageInfo | null = null;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) {
    if (bytes.length < 45 || view.getUint32(8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR" || String.fromCharCode(...bytes.slice(-8, -4)) !== "IEND") throw new HttpError(400, "PNG 照片文件不完整。");
    image = { mime: "image/png", extension: "png", width: view.getUint32(16), height: view.getUint32(20) };
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    if (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) throw new HttpError(400, "JPEG 照片文件不完整。");
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      while (offset < bytes.length && bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 8) {
        image = { mime: "image/jpeg", extension: "jpg", height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
        break;
      }
      offset += length;
    }
  } else if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (view.getUint32(4, true) + 8 > bytes.length) throw new HttpError(400, "WebP 照片文件不完整。");
    if (chunk === "VP8X" && bytes.length >= 30) {
      if (bytes[20] & 2) throw new HttpError(400, "请选择静态照片，暂不支持动态 WebP。");
      image = { mime: "image/webp", extension: "webp", width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
    } else if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) {
      image = { mime: "image/webp", extension: "webp", width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
    } else if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      image = { mime: "image/webp", extension: "webp", width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8), height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0xf) << 10) };
    }
  }
  if (!image) throw new HttpError(415, "请选择有效的 JPEG、PNG 或 WebP 照片。");
  if (!image.width || !image.height || image.width > 12000 || image.height > 12000 || image.width * image.height > 24_000_000) throw new HttpError(400, "照片尺寸过大，请缩小至 2400 万像素以内再上传。");
  return image;
}
