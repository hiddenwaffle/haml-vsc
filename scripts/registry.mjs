// Builds a vscode-textmate registry that serves this extension's grammars, plus the
// embedded-language grammars (Ruby, JavaScript, CSS, ...) from the tm-grammars dev
// dependency, so tests tokenize HAML the way VS Code does.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { grammars as tmGrammarIndex } from 'tm-grammars';

const require = createRequire(import.meta.url);
const vsctm = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const ownGrammars = new Map(
  manifest.contributes.grammars.map((g) => [g.scopeName, path.join(ROOT, g.path)]),
);
// Scope name -> the scope names of this extension's grammars injected into it (injectTo).
const injections = new Map();
for (const g of manifest.contributes.grammars) {
  for (const target of g.injectTo ?? []) {
    injections.set(target, [...(injections.get(target) ?? []), g.scopeName]);
  }
}
const tmGrammarsDir = path.join(ROOT, 'node_modules', 'tm-grammars', 'grammars');
const vendorGrammars = new Map(
  tmGrammarIndex
    .filter((g) => !ownGrammars.has(g.scopeName))
    .map((g) => [g.scopeName, path.join(tmGrammarsDir, `${g.name}.json`)]),
);

// The grammar a file is tokenized with: Markdown for .md files, HAML otherwise.
export function scopeForFile(file) {
  return /\.(md|markdown)$/i.test(file ?? '') ? 'text.html.markdown' : 'text.haml';
}

// Tokenizes text one line at a time. Returns each line with its non-blank tokens,
// each formatted as the token's text and its scopes below the root scope.
export function tokenizeLines(grammar, text) {
  let ruleStack = null;
  return text.replace(/\n$/, '').split(/\r?\n/).map((line) => {
    const result = grammar.tokenizeLine(line, ruleStack);
    ruleStack = result.ruleStack;
    const tokens = result.tokens
      .map((t) => [line.slice(t.startIndex, t.endIndex), t.scopes.slice(1).join('  ')])
      .filter(([tokenText]) => tokenText.trim())
      .map(([tokenText, scopes]) => `${JSON.stringify(tokenText).padEnd(24)} ${scopes}`);
    return { line, tokens };
  });
}

const readFile = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

// exclude: scope names to treat as missing. readOwnGrammar: reads this extension's
// grammar files, so compare.mjs can load them as committed at a git revision.
export async function createRegistry({ exclude = [], readOwnGrammar = readFile } = {}) {
  const wasm = fs.readFileSync(path.join(ROOT, 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  return new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (exclude.includes(scopeName)) return null;
      const own = ownGrammars.has(scopeName);
      const file = own ? ownGrammars.get(scopeName) : vendorGrammars.get(scopeName);
      const text = file && (own ? readOwnGrammar(file) : readFile(file));
      return text ? vsctm.parseRawGrammar(text, file) : null;
    },
    getInjections: (scopeName) => injections.get(scopeName),
  });
}
