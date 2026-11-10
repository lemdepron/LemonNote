/**
 * Node.js tests for encryption utilities.
 * Run with: node src/lib/encryption.test.js
 * 
 * Requires: npm i --no-save fake-indexeddb jsdom (for Web Crypto polyfill in Node)
 */

// Polyfill Web Crypto for Node.js
if (typeof globalThis.crypto === "undefined") {
  const { webcrypto } = await import("node:crypto");
  globalThis.crypto = webcrypto;
}

// Polyfill TextEncoder/TextDecoder
if (typeof globalThis.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = await import("node:util");
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill btoa/atob
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str) => Buffer.from(str, "binary").toString("base64");
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (str) => Buffer.from(str, "base64").toString("binary");
}

// Import the encryption module
import { deriveKey, encrypt, decrypt, looksEncrypted } from "./encryption.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`  ✗ ${message} (expected to throw)`);
    failed++;
  } catch (err) {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

async function assertThrowsAsync(fn, message) {
  try {
    await fn();
    console.error(`  ✗ ${message} (expected to throw)`);
    failed++;
  } catch (err) {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log("\n=== Encryption Library Tests ===\n");

  // Test 1: Encrypt/decrypt round trip with correct password
  console.log("Test 1: Encrypt/decrypt round trip");
  const plaintext1 = "Hello, world! This is a test note with some content.";
  const password1 = "correct-password-123";
  const encrypted1 = await encrypt(plaintext1, password1);
  assert(typeof encrypted1 === "string" && encrypted1.length > 0, "encrypt returns base64 string");
  const decrypted1 = await decrypt(encrypted1, password1);
  assert(decrypted1 === plaintext1, "decrypt returns original plaintext");

  // Test 2: Wrong password fails safely
  console.log("\nTest 2: Wrong password fails safely");
  const plaintext2 = "Secret content";
  const password2 = "correct-password";
  const wrongPassword = "wrong-password";
  const encrypted2 = await encrypt(plaintext2, password2);
  await assertThrowsAsync(
    () => decrypt(encrypted2, wrongPassword),
    "decrypt throws with wrong password"
  );

  // Test 3: Tampered ciphertext is detected
  console.log("\nTest 3: Tampered ciphertext detected");
  const plaintext3 = "Tamper test";
  const password3 = "password";
  const encrypted3 = await encrypt(plaintext3, password3);
  // Tamper with the base64 string (flip a bit in the middle)
  const tampered = encrypted3.slice(0, 20) + "X" + encrypted3.slice(21);
  await assertThrowsAsync(
    () => decrypt(tampered, password3),
    "decrypt throws with tampered ciphertext"
  );

  // Test 4: Different passwords produce different ciphertexts
  console.log("\nTest 4: Different passwords produce different ciphertexts");
  const plaintext4 = "Same content";
  const encrypted4a = await encrypt(plaintext4, "password-a");
  const encrypted4b = await encrypt(plaintext4, "password-b");
  assert(encrypted4a !== encrypted4b, "different passwords produce different ciphertexts");

  // Test 5: Empty string encryption/decryption
  console.log("\nTest 5: Empty string encryption/decryption");
  const plaintext5 = "";
  const password5 = "password";
  const encrypted5 = await encrypt(plaintext5, password5);
  const decrypted5 = await decrypt(encrypted5, password5);
  assert(decrypted5 === "", "empty string round trip works");

  // Test 6: Unicode content
  console.log("\nTest 6: Unicode content");
  const plaintext6 = "Hello 世界 🌍 Привет мир";
  const password6 = "unicode-password";
  const encrypted6 = await encrypt(plaintext6, password6);
  const decrypted6 = await decrypt(encrypted6, password6);
  assert(decrypted6 === plaintext6, "unicode content round trip works");

  // Test 7: Long content
  console.log("\nTest 7: Long content (10KB)");
  const plaintext7 = "x".repeat(10000);
  const password7 = "long-password";
  const encrypted7 = await encrypt(plaintext7, password7);
  const decrypted7 = await decrypt(encrypted7, password7);
  assert(decrypted7 === plaintext7, "long content round trip works");

  // Test 8: looksEncrypted function
  console.log("\nTest 8: looksEncrypted function");
  const validEncrypted = await encrypt("test", "pass");
  assert(looksEncrypted(validEncrypted) === true, "valid encrypted returns true");
  assert(looksEncrypted("not-base64!") === false, "invalid base64 returns false");
  assert(looksEncrypted("") === false, "empty string returns false");
  assert(looksEncrypted("dGhpcyBpcyBub3QgZW5jcnlwdGVk") === false, "valid base64 but too short returns false");

  // Test 9: Special characters in password
  console.log("\nTest 9: Special characters in password");
  const plaintext9 = "Content with special password";
  const password9 = "p@$$w0rd!#$%^&*()";
  const encrypted9 = await encrypt(plaintext9, password9);
  const decrypted9 = await decrypt(encrypted9, password9);
  assert(decrypted9 === plaintext9, "special characters in password work");

  // Test 10: Multiple encryptions of same content with same password produce different ciphertexts (due to random salt/IV)
  console.log("\nTest 10: Non-deterministic encryption (random salt/IV)");
  const plaintext10 = "Same content";
  const password10 = "same-password";
  const encrypted10a = await encrypt(plaintext10, password10);
  const encrypted10b = await encrypt(plaintext10, password10);
  assert(encrypted10a !== encrypted10b, "same password produces different ciphertexts each time");
  const decrypted10a = await decrypt(encrypted10a, password10);
  const decrypted10b = await decrypt(encrypted10b, password10);
  assert(decrypted10a === plaintext10 && decrypted10b === plaintext10, "both decrypt to original");

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});