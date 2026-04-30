import fs from 'node:fs/promises';
import path from 'node:path';

if (process.platform !== 'win32') process.exit(0);

const binDir = path.join(process.cwd(), 'node_modules', '.bin');

let dirEntries;
try {
  dirEntries = await fs.readdir(binDir, { withFileTypes: true });
} catch {
  process.exit(0);
}

const isLikelyPosixShim = async (filePath) => {
  try {
    const file = await fs.open(filePath, 'r');
    try {
      const { buffer } = await file.read({
        buffer: Buffer.alloc(256),
        position: 0,
        length: 256,
      });
      const head = buffer.toString('utf8');
      return head.startsWith('#!') && head.includes('/bin/sh');
    } finally {
      await file.close();
    }
  } catch {
    return false;
  }
};

for (const entry of dirEntries) {
  if (!entry.isFile()) continue;

  const name = entry.name;
  if (path.extname(name)) continue;

  const cmdPath = path.join(binDir, `${name}.cmd`);
  const shimPath = path.join(binDir, name);

  try {
    await fs.access(cmdPath);
  } catch {
    continue;
  }

  if (!(await isLikelyPosixShim(shimPath))) continue;

  const renamedPath = path.join(binDir, `${name}.unix`);
  try {
    await fs.rename(shimPath, renamedPath);
  } catch {
    try {
      await fs.unlink(shimPath);
    } catch {}
  }
}

