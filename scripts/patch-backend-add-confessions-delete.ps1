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

if ($text -match "app\.delete\('/api/confessions/:id'") {
  Write-Host 'Confessions DELETE route already present; nothing to do.'
  exit 0
}

$anchor = "app.get('/api/site-content/:key'"
$anchorIndex = $text.IndexOf($anchor, [System.StringComparison]::Ordinal)
if ($anchorIndex -lt 0) {
  throw "Anchor not found ($anchor). Refusing to patch automatically."
}

$snippet = @"

app.delete('/api/confessions/:id', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.CONFESSIONS), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.confession.delete({ where: { id } });
    return res.status(200).json({ message: 'Confession deleted successfully' });
  } catch (error) {
    // If it's already gone, treat as success.
    if (String(error?.code || '') === 'P2025') {
      return res.status(200).json({ message: 'Confession deleted successfully' });
    }
    return internalServerError(res, error);
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

