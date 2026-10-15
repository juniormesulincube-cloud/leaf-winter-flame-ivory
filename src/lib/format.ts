export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function formatSpeed(bytesPerSec: number | null): string | null {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return null;
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 5) return "a few seconds left";
  if (seconds < 90) return `about ${Math.max(1, Math.round(seconds))} s left`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return minutes === 1 ? "about 1 min left" : `about ${minutes} min left`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "about 1 hour left" : `about ${hours} hours left`;
}

export function formatExpiry(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "expired";
  const minutes = Math.round(ms / 60000);
  if (minutes < 2) return "in 1 min";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

const KIND: Record<string, string> = {
  pdf: "PDF",
  ppt: "Presentation",
  pptx: "Presentation",
  key: "Presentation",
  doc: "Document",
  docx: "Document",
  txt: "Document",
  md: "Document",
  xls: "Spreadsheet",
  xlsx: "Spreadsheet",
  csv: "Spreadsheet",
  zip: "Archive",
  rar: "Archive",
  "7z": "Archive",
  png: "Image",
  jpg: "Image",
  jpeg: "Image",
  gif: "Image",
  webp: "Image",
  heic: "Image",
  mp4: "Video",
  mov: "Video",
  webm: "Video",
  mp3: "Audio",
  wav: "Audio",
  m4a: "Audio",
};

export function fileKind(name: string, type: string): string {
  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return KIND[ext] ?? "File";
}

export function roomCode(id: string): string {
  return id.split("-")[0]?.toUpperCase() ?? id.toUpperCase();
}
