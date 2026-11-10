# Spec: Note Encryption (Single-Note Lock)

## Objective
Add optional per-note encryption using the browser's Web Crypto API (AES-GCM with PBKDF2 key derivation). When a note is locked:
- The body is stored encrypted in IndexedDB; the title remains readable (optionally encrypted too)
- Locked notes show a lock screen until unlocked for the session
- Locked notes are excluded from search, backlinks, graph, and exports unless unlocked
- Backups keep encrypted notes encrypted
- "Remove lock" and "Change password" require the current password

## Tech Stack
- React 18, Vite 8, plain JavaScript (`.jsx` / `.js`, no TypeScript)
- Web Crypto API (built into browsers) — AES-GCM for encryption, PBKDF2 for key derivation
- IndexedDB via existing `localDb.js` abstraction

## Commands
```
Build: npm run build
Test: npm test
Lint: npx eslint src --quiet
Dev: npm run dev
```

## Project Structure
```
src/
  api/
    localDb.js          # Database schema - add encryption fields to Note entity
  lib/
    encryption.js       # NEW - Web Crypto utilities (encrypt, decrypt, deriveKey)
    vault.js            # Modify - filter out locked notes from search/backlinks/graph
    note-export.js      # Modify - skip locked notes in exports
    backup.js           # Modify - keep encrypted notes encrypted in backups
    notes.js            # Modify - handle encrypted notes in trash/restore
  hooks/
    useVault.js         # Modify - filter locked notes from vault view
  pages/
    NotePage.jsx        # Modify - show lock screen, handle unlock
  components/
    ribbon/
      FilePanel.jsx     # Modify - add Lock/Unlock/Change password actions
  components/
    ui/
      alert-dialog.jsx  # Existing - use for password prompts
```

## Code Style
```javascript
// Pure functions in lib/encryption.js - no React, no side effects
export async function deriveKey(password, salt, iterations = 100000) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // Return combined: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined)); // base64 for storage
}
```

## Testing Strategy
- Unit tests in `src/lib/encryption.test.js` using Node.js with `fake-indexeddb` and `jsdom`
- Test cases:
  1. Encrypt/decrypt round trip with correct password
  2. Wrong password fails safely (throws or returns null)
  3. Tampered ciphertext is detected (AES-GCM auth tag verification)
  4. Different passwords produce different ciphertexts
  5. Empty string encryption/decryption
- Integration test: lock a note, reload page, unlock with password, verify body visible
- No E2E tests needed (hand-tested in browser)

## Boundaries
- **Always do:**
  - Use Web Crypto API only (no custom crypto)
  - Keep encryption logic in `src/lib/encryption.js` (pure functions)
  - Store only base64-encoded combined salt+iv+ciphertext in DB
  - Keep title readable by default (optionally encrypted)
  - Exclude locked notes from search/backlinks/graph/exports
  - Keep encrypted notes encrypted in backups

- **Ask first:**
  - Changing the Note entity schema in localDb.js (requires DB_VERSION bump)
  - Adding new dependencies (none needed for Web Crypto)

- **Never do:**
  - Store passwords or keys anywhere (only derived keys in memory during session)
  - Allow recovery of forgotten passwords
  - Send encryption keys over network
  - Use custom crypto implementations

## Success Criteria
1. User can lock a note via File menu → "Lock note" with password (entered twice) + warning
2. Locked note shows lock screen with password prompt; correct password unlocks for session
3. Locked note body is encrypted in IndexedDB (verify via DevTools Application tab)
4. Locked notes excluded from: vault search, backlinks, graph view, markdown/HTML/PDF export
5. "Remove lock" and "Change password" require current password
6. Backups export encrypted notes as encrypted (body remains unreadable)
7. Wrong password shows error, doesn't unlock
8. Tampered encrypted data fails to decrypt (auth tag verification)
9. Existing unencrypted notes continue to work unchanged
10. Node tests pass: encrypt/decrypt round trip, wrong password, tampered data

## Open Questions
1. Should title encryption be optional in the lock dialog? (Spec says "owner's choice in the dialog" - will add checkbox)
2. What iteration count for PBKDF2? (100,000 is standard for Web Crypto; 600,000 is OWASP 2023 recommendation but slower on mobile)
3. Should we add a "lock timeout" to auto-lock after inactivity? (Not in current scope - session-only unlock)

## Data Model Changes (localDb.js)
Add to `DEFAULTS.Note`:
```javascript
Note: { 
  format: "markdown", 
  folder: "", 
  favourite: false,
  // Encryption fields (all optional for backward compatibility)
  is_encrypted: false,           // boolean
  encrypted_body: null,          // base64 string: salt(16) + iv(12) + ciphertext
  encryption_salt: null,         // deprecated - kept in encrypted_body
  encryption_iv: null,           // deprecated - kept in encrypted_body
  encryption_version: 1,         // for future migration
  title_encrypted: false         // boolean - if true, title is also encrypted
}
```
Bump `DB_VERSION` from 4 to 5 and add migration test.