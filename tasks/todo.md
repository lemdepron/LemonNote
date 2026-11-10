# Tasks: Note Encryption

- [x] Task 1: Create encryption library (`src/lib/encryption.js`)
  - Acceptance: Pure functions for deriveKey, encrypt, decrypt; no React dependencies
  - Verify: Manual inspection; unit tests in Task 9
  - Files: `src/lib/encryption.js` (new)

- [x] Task 2: Update localDb.js schema
  - Acceptance: DB_VERSION 4→5, Note DEFAULTS includes encryption fields, migration test
  - Verify: `npm run build`, migration test passes
  - Files: `src/api/localDb.js`, `src/api/localDb.migration.test.js`

- [x] Task 3: Update vault filtering
  - Acceptance: Search/backlinks/graph exclude locked notes; useVault filters them
  - Verify: Manual test - locked note hidden from search/backlinks/graph
  - Files: `src/lib/vault.js`, `src/lib/graph.js`, `src/hooks/useVault.js`

- [x] Task 4: Update exports and backup
  - Acceptance: Exports skip locked notes; backup keeps encrypted notes encrypted
  - Verify: Manual test - export locked note, verify body not in output
  - Files: `src/lib/note-export.js`, `src/lib/backup.js`

- [x] Task 5: Update notes lifecycle
  - Acceptance: Trash/restore/delete preserve encryption fields (already preserved by db update)
  - Verify: Manual test - trash/restore locked note, verify still locked
  - Files: `src/lib/notes.js` (no changes needed - encryption fields preserved automatically)

- [x] Task 6: NotePage lock screen & unlock
  - Acceptance: Lock screen on encrypted note; unlock with password for session
  - Verify: Manual test - lock note, reload, unlock, verify body visible
  - Files: `src/pages/NotePage.jsx`

- [x] Task 7: FilePanel lock/unlock/change password
  - Acceptance: Lock (password 2x + warning), Remove lock (current password), Change password (current + new 2x)
  - Verify: Manual test - full lock/unlock/change/remove cycle
  - Files: `src/components/ribbon/FilePanel.jsx`

- [x] Task 8: Add translations
  - Acceptance: All new UI strings for encryption features
  - Verify: Manual test - UI shows correct English text
  - Files: `src/lib/locales/en.json`

- [x] Task 9: Write Node.js tests
  - Acceptance: Round trip, wrong password, tampered data, different passwords, empty string
  - Verify: `node src/lib/encryption.test.js` passes
  - Files: `src/lib/encryption.test.js` (new)

- [x] Final verification
  - Acceptance: `npx eslint src --quiet` and `npm run build` both pass
  - Verify: Run commands and confirm no errors