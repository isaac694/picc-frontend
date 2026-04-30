import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import emailRoutes from "./routes/emailRoutes.js";
import { sendGivingConfirmationEmail } from './services/emailService.js';


dotenv.config();

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function internalServerError(res, error) {
  console.error(error);
  if (IS_PRODUCTION) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(500).json({
    error: 'Internal server error',
    detail: error instanceof Error ? error.message : String(error),
  });
}

function getSslConfig(connectionString) {
  // node-postgres doesn't honor libpq-style `sslmode=` automatically.
  // If the URL requests SSL, use a permissive SSL config compatible with most hosted providers.
  const lower = String(connectionString || '').toLowerCase();
  const wantsSsl =
    lower.includes('sslmode=require') ||
    lower.includes('ssl=true') ||
    lower.includes('sslmode=verify-ca') ||
    lower.includes('sslmode=verify-full');

  return wantsSsl ? { rejectUnauthorized: false } : undefined;
}

function safeDbLabel(connectionString) {
  try {
    const url = new URL(connectionString);
    const dbName = url.pathname ? url.pathname.replace(/^\//, '') : '';
    const port = url.port || '5432';
    return `${url.hostname}:${port}/${dbName}`;
  } catch {
    return 'configured database';
  }
}

async function canConnectToDb(connectionString) {
  if (!connectionString) return false;

  const { Client } = pg;
  const client = new Client({
    connectionString,
    ssl: getSslConfig(connectionString),
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    try {
      await client.end();
    } catch {
      // Ignore cleanup errors.
    }
  }
}

async function resolveDatabaseUrl() {
  // Backwards-compatible:
  // - `DATABASE_URL` remains the primary setting (Prisma default).
  // - Optional `DATABASE_URL_FALLBACK` (or `DATABASE_URL_PRIMARY`) allows a second URL.
  const primary =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_PRIMARY ||
    '';
  const fallback = process.env.DATABASE_URL_FALLBACK || '';

  if (primary && (await canConnectToDb(primary))) {
    console.log(`Database selected: ${safeDbLabel(primary)}`);
    return primary;
  }

  if (fallback && (await canConnectToDb(fallback))) {
    console.log(`Database selected (fallback): ${safeDbLabel(fallback)}`);
    return fallback;
  }

  // If we can't preflight-connect, still return primary if present so Prisma can surface
  // the detailed connection error rather than crashing with "missing config".
  if (primary) {
    console.warn(`Database preflight failed for: ${safeDbLabel(primary)}`);
    if (fallback) {
      console.warn(`Database preflight failed for fallback: ${safeDbLabel(fallback)}`);
    }
    return primary;
  }

  throw new Error('No database configured. Set DATABASE_URL (and optionally DATABASE_URL_FALLBACK).');
}

const selectedDatabaseUrl = await resolveDatabaseUrl();
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: selectedDatabaseUrl }) });
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const YOUTUBE_FEED_BASE = 'https://www.youtube.com/feeds/videos.xml';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const rawCorsOrigins = process.env.CORS_ORIGIN || '';
const allowedCorsOrigins = rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedCorsOrigins.length === 0) return true;

  for (const entry of allowedCorsOrigins) {
    if (entry === '*') return true;
    if (entry === origin) return true;
    if (entry.startsWith('*.')) {
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith(entry.slice(1))) {
          return true;
        }
      } catch {
        // Ignore invalid origins and keep checking.
      }
    }
  }

  return false;
}



app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify(req, _res, buf) {
      // Some webhook providers (including PayChangu) sign the *raw* request body.
      // Keep a copy so signature verification doesn't depend on JSON re-stringification.
      req.rawBody = buf;
    },
  })
);
app.use("/api/email", emailRoutes);
app.use('/uploads', express.static(UPLOADS_DIR));


if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '');
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
});

app.post('/api/uploads', authRequired, adminRequired, upload.single('file'), (req, res) => {
  try {
    if (!req.file?.filename) {
      return res.status(400).json({ error: 'Missing file' });
    }

    return res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    return res.status(500).json({ error: 'Upload failed' });
  }
});

