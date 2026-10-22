// Prints the scopes the HAML grammar gives each token, for debugging. Markdown
// files (.md) are tokenized as Markdown, to check HAML code blocks.
// Usage: npm run tokenize -- path/to/file.haml    (or pipe HAML on stdin)
import fs from 'node:fs';
import { createRegistry, scopeForFile, tokenizeLines } from './registry.mjs';

const input = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : fs.readFileSync(0, 'utf8');
const registry = await createRegistry();
const grammar = await registry.loadGrammar(scopeForFile(process.argv[2]));

tokenizeLines(grammar, input).forEach(({ line, tokens }, n) => {
  console.log(`${String(n + 1).padStart(3)}| ${line}`);
  for (const t of tokens) console.log(`     ${t}`);
});
