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
# prisma/schema.prisma
#
$schemaText = Get-Content -LiteralPath $schemaPath -Raw
$newChatModel = @'
model ChatMessage {
    id         String   @id @default(cuid())
    content    String
    videoId    String
    videoTitle String
    username   String   @default("")
    userId     String?
    user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
    createdAt  DateTime @default(now())

    @@index([videoId, createdAt])
}
'@

$updatedSchema = [regex]::Replace(
  $schemaText,
  '(?s)model ChatMessage \{.*?\n\}',
  $newChatModel
)

if ($updatedSchema -eq $schemaText) {
  throw 'Failed to update ChatMessage model in prisma/schema.prisma (pattern not found).'
}

Set-Content -LiteralPath $schemaPath -Value $updatedSchema -Encoding utf8
Write-Host "Updated: $schemaPath"

#
# prisma migration
#
$migrationName = (Get-Date -Format 'yyyyMMddHHmmss') + '_preserve_chat_messages'
$migrationDir = Join-Path $migrationsRoot $migrationName
New-Item -ItemType Directory -Force -Path $migrationDir | Out-Null

$migrationSql = @'
-- Preserve chat history even if users are deleted.

-- Store a username snapshot for each message.
ALTER TABLE "ChatMessage" ADD COLUMN "username" TEXT DEFAULT '';

-- Backfill username from current User records.
UPDATE "ChatMessage" AS cm
SET "username" = u."name"
FROM "User" AS u
WHERE cm."userId" = u."id" AND (cm."username" IS NULL OR cm."username" = '');

ALTER TABLE "ChatMessage" ALTER COLUMN "username" SET NOT NULL;

-- Allow messages to remain if the user is deleted.
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";
ALTER TABLE "ChatMessage" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
'@

Set-Content -LiteralPath (Join-Path $migrationDir 'migration.sql') -Value $migrationSql -Encoding utf8
Write-Host "Added migration: $migrationName"

#
# server.js
#
$serverText = Get-Content -LiteralPath $serverPath -Raw

# Include `name` in authRequired's dbUser select.
$serverText = $serverText.Replace(
  'select: { id: true, role: true, adminAccessAll: true, adminPageAccess: true },',
  'select: { id: true, name: true, role: true, adminAccessAll: true, adminPageAccess: true },'
)

# Attach `name` onto req.user so chat routes can store a username snapshot without extra queries.
$serverText = [regex]::Replace(
  $serverText,
  '(?m)^(\s*)\.\.\.payload,\s*$',
  '$1...payload,' + [Environment]::NewLine + '$1name: dbUser.name,'
)

# Use stored username and tolerate deleted users.
$serverText = $serverText.Replace(
  'username: msg.user.name,',
  'username: msg.username || msg.user?.name || ''Unknown'','
)

# Store username snapshot when creating a message.
$serverText = [regex]::Replace(
  $serverText,
  '(?m)^(\s*)videoTitle: resolvedVideoTitle,\s*$',
  '$1videoTitle: resolvedVideoTitle,' + [Environment]::NewLine + '$1username: req.user?.name || ''Unknown'','
)

# Admin threads: show latest message title (not string max).
$threadsPattern = '(?s)app\.get\(\x27/api/chat/admin/threads\x27,.*?\n\s*\}\);\s*'
$threadsReplacement = @'
app.get('/api/chat/admin/threads', authRequired, adminRequired, adminPageRequired(ADMIN_PAGE.LIVECHAT), async (req, res) => {
    try {
      const take = parseInt(req.query.take || '200', 10);

      const grouped = await prisma.chatMessage.groupBy({
        by: ['videoId'],
        _count: { _all: true },
        _max: { createdAt: true },
        orderBy: {
          _max: {
            createdAt: 'desc',
          },
        },
        take,
      });

      const videoIds = grouped.map((thread) => thread.videoId);
      const latestTitles = await prisma.chatMessage.findMany({
        where: { videoId: { in: videoIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['videoId'],
        select: { videoId: true, videoTitle: true },
      });

      const titleByVideoId = Object.fromEntries(
        latestTitles.map((row) => [row.videoId, row.videoTitle || row.videoId]),
      );

      const normalized = grouped.map((thread) => ({
        videoId: thread.videoId,
        videoTitle: titleByVideoId[thread.videoId] || thread.videoId,
        messageCount: thread._count._all,
        lastMessageAt: thread._max.createdAt?.toISOString() || null,
      }));

      return res.json({ threads: normalized });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch chat threads' });
    }
  });

'@

$serverText2 = [regex]::Replace($serverText, $threadsPattern, $threadsReplacement)
if ($serverText2 -eq $serverText) {
  throw 'Failed to patch /api/chat/admin/threads handler (pattern not found).'
}
$serverText = $serverText2

Set-Content -LiteralPath $serverPath -Value $serverText -Encoding utf8
Write-Host "Updated: $serverPath"

Write-Host "Done."
