// Prints the scopes the HAML grammar gives each token, for debugging.
// Usage: npm run tokenize -- path/to/file.haml    (or pipe HAML on stdin)
import fs from 'node:fs';
import { createRegistry } from './registry.mjs';

const input = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : fs.readFileSync(0, 'utf8');
const registry = await createRegistry();
const grammar = await registry.loadGrammar('text.haml');

let ruleStack = null;
input.replace(/\n$/, '').split(/\r?\n/).forEach((line, n) => {
  const { tokens, ruleStack: next } = grammar.tokenizeLine(line, ruleStack);
  ruleStack = next;
  console.log(`${String(n + 1).padStart(3)}| ${line}`);
  for (const t of tokens) {
    const text = line.slice(t.startIndex, t.endIndex);
    if (!text.trim()) continue;
    console.log(`     ${JSON.stringify(text).padEnd(24)} ${t.scopes.slice(1).join('  ')}`);
  }
});
