# Developing HAML Syntax

This guide is for anyone changing the extension, whether a person or an agent. Installing and updating are covered in the [README](README.md).

## Essentials

- The extension is declarative: two TextMate grammars, a language configuration and a manifest. No code runs in VS Code and nothing needs building.
- Run `npm test` after every change, and add a test for every fix. It uses the same tokenizer library as VS Code.
- Leave `name`, `publisher` and `version` in `package.json` as they are. [Install and update mechanics](#install-and-update-mechanics) explains why.
- Scratch files go in `.scratch/`, which git ignores.

## Files

| Path | Purpose |
| --- | --- |
| [package.json](package.json) | Manifest: registers the `haml` language and the grammar, maps embedded scopes to languages, and holds the dev scripts |
| [syntaxes/haml.tmLanguage.json](syntaxes/haml.tmLanguage.json) | The grammar, with scope name `text.haml` |
| [syntaxes/markdown_fences.tmLanguage.json](syntaxes/markdown_fences.tmLanguage.json) | Colors `` ```haml `` code blocks in Markdown files, with scope name `markdown.haml.codeblock` |
| [language_configuration.json](language_configuration.json) | Comment toggling, brackets, folding, word selection and indenting on Enter |
| [samples/kitchen_sink.haml](samples/kitchen_sink.haml) | Every construct in one file, for checking by eye |
| [test](test) | Assertion files that `npm test` runs |
| [scripts/run_tests.mjs](scripts/run_tests.mjs) | The test runner |
| [scripts/tokenize.mjs](scripts/tokenize.mjs) | Prints the scopes of every token in a file |
| [scripts/compare.mjs](scripts/compare.mjs) | Prints the tokens in a file that a grammar change altered |
| [scripts/colors.mjs](scripts/colors.mjs) | Prints the color a theme gives every token in a file |
| [scripts/registry.mjs](scripts/registry.mjs) | Loads this extension's grammars and the embedded-language grammars for the scripts |

The extension is named `haml-vsc` because extension names can't contain underscores. File names use underscores.

## Trying a change in VS Code

VS Code loads only the clone in its extensions folder. Edit that clone directly, or work in another checkout, push, and `git pull` in the installed clone. Then reload the window (twice if `package.json` changed) and open [samples/kitchen_sink.haml](samples/kitchen_sink.haml), or this file to see a HAML code block in Markdown.

**Developer: Inspect Editor Tokens and Scopes** shows the scopes, language and token type under the cursor. It is the quickest way to compare what VS Code does with what the tests expect.

## Testing

```sh
npm install
npm test
npm run tokenize -- samples/kitchen_sink.haml
npm run compare -- samples/kitchen_sink.haml test/*.test.haml
npm run colors -- samples/kitchen_sink.haml path/to/theme.json
```

`npm test` runs every `test/*.test.haml` and `test/*.test.md` file. For each failure it prints the source line and the missing, unexpected and actual scopes. It fails if any assertion fails, and also if no assertions ran, so a broken harness can't pass.

`npm run tokenize` prints the scopes of every token. It reads HAML from standard input when given no file, and tokenizes `.md` files as Markdown.

`npm run compare` tokenizes each file twice, with the grammars as committed at `HEAD` and as they are now, and prints only the tokens that differ. Add `--rev` and a commit to compare with another revision. Running it on the sample and the test files after a grammar change shows side effects that no assertion covers. In test files it skips the header and assertion lines, as `npm test` does, and reports line numbers in the file.

`npm run colors` prints the color a theme gives each token, with the token's language and token type. It takes the theme's JSON file, follows the theme's `include`, and uses its `editor.foreground` for tokens the theme doesn't color. Nord's file is `themes/nord-color-theme.json`, both in [Nord's repository](https://github.com/nordtheme/visual-studio-code) and, probably, in Nord's folder under `~/.vscode/extensions`. The languages come from this extension's `package.json` only, so in a Markdown file, code in other languages shows as `markdown`.

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

Markdown test files (`.test.md`) use `<!--` as the marker. There `^` can't reach columns 0 to 3, so use `<-` with `~` for those columns.

## How the grammar works

TextMate grammars match one line at a time, while HAML depends on indentation. Most design choices follow from one aim: an unclosed bracket or string on one line must not color the rest of the file.

### Line types

Each root rule matches from the start of a line, or in a Markdown list or quote from where the list indentation or `>` ends (see [HAML code blocks in Markdown](#haml-code-blocks-in-markdown)). The first matching rule in the root `patterns` list wins. Order matters where one marker starts another: `conditional_comment` comes before `html_comment` (both start with `/`), and `interpolated_text_line` comes before `script_line` (`==` starts with `=`).

| Rule | Lines |
| --- | --- |
| `silent_comment` | `-#` and the block indented under it |
| `conditional_comment` | `/[if IE]` and `/![if !IE]`, while the block under them stays HAML |
| `html_comment` | `/` and the block indented under it |
| `doctype` | `!!!` |
| `filters` | `:javascript`, `:css` and every other filter |
| `text_multiline` | Text lines that continue with a trailing pipe, whatever the continuation lines start with |
| `escaped_line` | `\` followed by text. It escapes only the line type, so `#{}` after it still interpolates |
| `interpolated_text_line` | `==`, `&==` and `!==` |
| `script_line_multiline` | Ruby lines that continue with a trailing pipe |
| `script_line` | Ruby after `-`, `=`, `~`, `!=`, `&=`, `!~` and `&~` |
| `escaped_text_line` | `&` or `!` followed by text |
| `tag` | `%p`, `.class` and `#id`, with attributes, `<` `>`, `/` and inline content as sub-rules |
| `raw_html_line` | Lines that start with `<`, which HAML treats as plain text |
| `lone_pipe_line` | A line holding only a pipe character, which is text rather than a continuation |
| `plain_text_line` | Everything else, scoped `meta.text.haml` |

### Indented blocks

Comments and filters are `begin`/`while` rules. The `begin` captures the line's indentation, and the `while` continues the block for every line that is indented deeper or blank. When the `while` fails, TextMate closes every rule opened inside the block, so an embedded grammar can't leak past its filter.

A filter's `while` consumes the filter's indentation plus one level (one or two spaces, or a tab), so the embedded grammar sees roughly what it would in a file of its own. The embedded scope still starts at the first column of each line, which comment toggling relies on (see [Language configuration](#language-configuration)). `:ruby` is the exception: its `while` consumes nothing, so Ruby rules anchored to the line start, such as heredoc terminators, still match.

### Ruby

- Ruby after a script marker is a single capture, tokenized with `source.ruby` on its own. A capture can't extend past its own text, so an unclosed string or bracket stays on its line.
- Inside attribute hashes, object references and `#{}`, the grammar matches the braces and brackets itself and hands Ruby the text between them in stretches, each tokenized on its own (`ruby_run_hash`, `ruby_run_braces` and `ruby_run_brackets`). A stretch skips over strings and ends with its line, so an unclosed string or call can't run on, and an unclosed bracket ends at the next blank line.
- Ruby tokenized on its own has nothing after its last word, and `source.ruby` needs a following character to recognize a method call after a dot. `ruby_method_at_end` colors that final `.method`.
- A line ending in a comma continues on the next line, as in HAML, unless the comma is a character literal (`?,`). Each continuation line is its own isolated capture, and the block ends at the first line without a trailing comma, or at a blank line. A string literal that spans lines therefore loses its string color after the first line.
- A line ending in a space and `|` is joined with the following lines that end the same way, skipping blank lines, as in HAML. Block arguments written with spaces (`do | x |`) don't count. `script_line_multiline` and `inline_script_multiline` handle Ruby at the start of a line and after a tag, and `text_multiline` and `inline_text_multiline` do the same for text, so a continuation line that starts with `-`, `=` or `#` stays text. All four are `begin`/`while` blocks. An `L:` injection on `meta.multiline.haml` marks each trailing `|` even inside an open bracket or string. The `tag` rule also ends at the start of a line, so it closes when such a block inside it ends.
- Attribute hashes `{}`, HTML-style attributes `()` and object references `[]` are `begin`/`end` rules, because they can span lines. Each also ends at a blank line, which limits the damage of an unclosed bracket while typing. HTML-style attribute values, and `#{}` inside them, end with their line, because HAML never continues them.
- All Ruby carries `meta.embedded.line.ruby`, which `package.json` maps to the `ruby` language.

### Interpolation

`#{}` is the `interpolation` rule, and `#@ivar` and `#$gvar` are `interpolation_variable`. Both are included directly in plain text, generic filters and HTML comments. JavaScript, CSS, SCSS, Sass, Less, CoffeeScript and Markdown filters carry the extra scope `meta.filter.interpolated.haml`, and raw HTML lines carry `meta.raw-html.haml`. An `L:` injection on each adds interpolation with priority over the embedded grammar's own rules, so it also works inside HTML attribute values and JavaScript strings. `:ruby` doesn't carry it, since Ruby handles `#{}` in its own strings, and neither does `:erb`, which HAML passes to ERB without interpolating.

Backslashes before `#{`, `#@` or `#$` are counted, as HAML does: an odd number makes the interpolation literal, and an even number still interpolates. HTML-style attribute values use their own `attribute_interpolation`, which ends with its line.

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

Filter names match in any case, because HAML lowercases them. Generic filters keep a trailing ` |` as text, because HAML doesn't join lines inside a filter.

`embeddedLanguages` in `package.json` maps each `meta.embedded.*` scope to a language, which VS Code uses for comment toggling and bracket matching inside the region. VS Code skips language ids that no installed extension registers, and a missing grammar leaves its content uncolored. That is why `sass` and `erb` are safe to list even where no extension provides them.

### HAML code blocks in Markdown

[syntaxes/markdown_fences.tmLanguage.json](syntaxes/markdown_fences.tmLanguage.json) is injected into VS Code's Markdown grammar through `injectTo` in `package.json`. Its one rule is a copy of the Ruby code block rule in VS Code's Markdown grammar, with `haml` as the only language name, so it accepts the same fences: three or more backticks or tildes, any indentation, the name in any case, and text after the name. The `L:` prefix of its `injectionSelector` puts it ahead of the Markdown grammar's own rule for fences in languages it doesn't know. The selector leaves out indented code blocks and the inside of fences in other languages, where Markdown shows text as is, but not `` ```markdown `` blocks, whose content is Markdown again.

In a list item or block quote, Markdown's rules consume the list indentation or `>` at the start of each line before HAML's rules see it. So that HAML's rules still match there, every line-start anchor in a `begin`, `match` or `while` pattern is `(?:^|\G)` instead of `^`, and new line rules should follow suit. vscode-textmate lets `\G` match only where the enclosing rule's `begin` or `while` match ended, which in a code block is just after the indentation or `>`, and it forgets those positions at the start of each line. In a `.haml` file nothing consumes text at the start of a line before the line rules run, so `\G` matches only where `^` already does, and `npm run compare` shows no change in the sample or the test files.

In an `end` pattern, `\G` also matches right after the rule's own `begin`. The blank-line ends of attribute hashes, HTML-style attributes, object references and comma-continued lines accept `\G` with a lookbehind that rules out the position just after the opening bracket. The `tag` rule's end keeps `$|^`, which can't match after a list indentation or `>`. When a multi-line block inside a tag ends there, `line_after_multiline` reads the rest of the line as a new HAML line, nested inside the old tag, so Inspect shows `meta.tag.haml` twice on it.

Markdown's list rule consumes up to 4 spaces of every line in a list item. Under a `- ` item, whose content starts 2 spaces in, a line indented one HAML level deeper therefore loses all its indentation too. The comment and filter rules, which track indentation, also capture the run of spaces just before their first line's content, with a lookbehind. Their `while` continues the block when a later line has a longer run consumed, which means it is indented deeper. In a `.haml` file the capture is empty and that branch can't match, and after a `>` only the spaces after it count. These lookbehinds have variable length. VS Code's own TypeScript, CSS and Ruby grammars use such lookbehinds too, so its regex engine supports them.

vscode-textmate applies only the outermost grammar's `injections`, so those in the HAML grammar don't run inside a code block. [Known limitations](#known-limitations) lists what that leaves uncovered.

### Scope names and colors

The grammar uses the standard scope names that VS Code's HTML, CSS and Ruby grammars use, with no theme-specific scopes. Tokenizing [samples/kitchen_sink.haml](samples/kitchen_sink.haml) with [Nord](https://github.com/nordtheme/visual-studio-code)'s theme file (`npm run colors`) gave these colors:

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

In Markdown code blocks, Nord's Markdown rules also apply. Tokens with no color of their own, such as plain text, take its code block color, nord7 `#8FBCBB`, and string quotes take nord9 `#81A1C1`. Ruby code blocks look the same way.

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

- A `git clone` into `~/.vscode/extensions` while VS Code was running loaded on one machine but not on another. There, after a restart, `extensions.json` didn't list the extension and `.obsolete` did. Moving the folder out, quitting and restarting VS Code, and moving the folder back in while it ran fixed it. `extensions.json` then listed the extension, and `.obsolete` was gone.
- A symbolic link there pointing to a clone elsewhere did not load. Reading VS Code's source suggested it would, and the cause is unknown.

Read from VS Code's source, which explains the failed clone:

- `extensions.json` in the extensions folder lists the installed extensions. When a folder appears in the extensions folder while VS Code is running, VS Code reads its `package.json` once, right away. If it finds one, it adds the extension to the list and clears the extension's `.obsolete` entry. If it doesn't, as when `git clone` has created the folder but not yet its files, it ignores the folder, and changes inside the folder don't make it look again. Moving a finished clone within one disk avoids that, because the folder appears with its files.
- Folders that were present when VS Code started count as known, and VS Code ignores them if they reappear until it fully quits.
- At startup VS Code marks folders missing from the list in `.obsolete`, but it only deletes extensions it installed itself, so it never deletes a clone.

Read from VS Code's source but not tested:

- `git pull` only changes files inside a listed folder, so VS Code can be open or closed while it runs.
- The list records each extension's ID (`publisher.name`) and version. A pulled `version` change makes the folder look outdated at the next startup. The source suggests the extension keeps loading anyway, but leaving `version` alone avoids the question. Changing `name` or `publisher` changes the ID, so the folder would probably need re-adding while VS Code runs.
- VS Code caches what it read from each `package.json` and checks the cache after starting, so a changed `package.json` takes a second reload. The grammar and language configuration are read from disk each time a window starts.
- An extension without code can run on the local side of Remote-SSH, WSL and container windows, so the local install should cover them.

## Known limitations

- While an attribute hash or attribute list is being typed, lines after an unclosed `{`, `(` or `[` take attribute colors until the bracket closes or a blank line appears.
- A blank line ends a multi-line attribute hash or a comma-continued line, even though HAML can skip blank lines there. This keeps an unclosed bracket from coloring the rest of the file.
- A string literal that spans comma-continued lines loses its string color after the first line, and a Ruby `#` comment ends with its line, although HAML joins the lines before running them.
- Mixing both kinds of continuation in one statement, a pipe line followed by a comma line or the reverse, colors the last joined line as plain text.
- A silent or HTML comment line ending in ` |` doesn't take in the following pipe line, as HAML does.
- In `:markdown`, `#{}` inside inline code, link URLs and reference definitions isn't colored as Ruby, because the Markdown grammar matches those spans whole.
- The HAML nested under a bare `/` is colored as a comment, although HAML renders it into the HTML comment.
- Under Nord, Ruby identifiers inside `#{}` within a string take the string color. Nord does the same in Ruby files.
- Toggle Line Comment on a Ruby line continued with a comma or `|` inserts Ruby's `#`. HAML joins those lines before running them, so commenting out one of them breaks the code either way.
- In Markdown code blocks, `#{}` isn't colored as Ruby in interpolated filters such as `:javascript` or in raw HTML lines, and a trailing `|` inside an open bracket or string takes Ruby's color. Both rely on the HAML grammar's `injections`.
- The Markdown preview probably uses its own highlighter instead of TextMate grammars, so this extension likely doesn't change how it shows HAML code blocks. This hasn't been checked.
