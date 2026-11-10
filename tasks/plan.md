# Implementation Plan: Note Encryption

## Phase Overview
1. **Core encryption library** (`src/lib/encryption.js`) - pure Web Crypto functions
2. **Database schema** (`src/api/localDb.js`) - add encryption fields, bump DB_VERSION, add migration test
3. **Vault filtering** (`src/lib/vault.js`, `src/hooks/useVault.js`) - exclude locked notes from search/backlinks/graph
4. **Export/Backup** (`src/lib/note-export.js`, `src/lib/backup.js`) - skip/keep encrypted notes
5. **Notes lifecycle** (`src/lib/notes.js`) - handle encrypted notes in trash/restore/delete
6. **UI: Lock screen & unlock** (`src/pages/NotePage.jsx`) - show lock screen, handle password unlock
7. **UI: File menu actions** (`src/components/ribbon/FilePanel.jsx`) - Lock/Unlock/Change password
8. **Translations** (`src/lib/locales/en.json`) - add encryption-related strings
9. **Tests** (`src/lib/encryption.test.js`) - Node.js unit tests

## Task Breakdown

### Task 1: Create encryption library
- **Files**: `src/lib/encryption.js` (new)
- **Acceptance**: Pure functions for deriveKey, encrypt, decrypt; no React dependencies
- **Verify**: Manual inspection; unit tests in Task 9

### Task 2: Update localDb.js schema
- **Files**: `src/api/localDb.js`, `src/api/localDb.migration.test.js` (new or update)
- **Acceptance**: 
  - DB_VERSION bumped from 4 to 5
  - Note DEFAULTS includes encryption fields
  - Migration test verifies old notes open without encryption fields
- **Verify**: `npm run build`, check migration test passes

### Task 3: Update vault filtering
- **Files**: `src/lib/vault.js`, `src/hooks/useVault.js`
- **Acceptance**: 
  - `extractWikiLinks`, `backlinksFor`, `buildLinkIndex` skip encrypted notes
  - `useVault` filteredNotes excludes locked notes (unless unlocked in session)
  - Graph building skips encrypted notes
- **Verify**: Manual test - locked note doesn't appear in search/backlinks/graph

### Task 4: Update exports and backup
- **Files**: `src/lib/note-export.js`, `src/lib/backup.js`
- **Acceptance**:
  - `exportMarkdown/Html/Pdf` skip locked notes (show warning or skip silently)
  - `exportAllNotesAsZip` skips locked notes
  - `exportBackup` keeps encrypted_body as-is (doesn't decrypt)
  - `importBackup` restores encrypted notes as encrypted
- **Verify**: Manual test - export locked note, verify body not in output

### Task 5: Update notes lifecycle
- **Files**: `src/lib/notes.js`
- **Acceptance**:
  - `trashNote`, `restoreNote`, `deleteNoteForever` preserve encryption fields
  - `purgeExpiredNotes` handles encrypted notes
- **Verify**: Manual test - trash/restore locked note, verify still locked

### Task 6: NotePage lock screen & unlock
- **Files**: `src/pages/NotePage.jsx`
- **Acceptance**:
  - Detect encrypted note on load
  - Show lock screen with password input if encrypted and not unlocked in session
  - Unlock with correct password → show note body, decrypt in memory
  - Wrong password shows error, stays locked
  - Session unlock persists until page unload/navigation
- **Verify**: Manual test - lock note, reload, unlock, verify body visible

### Task 7: FilePanel lock/unlock/change password
- **Files**: `src/components/ribbon/FilePanel.jsx`
- **Acceptance**:
  - "Lock note" action: password twice + warning dialog → encrypt body, save
  - "Remove lock" action: requires current password → decrypt, save plaintext
  - "Change password" action: current + new twice → re-encrypt with new key
  - All actions update note via db.entities.Note.update
- **Verify**: Manual test - lock, unlock, change password, remove lock

### Task 8: Add translations
- **Files**: `src/lib/locales/en.json`
- **Acceptance**: All new UI strings for lock/unlock/change password/warnings
- **Verify**: Manual test - UI shows correct English text

### Task 9: Write Node.js tests
- **Files**: `src/lib/encryption.test.js` (new)
- **Acceptance**: Tests for:
  1. Encrypt/decrypt round trip with correct password
  2. Wrong password fails safely
  3. Tampered ciphertext detected (AES-GCM auth tag)
  4. Different passwords → different ciphertexts
  5. Empty string encryption/decryption
- **Verify**: `node src/lib/encryption.test.js` passes

## Dependencies & Order
```
Task 1 (encryption lib) 
  → Task 2 (DB schema) 
    → Task 3 (vault filtering) 
    → Task 6 (NotePage lock screen)
  → Task 4 (export/backup) 
  → Task 5 (notes lifecycle)
  → Task 7 (FilePanel actions)
  → Task 8 (translations)
Task 1 → Task 9 (tests, can run in parallel after Task 1)
```

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| DB migration breaks existing notes | Migration test in localDb.migration.test.js verifies old notes load |
| Forgotten password = data loss | Clear warning in UI; no recovery mechanism by design |
| Performance: decrypt on every load | Only decrypt when unlocking; keep decrypted in memory for session |
| Web Crypto not available (old browsers) | LemonNote targets modern browsers; Web Crypto is widely supported |
| Encrypted notes in search results | Filter at vault level (useVault) before components receive notes |

## Verification Checkpoints
1. After Task 2: `npm run build` passes, migration test passes
2. After Task 6: Manual test - lock note, reload, unlock works
3. After Task 7: Manual test - full lock/unlock/change/remove cycle
4. After Task 9: `node src/lib/encryption.test.js` all pass
5. Final: `npx eslint src --quiet` and `npm run build` both pass