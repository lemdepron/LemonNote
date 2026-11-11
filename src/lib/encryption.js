/**
 * LemonNote encryption utilities using Web Crypto API.
 *
 * Algorithm: AES-GCM with 256-bit key derived via PBKDF2 (SHA-256, 100,000 iterations).
 * Storage format: base64(salt(16) + iv(12) + ciphertext)
 *
 * No custom crypto. All operations use browser's built-in crypto.subtle.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256; // bits
const HASH_ALGORITHM = "SHA-256";

/**
 * Derive an AES-GCM key from a password using PBKDF2.
 * @param {string} password - User's password
 * @param {Uint8Array} salt - Random salt (16 bytes)
 * @param {number} iterations - PBKDF2 iterations (default 100,000)
 * @returns {Promise<CryptoKey>} - Derived key for encrypt/decrypt
 */
export async function deriveKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: HASH_ALGORITHM },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext with a password.
 * @param {string} plaintext - Text to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<string>} - Base64 encoded: salt(16) + iv(12) + ciphertext
 */
export async function encrypt(plaintext, password) {
  if (typeof plaintext !== "string") {
    throw new Error("Plaintext must be a string");
  }
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string");
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Combine: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  // Return as base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext with a password.
 * @param {string} base64Ciphertext - Base64 encoded: salt(16) + iv(12) + ciphertext
 * @param {string} password - Decryption password
 * @returns {Promise<string>} - Decrypted plaintext
 * @throws {Error} If password is wrong or data is tampered (AES-GCM auth tag verification fails)
 */
export async function decrypt(base64Ciphertext, password) {
  if (typeof base64Ciphertext !== "string" || base64Ciphertext.length === 0) {
    throw new Error("Ciphertext must be a non-empty string");
  }
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string");
  }

  // Decode base64
  let combined;
  try {
    const binary = atob(base64Ciphertext);
    combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }
  } catch (err) {
    throw new Error("Invalid ciphertext format (not valid base64)");
  }

  // Extract components
  if (combined.length < SALT_LENGTH + IV_LENGTH) {
    throw new Error("Ciphertext too short");
  }

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  } catch (err) {
    // AES-GCM auth tag verification failed - wrong password or tampered data
    throw new Error("Decryption failed: incorrect password or corrupted data");
  }

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a string looks like valid encrypted data (base64, correct minimum length).
 * @param {string} value - String to check
 * @returns {boolean} - True if it could be encrypted data
 */
export function looksEncrypted(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const binary = atob(value);
    // Minimum: salt(16) + iv(12) + at least 1 byte ciphertext + auth tag (16 bytes for AES-GCM)
    return binary.length >= SALT_LENGTH + IV_LENGTH + 17;
  } catch {
    return false;
  }
}

/**
 * Check if a note is locked (encrypted).
 * @param {object} note - Note object from database
 * @returns {boolean} - True if the note has encrypted content
 */
export function isNoteLocked(note) {
  return Boolean(note?.encrypted_body && looksEncrypted(note.encrypted_body));
}