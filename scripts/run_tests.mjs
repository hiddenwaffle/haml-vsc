// Runs every test/*.test.haml and test/*.test.md file. The files use
// vscode-tmgrammar-test's assertion format: `-#` (or `<!--` in Markdown) lines
// with ^ or <- markers under the source line.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, createRegistry } from './registry.mjs';

const require = createRequire(import.meta.url);
const { parseGrammarTestCase, runGrammarTestCase } = require('vscode-tmgrammar-test/dist/unit/index.js');

const testDir = path.join(ROOT, 'test');
const files = fs.readdirSync(testDir).filter((f) => /\.test\.(haml|md)$/.test(f)).sort();
const registry = await createRegistry();

let assertionCount = 0;
let failureCount = 0;
for (const file of files) {
  const testCase = parseGrammarTestCase(fs.readFileSync(path.join(testDir, file), 'utf8'));
  assertionCount += testCase.assertions.reduce((n, a) => n + a.scopeAssertions.length, 0);
  const failures = await runGrammarTestCase(registry, testCase);
  failureCount += failures.length;
  console.log(`${failures.length ? 'FAIL' : 'ok  '} ${file}`);
  for (const f of failures) {
    const src = testCase.source[f.srcLine];
    console.log(`  test/${file}:${f.line + 1} chars ${f.start}-${f.end} ${JSON.stringify(src.slice(f.start, f.end))}`);
    console.log(`    source:     ${src}`);
    if (f.missing.length) console.log(`    missing:    ${f.missing.join(' ')}`);
    if (f.unexpected.length) console.log(`    unexpected: ${f.unexpected.join(' ')}`);
    console.log(`    actual:     ${f.actual.join(' ')}`);
  }
}

console.log(`\n${files.length} files, ${assertionCount} assertions, ${failureCount} failures`);
if (files.length === 0 || assertionCount === 0) {
  console.log('No assertions ran, which means the test harness itself is broken.');
  process.exit(1);
}
process.exit(failureCount ? 1 : 0);