function toDateOnlyLocal(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const [year, month, day] = dateString.split('-').map((part) => parseInt(part, 10));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

function decodeXml(value) {
  if (!value) return '';
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTagValue(source, tag) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : '';
}

function extractAttribute(source, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"[^>]*>`, 'i');
  const match = source.match(regex);
  return match ? decodeXml(match[1]) : '';
}

async function fetchLatestYouTubeVideos(channelId, limit = 4) {
  const url = new URL(YOUTUBE_FEED_BASE);
  url.searchParams.set('channel_id', channelId);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YouTube feed request failed: ${response.status}`);
  }

  const xml = await response.text();
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)).map((match) => match[1]);

  const videos = entries
    .map((entry) => {
      const videoId = extractTagValue(entry, 'yt:videoId');
      const title = extractTagValue(entry, 'title');
      const publishedAt = extractTagValue(entry, 'published');
      const updatedAt = extractTagValue(entry, 'updated');
      const channelTitle = extractTagValue(entry, 'name');
      const description = extractTagValue(entry, 'media:description');
      const thumbnail = extractAttribute(entry, 'media:thumbnail', 'url');
      const link =
        entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*\/?>/i)?.[1] ||
        entry.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i)?.[1] ||
        '';

      return {
        videoId,
        title,
        publishedAt,
        updatedAt,
        channelTitle,
        description,
        thumbnail,
        url: decodeXml(link),
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
      };
    })
    .filter((video) => video.videoId);

  videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const safeLimit = Math.min(Math.max(limit, 1), 12);
  return videos.slice(0, safeLimit);
}

async function fetchYouTubeApiJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchLiveThenRecentVideos(channelId, limit = 4) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('Missing YOUTUBE_API_KEY');
  }

  const safeLimit = Math.min(Math.max(limit, 1), 12);

  const liveUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  liveUrl.searchParams.set('part', 'snippet');
  liveUrl.searchParams.set('channelId', channelId);
  liveUrl.searchParams.set('eventType', 'live');
  liveUrl.searchParams.set('type', 'video');
  liveUrl.searchParams.set('maxResults', '1');
  liveUrl.searchParams.set('key', YOUTUBE_API_KEY);

  const recentUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  recentUrl.searchParams.set('part', 'snippet');
  recentUrl.searchParams.set('channelId', channelId);
  recentUrl.searchParams.set('order', 'date');
  recentUrl.searchParams.set('type', 'video');
  recentUrl.searchParams.set('maxResults', String(safeLimit));
  recentUrl.searchParams.set('key', YOUTUBE_API_KEY);

  const [liveData, recentData] = await Promise.all([
    fetchYouTubeApiJson(liveUrl.toString()),
    fetchYouTubeApiJson(recentUrl.toString()),
  ]);

  const toVideo = (item) => {
    const videoId = item?.id?.videoId;
    if (!videoId) return null;
    const snippet = item.snippet || {};
    return {
      videoId,
      title: snippet.title || '',
      publishedAt: snippet.publishedAt || '',
      updatedAt: snippet.publishedAt || '',
      channelTitle: snippet.channelTitle || '',
      description: snippet.description || '',
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      isLive: snippet.liveBroadcastContent === 'live',
    };
  };

  const liveVideo = Array.isArray(liveData?.items) ? toVideo(liveData.items[0]) : null;
  const recentVideos = Array.isArray(recentData?.items)
    ? recentData.items.map(toVideo).filter(Boolean)
    : [];

  const merged = [];
  if (liveVideo) merged.push(liveVideo);
  recentVideos.forEach((video) => {
    if (!merged.find((existing) => existing.videoId === video.videoId)) {
      merged.push(video);
    }
  });

  return merged.slice(0, safeLimit);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Church Website Backend is running' });
});

app.get('/api/youtube/latest', async (req, res) => {
  try {
    const { channelId } = req.query;
    const limit = parseInt(req.query.limit || '4', 10);

    if (!channelId || typeof channelId !== 'string') {
      return res.status(400).json({ error: 'channelId query param is required' });
    }

    let videos = [];
    if (YOUTUBE_API_KEY) {
      videos = await fetchLiveThenRecentVideos(channelId, limit);
    } else {
      videos = await fetchLatestYouTubeVideos(channelId, limit);
    }
    return res.json({ channelId, videos });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const name = req.body.name || req.body.username;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Auth register failed:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authRequired, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/messages', authRequired, async (req, res) => {
    try {
      const { videoId } = req.query;
      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'videoId query param is required' });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { videoId },
        take: 50,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      // Transform the data to match frontend expectations
      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        videoId: msg.videoId,
        videoTitle: msg.videoTitle,
        userId: msg.userId,
        username: msg.user.name,
        createdAt: msg.createdAt.toISOString(),
      }));

      return res.json(transformedMessages);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/messages', authRequired, async (req, res) => {
    try {
      const { content, videoId, videoTitle } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      if (!videoId || typeof videoId !== 'string' || videoId.trim().length === 0) {
        return res.status(400).json({ error: 'videoId is required' });
      }

      const resolvedVideoTitle =
        typeof videoTitle === 'string' && videoTitle.trim().length > 0
          ? videoTitle.trim()
          : videoId.trim();

      const message = await prisma.chatMessage.create({
        data: {
          content: content.trim(),
          videoId: videoId.trim(),
          videoTitle: resolvedVideoTitle,
          userId: req.user.sub,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      return res.status(201).json({ message });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/chat/admin/threads', authRequired, adminRequired, async (req, res) => {
    try {
      const take = parseInt(req.query.take || '200', 10);

      const threads = await prisma.chatMessage.groupBy({
        by: ['videoId'],
        _count: { _all: true },
        _max: { createdAt: true, videoTitle: true },
        orderBy: {
          _max: {
            createdAt: 'desc',
          },
        },
        take,
      });

      const normalized = threads.map((thread) => ({
        videoId: thread.videoId,
        videoTitle: thread._max.videoTitle || thread.videoId,
        messageCount: thread._count._all,
        lastMessageAt: thread._max.createdAt?.toISOString() || null,
      }));

      return res.json({ threads: normalized });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch chat threads' });
    }
  });

  app.get('/api/chat/admin/messages', authRequired, adminRequired, async (req, res) => {
    try {
      const { videoId } = req.query;
      const take = parseInt(req.query.take || '200', 10);

      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'videoId query param is required' });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { videoId },
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        videoId: msg.videoId,
        videoTitle: msg.videoTitle,
        userId: msg.userId,
        username: msg.user.name,
        createdAt: msg.createdAt.toISOString(),
      }));

      return res.json({ messages: transformedMessages });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch admin messages' });
    }
  });


  app.delete('/api/chat/admin/messages/:id', authRequired, adminRequired, async (req, res) => {
    try {
      const messageId = req.params.id;

      const existing = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Message not found' });
      }

      await prisma.chatMessage.delete({ where: { id: messageId } });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete message' });
    }
  });

app.get('/api/devotions/latest', async (req, res) => {
  try {
    const devotion = await prisma.devotion.findFirst({
      where: { publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
    });

    if (!devotion) {
      return res.status(404).json({ error: 'No devotion found' });
    }

    return res.json({ ...devotion, devotion });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/devotions', async (req, res) => {
  try {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : null;

    if (dateParam) {
      const targetDate = toDateOnlyLocal(dateParam);
      if (!targetDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const devotion = await prisma.devotion.findFirst({
        where: { publishAt: { gte: targetDate, lt: nextDate } },
      });

      if (!devotion) {
        return res.status(404).json({ error: 'No devotion found' });
      }

      return res.json(devotion);
    }

    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '200', 10);

    const devotions = await prisma.devotion.findMany({
      where: { publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.devotion.count({
      where: { publishAt: { lte: new Date() } },
    });

    return res.json({ devotions, total, skip, take });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/devotions/all', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '200', 10);

    const devotions = await prisma.devotion.findMany({
      where: { publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.devotion.count({
      where: { publishAt: { lte: new Date() } },
    });

    return res.json({ devotions, total, skip, take });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/devotions/admin', authRequired, adminRequired, async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '200', 10);

    const devotions = await prisma.devotion.findMany({
      orderBy: { publishAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.devotion.count();

    return res.json({ devotions, total, skip, take });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/confessions/latest', async (req, res) => {
  try {
    if (!prisma.confession) {
      throw new Error('Prisma client missing Confession model. Run `npx prisma generate` and restart the server.');
    }

    const confession = await prisma.confession.findFirst({
      where: { publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
    });

    if (!confession) {
      return res.status(404).json({ error: 'No confession found' });
    }

    return res.json({ ...confession, confession });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.get('/api/confessions', async (req, res) => {
  try {
    if (!prisma.confession) {
      throw new Error('Prisma client missing Confession model. Run `npx prisma generate` and restart the server.');
    }

    const dateParam = typeof req.query.date === 'string' ? req.query.date : null;

    if (dateParam) {
      const targetDate = toDateOnlyLocal(dateParam);
      if (!targetDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const confession = await prisma.confession.findFirst({
        where: { publishAt: { gte: targetDate, lt: nextDate } },
      });

      if (!confession) {
        return res.status(404).json({ error: 'No confession found' });
      }

      return res.json(confession);
    }

    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '200', 10);

    const confessions = await prisma.confession.findMany({
      where: { publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.confession.count({
      where: { publishAt: { lte: new Date() } },
    });

    return res.json({ confessions, total, skip, take });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.get('/api/confessions/admin', authRequired, adminRequired, async (req, res) => {
  try {
    if (!prisma.confession) {
      throw new Error('Prisma client missing Confession model. Run `npx prisma generate` and restart the server.');
    }

    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '200', 10);

    const confessions = await prisma.confession.findMany({
      orderBy: { publishAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.confession.count();

    return res.json({ confessions, total, skip, take });
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.post('/api/confessions', authRequired, adminRequired, async (req, res) => {
  try {
    if (!prisma.confession) {
      throw new Error('Prisma client missing Confession model. Run `npx prisma generate` and restart the server.');
    }

    const { date, title, imageUrl, publishAt } = req.body;

    if ((!date && !publishAt) || !imageUrl) {
      return res.status(400).json({ error: 'date or publishAt and imageUrl are required' });
    }

    let publishDate = null;

    if (publishAt) {
      const parsed = new Date(publishAt);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid publishAt format' });
      }
      publishDate = parsed;
    } else {
      const targetDate = toDateOnlyLocal(date);
      if (!targetDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      // Schedule by default at 1:00 AM local time
      publishDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        1,
        0,
        0,
        0
      );
    }

    const confession = await prisma.confession.upsert({
      where: { publishAt: publishDate },
      update: {
        title: title || null,
        imageUrl,
        authorId: req.user.sub,
      },
      create: {
        publishAt: publishDate,
        title: title || null,
        imageUrl,
        authorId: req.user.sub,
      },
    });

    return res.status(201).json(confession);
  } catch (error) {
    return internalServerError(res, error);
  }
});

app.get('/api/site-content/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const content = await prisma.siteContent.findUnique({ where: { key } });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    return res.json(content);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/site-content/:key', authRequired, adminRequired, async (req, res) => {
  try {
    const { key } = req.params;
    const { title, subtitle, body, imageUrl } = req.body;

    const content = await prisma.siteContent.upsert({
      where: { key },
      update: {
        title: title ?? null,
        subtitle: subtitle ?? null,
        body: body ?? null,
        imageUrl: imageUrl ?? null,
      },
      create: {
        key,
        title: title ?? null,
        subtitle: subtitle ?? null,
        body: body ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    return res.status(200).json(content);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quotes', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '100', 10);

    const quotes = await prisma.quoteOfMonth.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.quoteOfMonth.count();

    return res.json({ quotes, total, skip, take });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quote-of-month', async (req, res) => {
  try {
    const quote = await prisma.quoteOfMonth.findUnique({
      where: { key: 'current' },
    });
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    return res.json(quote);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/quote-of-month', authRequired, adminRequired, async (req, res) => {
  try {
    const { quote, author, imageUrl } = req.body;
    if (!quote) {
      return res.status(400).json({ error: 'Quote is required' });
    }

    // Archive the existing current quote if it exists
    const existing = await prisma.quoteOfMonth.findUnique({
      where: { key: 'current' },
    });

    if (existing) {
      await prisma.quoteOfMonth.update({
        where: { id: existing.id },
        data: { key: `archived_${existing.id}_${Date.now()}` },
      });
    }

    // Create the new current quote
    const saved = await prisma.quoteOfMonth.create({
      data: {
        key: 'current',
        quote,
        author: author ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    return res.status(200).json(saved);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/devotions', authRequired, adminRequired, async (req, res) => {
  try {
    const { date, title, content, publishAt } = req.body;

    if ((!date && !publishAt) || !content) {
      return res.status(400).json({ error: 'date or publishAt and content are required' });
    }

    let publishDate = null;

    if (publishAt) {
      const parsed = new Date(publishAt);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid publishAt format' });
      }
      publishDate = parsed;
    } else {
      const targetDate = toDateOnlyLocal(date);
      if (!targetDate) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      // Schedule by default at 1:00 AM local time
      publishDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        1,
        0,
        0,
        0
      );
    }

    const devotion = await prisma.devotion.upsert({
      where: { publishAt: publishDate },
      update: {
        title: title || null,
        content,
        authorId: req.user.sub,
      },
      create: {
        publishAt: publishDate,
        title: title || null,
        content,
        authorId: req.user.sub,
      },
    });

    return res.status(201).json(devotion);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { day: 'asc' },
    });

    const normalized = services.map((service) => {
      const time = service.time || '';
      const [startTime, endTime] = time.includes('-')
        ? time.split('-').map((part) => part.trim())
        : [time || null, null];

      return {
        id: service.id,
        title: service.name,
        description: service.description,
        dayOfWeek: service.day,
        startTime,
        endTime,
        location: service.location,
        isActive: true,
      };
    });

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/services', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, description, dayOfWeek, startTime, endTime, time, location } = req.body;

    const resolvedStart = startTime || (time ? time.split('-')[0]?.trim() : null);
    const resolvedEnd = endTime || (time && time.includes('-') ? time.split('-')[1]?.trim() : null);

    if (!title || !dayOfWeek || !resolvedStart) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timeValue = resolvedEnd ? `${resolvedStart} - ${resolvedEnd}` : resolvedStart;

    const service = await prisma.service.create({
      data: {
        name: title,
        day: dayOfWeek,
        time: timeValue,
        location: location || '',
        description: description || null,
      },
    });

    res.status(201).json({ message: 'Service created successfully', id: service.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/services/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dayOfWeek, startTime, endTime, time, location } = req.body;

    const resolvedStart = startTime || (time ? time.split('-')[0]?.trim() : null);
    const resolvedEnd = endTime || (time && time.includes('-') ? time.split('-')[1]?.trim() : null);

    const updates = {
      name: title || undefined,
      day: dayOfWeek || undefined,
      time: resolvedStart ? (resolvedEnd ? `${resolvedStart} - ${resolvedEnd}` : resolvedStart) : undefined,
      location: location ?? undefined,
      description: description ?? undefined,
    };

    const service = await prisma.service.update({
      where: { id },
      data: updates,
    });

    res.status(200).json({ message: 'Service updated successfully', id: service.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/services/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sermons', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '10', 10);

    const sermons = await prisma.sermon.findMany({
      include: { media: true },
      orderBy: { date: 'desc' },
      skip,
      take,
    });

    const total = await prisma.sermon.count();

    const normalized = sermons.map((sermon) => ({
      ...sermon,
      pastor: sermon.speaker,
      duration: sermon.duration ?? null,
      isPublished: true,
    }));

    res.json({ sermons: normalized, total, skip, take });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sermons', async (req, res) => {
  try {
    const { title, description, pastor, date, duration } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sermon = await prisma.sermon.create({
      data: {
        title,
        speaker: pastor || '',
        date: new Date(date),
        description: description || null,
        videoUrl: null,
        audioUrl: null,
      },
    });

    res.status(201).json({ message: 'Sermon created successfully', id: sermon.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '10', 10);

    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      skip,
      take,
    });

    const total = await prisma.event.count();

    const normalized = events.map((event) => ({
      ...event,
      startTime: null,
      endTime: null,
      isPublished: true,
    }));

    res.json({ events: normalized, total, skip, take });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', authRequired, adminRequired, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, imageUrl } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        date: new Date(date),
        location: location || '',
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({ message: 'Event created successfully', id: event.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, startTime, endTime, location, imageUrl } = req.body;

    const updates = {
      title: title || undefined,
      description: description ?? undefined,
      date: date ? new Date(date) : undefined,
      location: location ?? undefined,
      imageUrl: imageUrl ?? undefined,
    };

    const event = await prisma.event.update({
      where: { id },
      data: updates,
    });

    res.status(200).json({ message: 'Event updated successfully', id: event.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/prayer-requests', async (req, res) => {
  try {
    const prayers = await prisma.prayerRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const normalized = prayers.map((prayer) => ({
      id: prayer.id,
      name: prayer.name,
      request: prayer.message,
      createdAt: prayer.createdAt,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/prayer-requests', async (req, res) => {
  try {
    const { name, email, phone, request, isPrivate } = req.body;

    if (!name || !email || !request) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prayer = await prisma.prayerRequest.create({
      data: { name, email, phone: phone || null, message: request },
    });

    res.status(201).json({ message: 'Prayer request submitted successfully', id: prayer.id });
  } catch (error) {
    console.error('Failed to create prayer request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    res.status(200).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/donations', async (req, res) => {
  try {
    const totals = await prisma.donation.aggregate({
      _sum: { amount: true },
      _count: true,
    });

    res.status(200).json({
      total: totals._sum.amount || 0,
      count: totals._count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/donations', async (req, res) => {
  try {
    const { amount, donorName, email, method } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const donation = await prisma.donation.create({
      data: {
        amount,
        name: donorName || 'Anonymous',
        email: email || 'unknown@picc.local',
        message: method || null,
      },
    });

    res.status(201).json({ message: 'Donation recorded successfully', id: donation.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/testimonies', async (req, res) => {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
    });

    const normalized = testimonies.map((testimony) => ({
      ...testimony,
      name: testimony.authorName,
      isPublished: testimony.approved,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/testimonies', async (req, res) => {
  try {
    const { name, title, content, imageUrl, isPublished, email } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const testimony = await prisma.testimony.create({
      data: {
        title: title || null,
        content,
        authorName: name,
        authorEmail: email || 'unknown@picc.local',
        imageUrl: imageUrl || null,
        approved: isPublished !== false,
      },
    });

    res.status(201).json({ message: 'Testimony submitted for approval', id: testimony.id });
    } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    }
    });

    // --- END OF ROUTES ---


app.post('/api/giving', async (req, res) => {
  try {
    const {
      bookletNumber,
      givingDate,
      givingType,
      specialRecipient,
      amount,
      currency,
      fullName,
      email,
      phone,
      phoneCountry,
      paymentMethod,
      reason,
    } = req.body;

    if (!amount || !fullName || !phone) {
      return res.status(400).json({ error: 'Amount, full name, and phone are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const giving = await prisma.giving.create({
      data: {
        bookletNumber: bookletNumber || null,
        givingDate: givingDate ? new Date(givingDate) : null,
        givingType: givingType || null,
        specialRecipient: specialRecipient || null,
        amount,
        currency: currency || 'MWK',
        fullName,
        email: email || null,
        phone,
        phoneCountry: phoneCountry || '+265',
        paymentMethod: paymentMethod || 'airtel',
        reason: reason || null,
        status: 'pending',
      },
    });

    res.status(201).json({ message: 'Giving record created successfully', id: giving.id });
  } catch (error) {
    console.error('Failed to create giving record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/giving', authRequired, adminRequired, async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const take = parseInt(req.query.take || '50', 10);

    const givings = await prisma.giving.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.giving.count();

    res.json({ givings, total, skip, take });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/paychangu/initialize', async (req, res) => {
  try {
    const { amount, firstName, lastName, phone, paymentMethod, operatorRefId, givingId } = req.body;
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({ error: 'PAYCHANGU_SECRET_KEY is not configured.' });
    }

    if (!amount || !firstName || !lastName || !phone || !givingId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const mappedRefId = paymentMethod === 'airtel'
      ? process.env.PAYCHANGU_AIRTEL_REF_ID
      : paymentMethod === 'mpamba'
        ? process.env.PAYCHANGU_MPAMBA_REF_ID
        : operatorRefId;

    if (!mappedRefId) {
      return res.status(400).json({ error: 'Missing mobile money operator reference ID.' });
    }

    const chargeId = `PICC-${givingId}-${crypto.randomUUID()}`;

    const response = await fetch('https://api.paychangu.com/mobile-money/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        mobile_money_operator_ref_id: mappedRefId,
        mobile: phone,
        amount,
        charge_id: chargeId,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'PayChangu request failed.', data });
    }

    return res.status(200).json({ data, chargeId });
  } catch (error) {
    console.error('PayChangu initialize failed:', error);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
});

app.post('/api/paychangu/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    const signatureHeader =
      req.get('signature') ||
      req.get('x-signature') ||
      req.get('x-paychangu-signature') ||
      req.get('paychangu-signature') ||
      req.headers?.signature;

    const payloadRaw = Buffer.isBuffer(req.rawBody)
      ? req.rawBody.toString('utf8')
      : JSON.stringify(req.body);

    if (webhookSecret) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadRaw)
        .digest('hex');
      const expectedWithPrefix = `sha256=${expected}`;

      const signatureValue = typeof signatureHeader === 'string' ? signatureHeader : '';
      if (signatureValue !== expected && signatureValue !== expectedWithPrefix) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const eventType = req.body?.event_type || req.body?.eventType;
    const status = String(req.body?.status || '').toLowerCase();
    const chargeId = req.body?.charge_id || req.body?.chargeId;

    if (!chargeId) {
      return res.status(200).json({ message: 'Ignoring webhook without charge_id.' });
    }

    const chargeIdParts = String(chargeId).split('-');
    const givingId = chargeIdParts.length >= 3 ? chargeIdParts[1] : null;
    if (!givingId) {
      return res.status(200).json({ message: 'Ignoring webhook with unrecognized charge_id format.' });
    }

    const verifiedStatus = await fetch(
      `https://api.paychangu.com/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        },
      }
    );

    if (!verifiedStatus.ok) {
      return res.status(200).json({ message: 'Received webhook but verification call failed.' });
    }

    const verificationPayload = await verifiedStatus.json();
    const verificationData = verificationPayload?.data || verificationPayload;
    const verificationStatus = String(
      verificationData?.status || verificationData?.payment_status || ''
    ).toLowerCase();

    const successful = status === 'success' || verificationStatus === 'success';
    if (!successful) {
      await prisma.giving.update({
        where: { id: givingId },
        data: { status: verificationStatus || status || 'pending' },
      });
      return res.status(200).json({ message: 'Payment is not successful yet.' });
    }

    const giving = await prisma.giving.findUnique({ where: { id: givingId } });
    if (!giving) {
      return res.status(200).json({ message: 'Giving record not found; nothing to update.' });
    }

    if (giving.status !== 'completed') {
      await prisma.giving.update({
        where: { id: givingId },
        data: { status: 'completed' },
      });

      try {
        await sendGivingConfirmationEmail(giving);
      } catch (emailError) {
        console.error('Failed sending giving confirmation email:', emailError);
      }
    }

    return res.status(200).json({
      message: 'Webhook processed.',
      eventType,
      status: verificationStatus || status || 'unknown',
      chargeId,
      givingId,
    });
  } catch (error) {
    console.error('PayChangu webhook handling failed:', error);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
