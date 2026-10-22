# Developing HAML Syntax

This guide is for anyone changing the extension, whether a person or an agent. Installing and updating are covered in the [README](README.md).

## Essentials

- The extension is declarative: a TextMate grammar, a language configuration and a manifest. No code runs in VS Code and nothing needs building.
- Run `npm test` after every change, and add a test for every fix. It uses the same tokenizer library as VS Code.
- Leave `name`, `publisher` and `version` in `package.json` as they are. [Install and update mechanics](#install-and-update-mechanics) explains why.
- Scratch files go in `.scratch/`, which git ignores.

## Files

| Path | Purpose |
| --- | --- |
| [package.json](package.json) | Manifest: registers the `haml` language and the grammar, maps embedded scopes to languages, and holds the dev scripts |
| [syntaxes/haml.tmLanguage.json](syntaxes/haml.tmLanguage.json) | The grammar, with scope name `text.haml` |
| [language_configuration.json](language_configuration.json) | Comment toggling, brackets, folding, word selection and indenting on Enter |
| [samples/kitchen_sink.haml](samples/kitchen_sink.haml) | Every construct in one file, for checking by eye |
| [test](test) | Assertion files that `npm test` runs |
| [scripts/run_tests.mjs](scripts/run_tests.mjs) | The test runner |
| [scripts/tokenize.mjs](scripts/tokenize.mjs) | Prints the scopes of every token in a file |
| [scripts/registry.mjs](scripts/registry.mjs) | Loads this grammar and the embedded-language grammars for both scripts |

The extension is named `haml-vsc` because extension names can't contain underscores. File names use underscores.

## Trying a change in VS Code

VS Code loads only the clone in its extensions folder. Edit that clone directly, or work in another checkout, push, and `git pull` in the installed clone. Then reload the window (twice if `package.json` changed) and open [samples/kitchen_sink.haml](samples/kitchen_sink.haml).

**Developer: Inspect Editor Tokens and Scopes** shows the scopes, language and token type under the cursor. It is the quickest way to compare what VS Code does with what the tests expect.

## Testing

```sh
npm install
npm test
npm run tokenize -- samples/kitchen_sink.haml
```

`npm test` runs every `test/*.test.haml` file. For each failure it prints the source line and the missing, unexpected and actual scopes. It fails if any assertion fails, and also if no assertions ran, so a broken harness can't pass. `npm run tokenize` reads HAML from standard input when given no file.

Embedded languages are tokenized with grammars from the [tm-grammars](https://github.com/shikijs/textmate-grammars-themes) package. These may not match the grammar versions bundled with VS Code or your installed extensions, so check embedded-language details in VS Code as well.

### Test file format

Test files use the [vscode-tmgrammar-test](https://github.com/PanAeon/vscode-tmgrammar-test) format, with `-#` as the comment marker:

```haml
-# SYNTAX TEST "text.haml" "an example"
%p.note= greeting
-#<- meta.tag.haml punctuation.definition.tag.haml
-# ^^^^ entity.other.attribute-name.class.haml
-#       ^^^^^^^^ meta.embedded.line.ruby - meta.text.haml
/[if IE]
-#<~------- comment.line.conditional.haml
```

- The first line names the grammar's scope and a title for the file.
- Each assertion line starts with `-#` in column 0 and checks the nearest source line above it. Assertion lines are removed before tokenizing.
- `^` marks columns counted from the start of the line, including the `-#`. For columns 0 and 1, which `-#` covers, use `<-` instead: each `-` marks one column starting at column 0, and each `~` before them skips one column.
- The listed scopes must appear in the token's scope stack in that order, with other scopes allowed between them. Scopes after ` - ` must not appear.

## How the grammar works

TextMate grammars match one line at a time, while HAML depends on indentation. Most design choices follow from one aim: an unclosed bracket or string on one line must not color the rest of the file.

### Line types

Each root rule matches from the start of a line, and the first matching rule in the root `patterns` list wins. Order matters where one marker starts another: `conditional_comment` comes before `html_comment` (both start with `/`), and `interpolated_text_line` comes before `script_line` (`==` starts with `=`).

| Rule | Lines |
| --- | --- |
| `silent_comment` | `-#` and the block indented under it |
| `conditional_comment` | `/[if IE]` and `/![if !IE]`, while the block under them stays HAML |
| `html_comment` | `/` and the block indented under it |
| `doctype` | `!!!` |
| `filters` | `:javascript`, `:css` and every other filter |
| `escaped_line` | `\` followed by literal text |
| `interpolated_text_line` | `==`, `&==` and `!==` |
| `script_line_multiline` | Ruby lines that continue with a trailing pipe |
| `script_line` | Ruby after `-`, `=`, `~`, `!=`, `&=`, `!~` and `&~` |
| `escaped_text_line` | `&` or `!` followed by text |
| `tag` | `%p`, `.class` and `#id`, with attributes, `<` `>`, `/` and inline content as sub-rules |
| `raw_html_line` | Lines that start with `<` |
| `plain_text_line` | Everything else, scoped `meta.text.haml` |

### Indented blocks

Comments and filters are `begin`/`while` rules. The `begin` captures the line's indentation, and the `while` continues the block for every line that is indented deeper or blank. When the `while` fails, TextMate closes every rule opened inside the block, so an embedded grammar can't leak past its filter.

A filter's `while` consumes the filter's indentation plus one level (one or two spaces, or a tab), so the embedded grammar sees roughly what it would in a file of its own. The embedded scope still starts at the first column of each line, which comment toggling relies on (see [Language configuration](#language-configuration)).

### Ruby

- Ruby after a script marker is a single capture, tokenized with `source.ruby` on its own. A capture can't extend past its own text, so an unclosed string or bracket stays on its line.
- A line ending in a comma continues on the next line, as in HAML. Each continuation line is its own isolated capture, and the block ends at the first line without a trailing comma, or at a blank line. A string literal that spans lines therefore loses its string color after the first line.
- Attribute hashes `{}`, HTML-style attributes `()` and object references `[]` are `begin`/`end` rules, because they can span lines. Each also ends at a blank line, which limits the damage of an unclosed bracket while typing.
- All Ruby carries `meta.embedded.line.ruby`, which `package.json` maps to the `ruby` language.

### Interpolation

`#{}` is the `interpolation` rule, included directly in plain text, attribute strings and generic filters. JavaScript, CSS, SCSS, Sass, Less, CoffeeScript and Markdown filters carry the extra scope `meta.filter.interpolated.haml`, and an `L:` injection on that scope adds `#{}` with priority over the embedded grammar's own rules. `:ruby` and `:erb` don't carry it, since Ruby already handles `#{}` in its strings and ERB uses `<%= %>`.

### Filters

| Filter | Embedded grammar | Language |
| --- | --- | --- |
| `:javascript` | `source.js` | `javascript` |
| `:css` | `source.css` | `css` |
| `:scss` | `source.css.scss` | `scss` |
| `:sass` | `source.sass` | `sass` |
| `:less` | `source.css.less` | `less` |
| `:coffee`, `:coffeescript` | `source.coffee` | `coffeescript` |
| `:ruby` | `source.ruby` | `ruby` |
| `:markdown` | `text.html.markdown` | `markdown` |
| `:erb` | `text.html.erb`, then `text.html.basic` | `erb` |
| Any other name | Plain text with `#{}` | `haml` |

`embeddedLanguages` in `package.json` maps each `meta.embedded.*` scope to a language, which VS Code uses for comment toggling and bracket matching inside the region. VS Code skips language ids that no installed extension registers, and a missing grammar leaves its content uncolored. That is why `sass` and `erb` are safe to list even where no extension provides them.

### Scope names and colors

The grammar uses the standard scope names that VS Code's HTML, CSS and Ruby grammars use, with no theme-specific scopes. Tokenizing [samples/kitchen_sink.haml](samples/kitchen_sink.haml) with [Nord](https://github.com/nordtheme/visual-studio-code)'s theme file gave these colors:

| Element | Scope | Nord color |
| --- | --- | --- |
| Tag names, `%`, `/`, `<` and `>` | `entity.name.tag`, `punctuation.definition.tag`, `keyword` | nord9 `#81A1C1` |
| Classes, ids and attribute names | `entity.other.attribute-name` | nord7 `#8FBCBB` |
| Ruby markers and `#{ }` | `punctuation.section.embedded` | nord9 `#81A1C1` |
| Filter names | `entity.name.function` | nord8 `#88C0D0` |
| Strings | `string` | nord14 `#A3BE8C` |
| Escapes and HTML entities | `constant.character` | nord13 `#EBCB8B` |
| Comments | `comment` | `#616E88` |
| Plain text | `meta.text.haml`, which Nord leaves at the default color | nord4 `#D8DEE9` |
| Brackets, dots and separators | `punctuation` | nord6 `#ECEFF4` |

## Language configuration

[language_configuration.json](language_configuration.json) sets:

- **Comments:** `-#`. VS Code picks the comment style from the language of the first character on each line, so filter lines get their language's comment and comma-continued Ruby lines get `#`.
- **Word selection:** `wordPattern` is VS Code's default with `-` allowed inside words, so double-clicking `btn-primary` selects all of it.
- **Folding:** by indentation (`offSide`).
- **Enter:** indents after a tag with no inline content, a line ending in `do` or `do |x|`, `- if`, `- else` and similar Ruby keywords, a filter, and a bare `-#` or `/`.
- **Auto-closing:** brackets and quotes. Quotes don't auto-close inside strings or comments.

`tokenTypes` in `package.json` marks plain text as string content, so VS Code doesn't offer word suggestions in prose or auto-close quotes there. Its selector is `meta.text.haml - meta.interpolation.haml`. Without the exclusion, Ruby inside `#{}` in plain text was treated as string content too.

## Install and update mechanics

Observed:

- A `git clone` into `~/.vscode/extensions` loads.
- A symbolic link there pointing to a clone elsewhere did not load. Reading VS Code's source suggested it would, and the cause is unknown.

Read from VS Code's source but not tested:

- `extensions.json` in the extensions folder lists the installed extensions. A folder placed there by hand is added to that list only if it appears while VS Code is running. At startup VS Code marks folders missing from the list in `.obsolete`, but it only deletes extensions it installed itself, so it never deletes a clone.
- `git pull` only changes files inside a listed folder, so VS Code can be open or closed while it runs.
- The list records each extension's ID (`publisher.name`) and version. A pulled `version` change makes the folder look outdated at the next startup. The source suggests the extension keeps loading anyway, but leaving `version` alone avoids the question. Changing `name` or `publisher` changes the ID, so the folder would probably need re-adding while VS Code runs.
- VS Code caches what it read from each `package.json` and checks the cache after starting, so a changed `package.json` takes a second reload. The grammar and language configuration are read from disk each time a window starts.
- An extension without code can run on the local side of Remote-SSH, WSL and container windows, so the local install should cover them.

## Known limitations

- After a tag, `|` multiline Ruby (`%p= "a" + |`) is highlighted as Ruby only on its first line. At the start of a line it works fully.
- While an attribute hash or attribute list is being typed, lines after an unclosed `{`, `(` or `[` take attribute colors until the bracket closes or a blank line appears.
- A Ruby string literal that spans comma-continued lines loses its string color after the first line.
- Under Nord, Ruby identifiers inside `#{}` within a string take the string color. Nord does the same in Ruby files.
- Toggle Line Comment on a comma-continued Ruby line inserts Ruby's `#`. HAML joins those lines before running them, so commenting out one of them breaks the call either way.
