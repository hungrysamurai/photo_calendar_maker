const CHUNK_SIZE = 0x8000;

/**
 * Encode binary data as base64 string (chunked to avoid call stack limits on large buffers)
 */
export default function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }

  return btoa(binary);
}
