// Builds a vscode-textmate registry that serves this extension's grammar, plus the
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

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const ownGrammars = new Map(
  manifest.contributes.grammars.map((g) => [g.scopeName, path.join(ROOT, g.path)]),
);
const tmGrammarsDir = path.join(ROOT, 'node_modules', 'tm-grammars', 'grammars');
const vendorGrammars = new Map(
  tmGrammarIndex
    .filter((g) => !ownGrammars.has(g.scopeName))
    .map((g) => [g.scopeName, path.join(tmGrammarsDir, `${g.name}.json`)]),
);

export async function createRegistry({ exclude = [] } = {}) {
  const wasm = fs.readFileSync(path.join(ROOT, 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  return new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (exclude.includes(scopeName)) return null;
      const file = ownGrammars.get(scopeName) ?? vendorGrammars.get(scopeName);
      if (!file || !fs.existsSync(file)) return null;
      return vsctm.parseRawGrammar(fs.readFileSync(file, 'utf8'), file);
    },
  });
}
