// Shows what a grammar change does: tokenizes each file with this extension's
// grammars as committed at a git revision (HEAD by default) and as they are now,
// and prints the tokens that differ, line by line.
// Usage: npm run compare -- [--rev <revision>] file...
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, createRegistry, scopeForFile, tokenizeLines } from './registry.mjs';

const args = process.argv.slice(2);
const revAt = args.indexOf('--rev');
const rev = revAt >= 0 ? args.splice(revAt, 2)[1] : 'HEAD';
if (!rev || !args.length) {
  console.error('Usage: npm run compare -- [--rev <revision>] file...');
  process.exit(2);
}

const git = (...gitArgs) =>
  execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
try {
  git('rev-parse', '--verify', `${rev}^{commit}`);
} catch {
  console.error(`Not a git revision: ${rev}`);
  process.exit(2);
}

// A grammar file that didn't exist at the revision counts as missing.
function atRevision(file) {
  try {
    return git('show', `${rev}:${path.relative(ROOT, file).split(path.sep).join('/')}`);
  } catch {
    return null;
  }
}

const before = await createRegistry({ readOwnGrammar: atRevision });
const after = await createRegistry();

// The items of a that b lacks, counting repeats.
function missingFrom(a, b) {
  const counts = new Map();
  for (const x of b) counts.set(x, (counts.get(x) ?? 0) + 1);
  return a.filter((x) => {
    const n = counts.get(x);
    if (n) counts.set(x, n - 1);
    return !n;
  });
}

for (const file of args) {
  const text = fs.readFileSync(file, 'utf8');
  const scope = scopeForFile(file);
  const oldGrammar = await before.loadGrammar(scope);
  if (!oldGrammar) {
    console.error(`${file}: no ${scope} grammar at ${rev}`);
    process.exit(1);
  }
  const old = tokenizeLines(oldGrammar, text);
  const now = tokenizeLines(await after.loadGrammar(scope), text);
  let changed = 0;
  now.forEach(({ line, tokens }, i) => {
    if (JSON.stringify(tokens) === JSON.stringify(old[i].tokens)) return;
    changed++;
    console.log(`${file}:${i + 1}| ${line}`);
    const removed = missingFrom(old[i].tokens, tokens);
    const added = missingFrom(tokens, old[i].tokens);
    for (const t of removed) console.log(`   - ${t}`);
    for (const t of added) console.log(`   + ${t}`);
    if (!removed.length && !added.length) console.log('   (same tokens in a different order)');
  });
  console.log(`${file}: ${changed ? `${changed} of ${now.length}` : 'no'} lines differ from ${rev}\n`);
}
