import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const sourceRoots = ['app', 'components', 'lib', 'hooks', 'prisma', 'scripts'];
const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss']);

const publicPathRegexes = [
  /(?:src|href)\s*=\s*["'`]\/([^"'`?#)]+)["'`]/g,
  /url\(\s*["'`]\/([^"'`?#)]+)["'`]\s*\)/g,
];

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.git')) {
        continue;
      }
      walkFiles(fullPath, files);
      continue;
    }
    if (fileExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectPublicPathReferences(content) {
  const refs = [];
  for (const regex of publicPathRegexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      refs.push(`/${match[1]}`);
    }
  }
  return refs;
}

function normalizeAssetPath(assetPath) {
  return assetPath.split('/').filter(Boolean).join(path.sep);
}

function looksLikeStaticAssetPath(ref) {
  const baseName = path.basename(ref);
  return /\.[a-zA-Z0-9]+$/.test(baseName);
}

function main() {
  const sourceFiles = sourceRoots.flatMap((dir) => walkFiles(path.join(rootDir, dir)));
  const missing = new Map();

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const refs = collectPublicPathReferences(content);
    for (const ref of refs) {
      if (!looksLikeStaticAssetPath(ref)) continue;
      const absolutePublicPath = path.join(publicDir, normalizeAssetPath(ref));
      if (!fs.existsSync(absolutePublicPath)) {
        if (!missing.has(ref)) missing.set(ref, []);
        missing.get(ref).push(path.relative(rootDir, filePath));
      }
    }
  }

  if (missing.size === 0) {
    console.log('OK: no missing /public asset references found.');
    return;
  }

  console.error('Found missing /public asset references:\n');
  for (const [asset, files] of missing.entries()) {
    console.error(`- ${asset}`);
    for (const file of files) {
      console.error(`  referenced in: ${file}`);
    }
  }
  process.exitCode = 1;
}

main();
