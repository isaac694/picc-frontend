$ErrorActionPreference = 'Stop'

$backendRoot = 'C:\Users\michelle\Documents\PICC\picc-backend'
$serverPath = Join-Path $backendRoot 'server.js'
$schemaPath = Join-Path $backendRoot 'prisma\schema.prisma'
$migrationsRoot = Join-Path $backendRoot 'prisma\migrations'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath $serverPath -Destination "$serverPath.bak-$timestamp"
Copy-Item -LiteralPath $schemaPath -Destination "$schemaPath.bak-$timestamp"

Write-Host "Backups created:"
Write-Host " - $serverPath.bak-$timestamp"
Write-Host " - $schemaPath.bak-$timestamp"

#
# prisma/schema.prisma: add model
#
$schemaText = Get-Content -LiteralPath $schemaPath -Raw
if ($schemaText -notmatch '(?m)^model SchoolIntake\s*\{') {
  $append = @'

model SchoolIntake {
    id        String   @id @default(cuid())
    schoolKey String
    label     String
    opensOn   DateTime?
    closesOn  DateTime?
    isActive  Boolean  @default(true)
    sortOrder Int      @default(0)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([schoolKey, sortOrder])
    @@index([schoolKey, createdAt])
}
'@

  $schemaText = $schemaText.TrimEnd() + $append + [Environment]::NewLine
  Set-Content -LiteralPath $schemaPath -Value $schemaText -Encoding utf8
  Write-Host "Updated: $schemaPath (added SchoolIntake)"
} else {
  Write-Host "schema.prisma already has SchoolIntake; skipping."
}

#
# prisma migration
#
$migrationName = (Get-Date -Format 'yyyyMMddHHmmss') + '_add_school_intakes'
$migrationDir = Join-Path $migrationsRoot $migrationName
New-Item -ItemType Directory -Force -Path $migrationDir | Out-Null

