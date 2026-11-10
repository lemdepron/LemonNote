# Hand-Test Steps for Note Encryption

Run `npm run dev` in the project folder (PowerShell inside C:\Users\halaf\projects\LemonNote), then open http://localhost:5173 in your browser.

## Test 1: Lock a Note
1. Create a new note or open an existing one
2. Add some content to the body (e.g., "This is secret content")
3. Click the **File** menu (top-left of ribbon)
4. Go to the **Encryption** tab (lock icon)
5. Click **"Lock note"**
6. Enter a password (e.g., "test123")
7. Confirm the password
8. Read the warning carefully: "If you forget this password, the note CANNOT be recovered..."
9. Click **OK** to confirm
10. Verify toast says "Note locked successfully"
11. Page should reload and show the lock screen

## Test 2: Unlock a Locked Note
1. After locking, you should see a lock screen with password input
2. Enter the correct password ("test123")
3. Click **Unlock**
4. Verify the note content appears (decrypted in memory)
5. Verify you can edit the note normally

## Test 3: Wrong Password
1. Lock a note (Test 1)
2. On lock screen, enter wrong password
3. Click **Unlock**
4. Verify error: "Incorrect password or corrupted data"
5. Note stays locked

## Test 4: Remove Lock (via File Menu)
1. Unlock the note (Test 2)
2. Open **File** menu → **Encryption** tab
3. Should show "This note is not encrypted" status
5. Click **"Lock note"** again to re-lock
6. Unlock again
7. Go to **File** → **Encryption** → Click **"Remove lock"**
8. Enter current password
9. Verify toast: "Note unlocked successfully"
10. Page reloads, note is now unencrypted

## Test 5: Change Password
1. Lock a note (Test 1)
2. Unlock it (Test 2)
3. Go to **File** → **Encryption** → Click **"Change password"**
4. Enter current password
5. Enter new password twice
6. Verify toast: "Password changed successfully"
7. Lock the note again
8. Try unlocking with OLD password - should fail
9. Unlock with NEW password - should work

## Test 6: Locked Note Excluded from Search/Backlinks/Graph
1. Create two notes: Note A (unlocked) and Note B (locked)
2. In Note A, add a wiki-link to Note B: `[[Note B]]`
3. Open Note B (unlock if needed), verify backlinks panel shows Note A
4. Lock Note B
5. Go to vault home, search for content in Note B - should NOT appear
6. Open Note A, check backlinks - Note B should NOT be listed as backlink target
7. Open Graph view - Note B should NOT appear in graph

## Test 7: Export Skips Locked Notes
1. Lock a note (Test 1)
2. Open the note (unlock it)
3. File menu → Print/Export → Export as Markdown
4. Should fail with "Cannot export locked note. Please unlock it first."
5. Unlock the note
6. Export again - should work

## Test 8: Backup Keeps Encrypted Notes Encrypted
1. Lock a note
2. File menu → Print/Export → (in future: Backup feature)
3. When backup is implemented, encrypted notes should remain encrypted in backup
4. Import backup - encrypted notes should restore as encrypted

## Test 9: Old Notes Still Work
1. Before this feature, you had existing notes
2. Open an old note (created before encryption feature)
3. Verify it opens normally, no lock screen
4. Verify you can edit/save it
5. Verify it doesn't have encryption fields set

## Test 10: Edge Cases
1. Try to lock a NEW note (unsaved) - should show "Cannot lock a new note. Save it first."
2. Try to lock an EMPTY note - should show "Cannot lock an empty note"
3. Try to lock an already locked note - should show "Note is already locked"
4. Try to unlock a note that's not locked - should show "Note is not locked"
5. Try to change password on unlocked note - should show "Note is not locked"

## What IS Protected
- ✅ Note body encrypted in IndexedDB (AES-GCM + PBKDF2)
- ✅ Note body excluded from search, backlinks, graph
- ✅ Note body excluded from exports (markdown, HTML, PDF)
- ✅ Note body stays encrypted in backups
- ✅ Password never stored, only derived key in memory during session

## What is NOT Protected
- ❌ Note title (remains readable by default)
- ❌ Note metadata (tags, folder, favourite, dates)
- ❌ Autosave text in memory while unlocked
- ❌ App window screenshots/OS-level screen capture
- ❌ Browser DevTools memory inspection while unlocked
- ❌ Clipboard if you copy decrypted content