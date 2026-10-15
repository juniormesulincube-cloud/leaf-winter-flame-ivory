const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function chunk(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/** Unguessable transfer id, also used as the signaling room. */
export function makeTransferId(): string {
  return `${chunk(4)}-${chunk(4)}`;
}

export function makeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function makePeerId(role: "s" | "r"): string {
  return `${role}${chunk(12)}`;
}
