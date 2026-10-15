export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

export interface TransferMeta {
  id: string;
  senderName: string;
  files: FileMeta[];
  expiresAt: string;
  cancelled: boolean;
  expired: boolean;
}

export type FileStatus = "waiting" | "active" | "done" | "error";

export interface FileProgress {
  name: string;
  size: number;
  type: string;
  transferred: number;
  status: FileStatus;
}

export type TransferPhase =
  | "signaling"
  | "waiting"
  | "connecting"
  | "connected"
  | "transferring"
  | "done"
  | "failed"
  | "cancelled";

export interface SaveLink {
  name: string;
  url: string;
}

export interface TransferSnap {
  phase: TransferPhase;
  detail: string;
  candidateType: string | null;
  bytesTransferred: number;
  bytesTotal: number;
  files: FileProgress[];
  peerCount: number;
  completedPeers: number;
  speedBps: number | null;
  error: string | null;
  saves: SaveLink[];
}

export const EXPIRY_OPTIONS = [
  { seconds: 900, label: "15 minutes" },
  { seconds: 3600, label: "1 hour" },
  { seconds: 14400, label: "4 hours" },
  { seconds: 86400, label: "24 hours" },
] as const;
