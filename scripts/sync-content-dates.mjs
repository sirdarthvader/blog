import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const mode = process.argv.includes('--check') ? 'check' : 'write';
const contentDir = 'src/content/blog';

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function listContentFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return listContentFiles(path);
    }

    return /\.(md|mdx)$/.test(entry) ? [path] : [];
  });
}

function gitDates(path) {
  const firstDates = git(['log', '--follow', '--format=%ad', '--date=short', '--', path])
    .split('\n')
    .filter(Boolean);
  const lastDate = git(['log', '-1', '--format=%ad', '--date=short', '--', path]);

  return {
    first: firstDates.at(-1) || null,
    last: lastDate || null,
  };
}

function hasContentChanges(path) {
  const status = git(['status', '--porcelain', '--', path]);

  if (!status) {
    return false;
  }

  if (status.startsWith('??')) {
    return true;
  }

  const diff = [
    git(['diff', '--', path]),
    git(['diff', '--cached', '--', path]),
  ].filter(Boolean).join('\n');

  if (!diff) {
    return true;
  }

  return diff
    .split('\n')
    .filter((line) => /^[+-](?![+-])/.test(line))
    .some((line) => !/^[+-](publishedAt|updatedAt): \d{4}-\d{2}-\d{2}\s*$/.test(line));
}

function parseFrontmatter(text, path) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    throw new Error(`${path} does not start with frontmatter`);
  }

  return {
    frontmatter: match[1],
    body: text.slice(match[0].length),
  };
}

function getField(lines, key) {
  const line = lines.find((item) => item.startsWith(`${key}:`));
  return line?.slice(key.length + 1).trim() || null;
}

function setField(lines, key, value, afterKeys = []) {
  const existingIndex = lines.findIndex((line) => line.startsWith(`${key}:`));
  const nextLine = `${key}: ${value}`;

  if (existingIndex >= 0) {
    lines[existingIndex] = nextLine;
    return;
  }

  const afterIndex = afterKeys
    .map((afterKey) => lines.findIndex((line) => line.startsWith(`${afterKey}:`)))
    .filter((index) => index >= 0)
    .at(-1);

  lines.splice(afterIndex == null ? lines.length : afterIndex + 1, 0, nextLine);
}

function removeField(lines, key) {
  const existingIndex = lines.findIndex((line) => line.startsWith(`${key}:`));

  if (existingIndex >= 0) {
    lines.splice(existingIndex, 1);
  }
}

const today = localDate();
const changed = [];

for (const path of listContentFiles(contentDir)) {
  const original = readFileSync(path, 'utf8');
  const { frontmatter, body } = parseFrontmatter(original, path);
  const lines = frontmatter.split(/\r?\n/);
  const dates = gitDates(path);
  const isDraft = getField(lines, 'draft') === 'true';

  const publishedAt = getField(lines, 'publishedAt') || dates.first || today;
  const modifiedAt = hasContentChanges(path) ? today : dates.last;

  setField(lines, 'publishedAt', publishedAt, ['description']);

  if (!isDraft && modifiedAt && modifiedAt > publishedAt) {
    setField(lines, 'updatedAt', modifiedAt, ['publishedAt']);
  } else {
    removeField(lines, 'updatedAt');
  }

  const next = `---\n${lines.join('\n')}\n---\n\n${body.replace(/^\r?\n/, '')}`;

  if (next !== original) {
    changed.push(relative(process.cwd(), path));

    if (mode === 'write') {
      writeFileSync(path, next);
    }
  }
}

if (changed.length > 0 && mode === 'check') {
  console.error('Article dates are out of sync. Run `pnpm sync:content-dates`.');
  for (const path of changed) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

if (changed.length > 0) {
  console.log(`Synced article dates for ${changed.length} file${changed.length === 1 ? '' : 's'}.`);
}
