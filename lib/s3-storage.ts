import crypto from 'crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Soft copy PDFs live privately in the Supabase Storage S3 bucket. Only the server (with the keys in .env)
 * can read them: the stored URL is the object's S3 address, which needs signed requests, so a buyer who
 * sees it cannot download the book. Readers get the file through /api/store/book-file.
 */

export const BOOK_PDF_FOLDER = 'books/';

type StorageConfig = { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string };

function storageConfig(): StorageConfig | null {
  const endpoint = (process.env.S3_ENDPOINT || '').trim().replace(/\/+$/, '');
  const region = (process.env.S3_REGION || '').trim();
  const bucket = (process.env.S3_BUCKET || '').trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || '').trim();
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

export const isStorageConfigured = () => storageConfig() !== null;

let cachedClient: { key: string; client: S3Client } | null = null;

function client(config: StorageConfig) {
  const key = `${config.endpoint}|${config.region}|${config.accessKeyId}`;
  if (cachedClient?.key === key) return cachedClient.client;
  const created = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    // Supabase's S3 endpoint only understands path-style addresses (endpoint/bucket/key).
    forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  cachedClient = { key, client: created };
  return created;
}

/** The address saved in the database for an object: <endpoint>/<bucket>/<key>. */
const objectUrl = (config: StorageConfig, key: string) => `${config.endpoint}/${config.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

/** The object key when `url` points into our bucket, else null (e.g. an older local or Cloudinary link). */
export function storageKeyFromUrl(url: string): string | null {
  const config = storageConfig();
  if (!config) return null;
  const prefix = `${config.endpoint}/${config.bucket}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length).split('?')[0].split('/').map((part) => decodeURIComponent(part)).join('/');
  return key && !key.includes('..') ? key : null;
}

/** Stores a soft copy PDF privately and returns the URL to save on the book. */
export async function uploadBookPdf(bytes: Buffer): Promise<string> {
  const config = storageConfig();
  if (!config) throw new Error('File storage is not configured. Set S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
  const key = `${BOOK_PDF_FOLDER}${Date.now()}-${crypto.randomBytes(12).toString('hex')}.pdf`;
  await client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: bytes,
    ContentType: 'application/pdf',
    ContentLength: bytes.byteLength,
    CacheControl: 'private, no-store',
  }));
  return objectUrl(config, key);
}

/** Reads a stored object back, or null when it is missing or larger than `maxBytes`. */
export async function readStorageObject(url: string, maxBytes: number): Promise<Buffer | null> {
  const config = storageConfig();
  const key = storageKeyFromUrl(url);
  if (!config || !key) return null;
  const result = await client(config).send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
  if (typeof result.ContentLength === 'number' && result.ContentLength > maxBytes) return null;
  if (!result.Body) return null;
  const bytes = Buffer.from(await result.Body.transformToByteArray());
  return bytes.byteLength > maxBytes ? null : bytes;
}
