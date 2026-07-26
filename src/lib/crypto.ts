import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Credential vault.
 *
 * Shared-account resale means storing a password you must be able to read back,
 * so hashing is not an option — this is reversible encryption, deliberately.
 * AES-256-GCM with a per-record random IV; the key never leaves the server and
 * is never committed. Ciphertext format: v1.<iv>.<tag>.<payload> (all base64url).
 *
 * Threat model: protects against a leaked database dump. Does NOT protect
 * against a compromised server. Treat the key like a production secret.
 */

const VERSION = "v1";
const IV_BYTES = 12;

function key(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is missing. Generate one with `npm run keygen`.",
    );
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes (base64).",
    );
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [
    VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    payload.toString("base64url"),
  ].join(".");
}

export function decryptSecret(ciphertext: string | null): string | null {
  if (!ciphertext) return null;

  const [version, iv, tag, payload] = ciphertext.split(".");
  if (version !== VERSION || !iv || !tag || !payload) {
    // Pre-encryption rows, or a corrupted value. Surface rather than crash.
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(payload, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function isEncrypted(value: string | null): value is string {
  return Boolean(value?.startsWith(`${VERSION}.`));
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
