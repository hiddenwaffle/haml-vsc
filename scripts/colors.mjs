// Prints the color a theme gives each token, applying the theme the way VS Code
// does, with the token's language and token type. Languages come from this
// extension's package.json only. Markdown files (.md) are tokenized as Markdown.
// Usage: npm run colors -- <file> <theme.json>
import fs from 'node:fs';
import path from 'node:path';
import { createRegistry, manifest, scopeForFile } from './registry.mjs';

const [file, themeFile] = process.argv.slice(2);
if (!file || !themeFile) {
  console.error('Usage: npm run colors -- <file> <theme.json>');
  process.exit(2);
}

// Theme files are JSON with comments and trailing commas.
function parseJsonc(src) {
  let out = '', inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) { out += c; if (c === '\\') { out += src[++i]; } else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (src.startsWith('//', i)) { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j - 1; continue; }
    if (src.startsWith('/*', i)) { i = src.indexOf('*/', i) + 1; continue; }
    out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

// Reads a theme and the theme it includes, whose rules come first.
function loadTheme(themePath) {
  const theme = parseJsonc(fs.readFileSync(themePath, 'utf8'));
  const base = theme.include
    ? loadTheme(path.resolve(path.dirname(themePath), theme.include))
    : { colors: {}, tokenColors: [] };
  if (theme.tokenColors !== undefined && !Array.isArray(theme.tokenColors)) {
    throw new Error(`${themePath}: tokenColors must be a list of rules; .tmTheme files aren't supported`);
  }
  return {
    name: theme.name ?? base.name,
    colors: { ...base.colors, ...theme.colors },
    tokenColors: [...base.tokenColors, ...(theme.tokenColors ?? [])],
  };
}

const theme = loadTheme(themeFile);
const editorForeground = theme.colors['editor.foreground'];
if (!editorForeground) console.log("Note: the theme sets no editor.foreground, so tokens it doesn't color show as #000000 here.");
const registry = await createRegistry();
// VS Code adds the editor's foreground and background as the first rule.
registry.setTheme({
  name: theme.name,
  settings: [
    { settings: { foreground: editorForeground, background: theme.colors['editor.background'] } },
    ...theme.tokenColors,
  ],
});
const colorMap = registry.getColorMap();

const scope = scopeForFile(file);
const contributions = manifest.contributes.grammars.filter((g) => g.scopeName === scope || g.injectTo?.includes(scope));
const embedded = Object.assign({}, ...contributions.map((g) => g.embeddedLanguages));
const langNames = ['', scope === 'text.haml' ? 'haml' : 'markdown', ...new Set(Object.values(embedded))];
const embeddedLanguages = Object.fromEntries(
  Object.entries(embedded).map(([embeddedScope, lang]) => [embeddedScope, langNames.indexOf(lang)]),
);
const tokenTypeIds = { other: 0, comment: 1, string: 2, regex: 3 };
const ownTokenTypes = contributions.find((g) => g.scopeName === scope)?.tokenTypes ?? {};
const tokenTypes = Object.fromEntries(
  Object.entries(ownTokenTypes).map(([selector, t]) => [selector, tokenTypeIds[t]]),
);
const grammar = await registry.loadGrammarWithConfiguration(scope, 1, { embeddedLanguages, tokenTypes });
const typeNames = ['other', 'comment', 'string', 'regex'];
const styleNames = (s) => [s & 1 && 'italic', s & 2 && 'bold', s & 4 && 'underline', s & 8 && 'strike'].filter(Boolean).join('+');

// Each token is two numbers: its start offset and its metadata, which packs the
// language id, token type, font style and foreground color index into bit fields.
let ruleStack = null;
fs.readFileSync(file, 'utf8').replace(/\n$/, '').split(/\r?\n/).forEach((line, n) => {
  const r = grammar.tokenizeLine2(line, ruleStack);
  ruleStack = r.ruleStack;
  const col1Lang = line.length ? langNames[r.tokens[1] & 0xff] : '-';
  console.log(`${String(n + 1).padStart(3)}| [col1: ${col1Lang}] ${line}`);
  for (let i = 0; i < r.tokens.length; i += 2) {
    const start = r.tokens[i], meta = r.tokens[i + 1];
    const end = i + 2 < r.tokens.length ? r.tokens[i + 2] : line.length;
    const text = line.slice(start, end);
    if (!text.trim()) continue;
    const lang = langNames[meta & 0xff];
    const type = typeNames[(meta >>> 8) & 0x3];
    const style = styleNames((meta >>> 11) & 0xf);
    const fg = colorMap[(meta >>> 15) & 0x1ff];
    console.log(`     ${JSON.stringify(text).padEnd(26)} ${fg}  ${lang.padEnd(12)} ${type}${style ? '  ' + style : ''}`);
  }
});
