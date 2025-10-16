param()

# Simple guard to avoid committing secrets by accident
$ErrorActionPreference = 'Stop'

# Block committing .env files
$stagedFiles = git diff --cached --name-only
if ($LASTEXITCODE -ne 0) { exit 0 }

$blocked = @()
foreach ($f in $stagedFiles) {
  if ($f -match '^\.env(\..*)?$') { $blocked += $f }
}

if ($blocked.Count -gt 0) {
  Write-Host "Prevented commit: refusing to commit env files:" -ForegroundColor Red
  $blocked | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  Write-Host "Remove from index: git reset HEAD -- `"$($blocked -join '`" `"')`""
  exit 1
}

# Scan staged diff for sensitive keys
$diff = git diff --cached
$patterns = @(
  'DATABASE_URL=',
  'DIRECT_URL=',
  'PGPASSWORD=',
  'STACK_SECRET_SERVER_KEY=',
  'POSTGRES_URL=',
  'POSTGRES_PASSWORD='
)

foreach ($p in $patterns) {
  if ($diff -match [Regex]::Escape($p)) {
    Write-Host "Prevented commit: staged changes appear to contain secrets ($p)" -ForegroundColor Red
    Write-Host "Please move secrets to .env / Vercel env and restage."
    exit 1
  }
}

exit 0

