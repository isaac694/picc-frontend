param(
  [Parameter(Mandatory = $true)]
  [string]$BackendServerPath,

  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $BackendServerPath)) {
  throw "File not found: $BackendServerPath"
}

$bytes = [System.IO.File]::ReadAllBytes($BackendServerPath)
$encoding = [System.Text.Encoding]::GetEncoding(1252)
$text = $encoding.GetString($bytes)

if ($text -match "app\.delete\('/api/devotions/:id'") {
  Write-Host 'Devotions DELETE route already present; nothing to do.'
  exit 0
}

$anchor = "app.get('/api/services'"
$anchorIndex = $text.IndexOf($anchor, [System.StringComparison]::Ordinal)
if ($anchorIndex -lt 0) {
  throw "Anchor not found ($anchor). Refusing to patch automatically."
}

$snippet = @"

app.delete('/api/devotions/:id', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.DEVOTIONS), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.devotion.delete({ where: { id } });
    return res.status(200).json({ message: 'Devotion deleted successfully' });
  } catch (error) {
    if (String(error?.code || '') === 'P2025') {
      return res.status(200).json({ message: 'Devotion deleted successfully' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

"@

$patched = $text.Insert($anchorIndex, $snippet)

if ($DryRun) {
  Write-Host 'Dry run: patch would be applied.'
  exit 0
}

$backupPath = "$BackendServerPath.bak-codex-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
[System.IO.File]::WriteAllBytes($backupPath, $bytes)

$patchedBytes = $encoding.GetBytes($patched)
[System.IO.File]::WriteAllBytes($BackendServerPath, $patchedBytes)

Write-Host "Patched: $BackendServerPath"
Write-Host "Backup:  $backupPath"

