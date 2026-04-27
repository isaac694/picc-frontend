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
# prisma/schema.prisma: add model if missing
#
$schemaText = Get-Content -LiteralPath $schemaPath -Raw
if ($schemaText -notmatch '(?m)^model HopeSchoolRegistration\s*\{') {
  $append = @'

model HopeSchoolRegistration {
    id        String   @id @default(cuid())
    firstName String
    lastName  String
    email     String
    phone     String
    data      Json
    createdAt DateTime @default(now())

    @@index([createdAt])
}
'@

  $schemaText = $schemaText.TrimEnd() + $append + [Environment]::NewLine
  Set-Content -LiteralPath $schemaPath -Value $schemaText -Encoding utf8
  Write-Host "Updated: $schemaPath (added HopeSchoolRegistration)"
} else {
  Write-Host "schema.prisma already has HopeSchoolRegistration; skipping."
}

#
# prisma migration: create table if not present
#
$migrationName = (Get-Date -Format 'yyyyMMddHHmmss') + '_add_hope_school_registration'
$migrationDir = Join-Path $migrationsRoot $migrationName
New-Item -ItemType Directory -Force -Path $migrationDir | Out-Null

$migrationSql = @'
-- CreateTable
CREATE TABLE "HopeSchoolRegistration" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HopeSchoolRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HopeSchoolRegistration_createdAt_idx" ON "HopeSchoolRegistration"("createdAt");
'@

Set-Content -LiteralPath (Join-Path $migrationDir 'migration.sql') -Value $migrationSql -Encoding utf8
Write-Host "Added migration: $migrationName"

#
# server.js: add route + ensure sendEmail import
#
$serverText = Get-Content -LiteralPath $serverPath -Raw

if ($serverText -notmatch "sendEmail") {
  $serverText = $serverText.Replace(
    "{ sendGivingConfirmationEmail, sendSermonNotificationToAllSubscribers }",
    "{ sendEmail, sendGivingConfirmationEmail, sendSermonNotificationToAllSubscribers }"
  )
}

if ($serverText -match "app\.post\('/api/hope-school/registrations'") {
  Set-Content -LiteralPath $serverPath -Value $serverText -Encoding utf8
  Write-Host "Hope School route already exists; leaving server.js unchanged."
  exit 0
}

$anchor = "app.post('/api/contact', async (req, res) => {"
$pos = $serverText.IndexOf($anchor)
if ($pos -lt 0) {
  throw "Could not find anchor route in server.js: $anchor"
}

# Insert just before contact route (keeps similar public form handlers grouped)
$insertAt = $pos

$hopeRoute = @"
app.post('/api/hope-school/registrations', async (req, res) => {
  try {
    const payload = req.body || {};
    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = String(payload.phone || '').trim();

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const registration = await prisma.hopeSchoolRegistration.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        data: payload,
      },
    });

    const subject = `Hope School Registration - ${firstName} ${lastName}`;
    const text = [
      'New Hope School registration received.',
      '',
      `Registration ID: ${registration.id}`,
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      'Full payload:',
      JSON.stringify(payload, null, 2),
    ].join('\\n');

    try {
      await sendEmail('hopeschool@piccworldwide.org', subject, text);
    } catch (emailError) {
      console.error('Failed sending Hope School registration email:', emailError);
      // Still succeed; record is saved in DB.
    }

    return res.status(201).json({ id: registration.id });
  } catch (error) {
    return internalServerError(res, error);
  }
});

"@

$serverText = $serverText.Substring(0, $insertAt) + $hopeRoute + $serverText.Substring($insertAt)
Set-Content -LiteralPath $serverPath -Value $serverText -Encoding utf8
Write-Host "Updated: $serverPath (added Hope School registration route)"
Write-Host "Done."