$migrationSql = @'
-- CreateTable
CREATE TABLE "SchoolIntake" (
    "id" TEXT NOT NULL,
    "schoolKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "opensOn" TIMESTAMP(3),
    "closesOn" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolIntake_schoolKey_sortOrder_idx" ON "SchoolIntake"("schoolKey", "sortOrder");

-- CreateIndex
CREATE INDEX "SchoolIntake_schoolKey_createdAt_idx" ON "SchoolIntake"("schoolKey", "createdAt");
'@

Set-Content -LiteralPath (Join-Path $migrationDir 'migration.sql') -Value $migrationSql -Encoding utf8
Write-Host "Added migration: $migrationName"

#
# server.js: add ADMIN_PAGE constant + endpoints
#
$serverText = Get-Content -LiteralPath $serverPath -Raw

# Add admin page constant on both backend and frontend; here backend.
if ($serverText -notmatch "SCHOOLS_ENROLLMENT") {
  $serverText = $serverText.Replace("  FAQS: 'FAQS',", "  FAQS: 'FAQS'," + [Environment]::NewLine + "  SCHOOLS_ENROLLMENT: 'SCHOOLS_ENROLLMENT',")
}

if ($serverText -match "app\.get\('/api/schools/:schoolKey/intakes'") {
  Set-Content -LiteralPath $serverPath -Value $serverText -Encoding utf8
  Write-Host "School intake routes already exist; leaving server.js unchanged."
  exit 0
}

$schoolRoutes = @"
function normalizeSchoolKey(value) {
  const k = String(value || '').trim().toLowerCase();
  const allowed = new Set(['hope-school', 'discipleship', 'picc-secondary']);
  return allowed.has(k) ? k : null;
}

function dateOnlyToDate(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  // Expect YYYY-MM-DD
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateOnlyString(date) {
  if (!date) return null;
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

app.get('/api/schools/:schoolKey/intakes', async (req, res) => {
  const schoolKey = normalizeSchoolKey(req.params.schoolKey);
  if (!schoolKey) return res.status(404).json({ error: 'School not found' });

  try {
    const rows = await prisma.schoolIntake.findMany({
      where: { schoolKey },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const intakes = rows.map((row) => ({
      id: row.id,
      label: row.label,
      opensOn: toDateOnlyString(row.opensOn),
      closesOn: toDateOnlyString(row.closesOn),
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    }));

    return res.json({ intakes });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.get('/api/admin/schools/:schoolKey/intakes', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.SCHOOLS_ENROLLMENT), async (req, res) => {
  const schoolKey = normalizeSchoolKey(req.params.schoolKey);
  if (!schoolKey) return res.status(404).json({ error: 'School not found' });

  try {
    const rows = await prisma.schoolIntake.findMany({
      where: { schoolKey },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const intakes = rows.map((row) => ({
      id: row.id,
      label: row.label,
      opensOn: toDateOnlyString(row.opensOn),
      closesOn: toDateOnlyString(row.closesOn),
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    }));

    return res.json({ intakes });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.post('/api/admin/schools/:schoolKey/intakes', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.SCHOOLS_ENROLLMENT), async (req, res) => {
  const schoolKey = normalizeSchoolKey(req.params.schoolKey);
  if (!schoolKey) return res.status(404).json({ error: 'School not found' });

  try {
    const { label, opensOn, closesOn, isActive, sortOrder } = req.body || {};
    const normalizedLabel = String(label || '').trim();
    if (!normalizedLabel) return res.status(400).json({ error: 'Label is required' });

    const created = await prisma.schoolIntake.create({
      data: {
        schoolKey,
        label: normalizedLabel,
        opensOn: dateOnlyToDate(opensOn),
        closesOn: dateOnlyToDate(closesOn),
        isActive: typeof isActive === 'boolean' ? isActive : true,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      },
    });

    return res.status(201).json({
      intake: {
        id: created.id,
        label: created.label,
        opensOn: toDateOnlyString(created.opensOn),
        closesOn: toDateOnlyString(created.closesOn),
        isActive: created.isActive,
        sortOrder: created.sortOrder,
      },
    });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.put('/api/admin/schools/:schoolKey/intakes/:id', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.SCHOOLS_ENROLLMENT), async (req, res) => {
  const schoolKey = normalizeSchoolKey(req.params.schoolKey);
  if (!schoolKey) return res.status(404).json({ error: 'School not found' });

  try {
    const { id } = req.params;
    const { label, opensOn, closesOn, isActive, sortOrder } = req.body || {};
    const normalizedLabel = String(label || '').trim();
    if (!normalizedLabel) return res.status(400).json({ error: 'Label is required' });

    const updated = await prisma.schoolIntake.update({
      where: { id },
      data: {
        schoolKey,
        label: normalizedLabel,
        opensOn: dateOnlyToDate(opensOn),
        closesOn: dateOnlyToDate(closesOn),
        isActive: typeof isActive === 'boolean' ? isActive : true,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      },
    });

    return res.status(200).json({
      intake: {
        id: updated.id,
        label: updated.label,
        opensOn: toDateOnlyString(updated.opensOn),
        closesOn: toDateOnlyString(updated.closesOn),
        isActive: updated.isActive,
        sortOrder: updated.sortOrder,
      },
    });
  } catch (error) {
    if (String(error?.code || '') === 'P2025') {
      return res.status(404).json({ error: 'Intake not found' });
    }
    return internalServerError(res, error);
  }
});

app.delete('/api/admin/schools/:schoolKey/intakes/:id', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.SCHOOLS_ENROLLMENT), async (req, res) => {
  const schoolKey = normalizeSchoolKey(req.params.schoolKey);
  if (!schoolKey) return res.status(404).json({ error: 'School not found' });

  try {
    const { id } = req.params;
    await prisma.schoolIntake.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    if (String(error?.code || '') === 'P2025') {
      return res.status(204).end();
    }
    return internalServerError(res, error);
  }
});

"@

# Insert school routes before the 404 handler
$notFoundAnchor = "app.use((req, res) => {"
$anchorPos = $serverText.IndexOf($notFoundAnchor)
if ($anchorPos -lt 0) {
  throw "Could not find 404 handler anchor in server.js"
}

$serverText = $serverText.Substring(0, $anchorPos) + $schoolRoutes + $serverText.Substring($anchorPos)
Set-Content -LiteralPath $serverPath -Value $serverText -Encoding utf8
Write-Host "Updated: $serverPath (added school intake routes)"
Write-Host "Done."
