$ErrorActionPreference = 'Stop'

$backendRoot = 'C:\Users\michelle\Documents\PICC\picc-backend'
$serverPath = Join-Path $backendRoot 'server.js'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = "$serverPath.bak-$timestamp"
Copy-Item -LiteralPath $serverPath -Destination $backup

$text = Get-Content -LiteralPath $serverPath -Raw

if ($text -match "app\.delete\('/api/quote-of-month'") {
  Write-Host "DELETE /api/quote-of-month already exists. No changes made."
  Write-Host "Backup: $backup"
  exit 0
}

$insertAfter = "app.post('/api/quote-of-month', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.QUOTE_OF_MONTH), async (req, res) => {"
$idx = $text.IndexOf($insertAfter)
if ($idx -lt 0) {
  throw "Could not find quote-of-month POST route anchor in server.js."
}

# Find end of that route block by locating the next occurrence of `app.post('/api/devotions'`
$nextAnchor = "app.post('/api/devotions'"
$nextIdx = $text.IndexOf($nextAnchor, $idx)
if ($nextIdx -lt 0) {
  throw "Could not find devotions route anchor after quote-of-month route in server.js."
}

$deleteRoute = @"
app.delete('/api/quote-of-month', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.QUOTE_OF_MONTH), async (req, res) => {
  try {
    await prisma.quoteOfMonth.delete({
      where: { key: 'current' },
    });
    return res.status(204).end();
  } catch (error) {
    // If it's already gone, treat as success.
    if (String(error?.code || '') === 'P2025') {
      return res.status(204).end();
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

"@

$updated = $text.Substring(0, $nextIdx) + $deleteRoute + $text.Substring($nextIdx)
Set-Content -LiteralPath $serverPath -Value $updated -Encoding utf8

Write-Host "Inserted DELETE /api/quote-of-month."
Write-Host "Updated: $serverPath"
Write-Host "Backup: $backup"
