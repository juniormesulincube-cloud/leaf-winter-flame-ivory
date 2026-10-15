import { previewPathPrefix } from "@/lib/preview-path-prefix";

/** Path prefix for path-based previews, or "" on a normal host. */
export function previewPrefix(): string {
  if (typeof window === "undefined") return "";
  return previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
}

/** Same-origin API path, including the preview prefix when the browser needs it. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${previewPrefix()}${normalized}`;
}

/** Absolute URL suitable for a QR code or the clipboard. */
export function shareUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${previewPrefix()}${normalized}`;
}
