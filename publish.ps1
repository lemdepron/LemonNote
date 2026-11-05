# LemonNote publisher: uploads the project to GitHub, step by step, with safety checks.
# Run from inside the LemonNote folder:
#   powershell -ExecutionPolicy Bypass -File .\publish.ps1

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not installed. Install it from https://git-scm.com, close PowerShell, open it again, and rerun this script."
  exit 1
}
if (-not (Test-Path "package.json")) {
  Write-Host "package.json not found. Open PowerShell inside the LemonNote folder and run this again."
  exit 1
}
if (-not (Test-Path "LICENSE")) {
  Write-Host "LICENSE file not found. Copy LICENSE into this folder first."
  exit 1
}

Write-Host ""
Write-Host "Step 1 of 4: who you are (saved only on this computer, shown on your uploads)"
$name  = Read-Host "Your name"
$email = Read-Host "Your GitHub noreply email (ends with @users.noreply.github.com)"
$user  = Read-Host "Your GitHub username"
git config --global user.name "$name"
git config --global user.email "$email"

Write-Host ""
Write-Host "Step 2 of 4: collecting the files"
if (-not (Test-Path ".git")) { git init | Out-Null }
git add .

# Safety check: these must never be uploaded.
$bad = git ls-files | Select-String -Pattern '^(node_modules/|dist/|_removed/|\.env)'
if ($bad) {
  Write-Host ""
  Write-Host "STOP. These files must not be uploaded:"
  $bad | ForEach-Object { Write-Host "  $_" }
  git reset | Out-Null
  Write-Host "Nothing was uploaded. Send me this list."
  exit 1
}

$count = (git ls-files | Measure-Object).Count
Write-Host "Safety check passed. $count files will be uploaded. Top-level items:"
git ls-files | ForEach-Object { $_.Split('/')[0] } | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }

Write-Host ""
$ok = Read-Host "Do these look right? Type YES to continue"
if ($ok -ne "YES") {
  git reset | Out-Null
  Write-Host "Cancelled. Nothing was uploaded."
  exit 0
}

Write-Host ""
Write-Host "Step 3 of 4: saving a snapshot"
git commit -m "LemonNote: first local-first version"
git branch -M main

Write-Host ""
Write-Host "Step 4 of 4: uploading to GitHub (a browser window may ask you to sign in)"
if (git remote) { git remote remove origin }
git remote add origin "https://github.com/$user/LemonNote.git"
git push -u origin main

Write-Host ""
Write-Host "If there were no red 'fatal' lines above, open: https://github.com/$user/LemonNote"
