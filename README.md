# HAML Syntax for VS Code

Syntax highlighting for HAML templates (`.haml`), including the Ruby, JavaScript, CSS and other languages embedded in them.

The extension is declarative: a grammar, a language configuration and a manifest. No code runs and there is nothing to build, so a `git clone` is a complete install.

## What gets highlighted

- Tags (`%p`), class and id shorthand (`.card`, `#main`) and implicit divs.
- Attribute hashes (`{href: url}`, `{:href => url}`), including nested `data` hashes and hashes that span lines.
- HTML-style attributes (`(href="/" title=@title)`) and object references (`[@user]`).
- Whitespace removal (`<`, `>`) and self-closing tags (`%br/`).
- Ruby after `-`, `=`, `~`, `!=`, `&=`, `&~` and `!~`, including lines continued with a trailing comma or with `|`.
- `#{}` interpolation in plain text, attribute strings and filters.
- Plain text markers (`&`, `!`, `==`, `&==`, `!==`), line escapes (`\`), HTML entities and raw HTML lines.
- Silent comments (`-#`), HTML comments (`/`), conditional comments (`/[if IE]`) and doctypes (`!!!`).
- Filters, each highlighted in its own language:

| Filter | Highlighted as |
| --- | --- |
| `:javascript` | JavaScript |
| `:css`, `:scss`, `:less` | CSS, SCSS, Less |
| `:sass` | Sass, if a Sass extension is installed |
| `:coffee`, `:coffeescript` | CoffeeScript |
| `:ruby` | Ruby |
| `:markdown` | Markdown |
| `:erb` | ERB if the Ruby LSP extension is installed, otherwise HTML |
| `:plain`, `:escaped`, `:preserve`, `:cdata` and any other name | Plain text with `#{}` interpolation |

## Colors under Nord

The grammar uses the same standard token names as VS Code's HTML, CSS and Ruby grammars, so any theme colors HAML the way it colors those languages. With the [Nord theme](https://github.com/nordtheme/visual-studio-code), that comes out as:

| Element | Example | Nord color |
| --- | --- | --- |
| Tag names, `%`, `/`, `<` and `>` | `%div` | nord9 `#81A1C1` |
| Classes, ids and attribute names | `.card`, `#main`, `href` | nord7 `#8FBCBB` |
| Ruby markers and interpolation braces | `=`, `-`, `#{ }` | nord9 `#81A1C1` |
| Filter names | `:javascript` | nord8 `#88C0D0` |
| Strings | `"utf-8"` | nord14 `#A3BE8C` |
| Escapes and HTML entities | `\=`, `&amp;` | nord13 `#EBCB8B` |
| Comments | `-# note` | `#616E88` |
| Plain text | `Hello` | nord4 `#D8DEE9` |
| Brackets, dots and separators | `{ }`, `.`, `:` | nord6 `#ECEFF4` |

These come from tokenizing [samples/kitchen_sink.haml](samples/kitchen_sink.haml) against Nord's theme file with the same tokenizer VS Code uses. Open that sample to see every construct at once.

## Install

Clone the repository into VS Code's extensions folder, or clone it anywhere and link it there. On macOS and Linux the folder is `~/.vscode/extensions`. VS Code Insiders and other builds use a different folder.

> [!IMPORTANT]
> Add the folder or link **while VS Code is running**. VS Code registers a folder that appears in the extensions directory while it runs. A folder added while VS Code is closed is ignored at the next start.

Clone directly into the extensions folder:

```sh
git clone <your-repo-url> ~/.vscode/extensions/haml-vsc
```

Or keep the clone elsewhere and link it:

```sh
git clone <your-repo-url> ~/src/haml_vsc
ln -s ~/src/haml_vsc ~/.vscode/extensions/haml-vsc
```

Then run **Developer: Reload Window** from the Command Palette. Open a `.haml` file and check that the language indicator in the status bar reads "HAML".

If the extension doesn't appear, move the folder (or link) out of the extensions directory and back in while VS Code is running, then reload the window.

Because the extension has no code, VS Code can run it on your local machine for Remote-SSH, WSL and container windows, so the local install should cover those too.

## Update

```sh
cd ~/src/haml_vsc   # or ~/.vscode/extensions/haml-vsc
git pull
```

Then run **Developer: Reload Window**. If the update changed `package.json`, VS Code may ask you to reload once more after it notices the change.

## Editor behavior

- **Toggle Line Comment** inserts `-#`. Inside a filter it uses that language's comment instead, such as `//` in `:javascript`.
- Folding follows indentation.
- Pressing Enter after a tag without inline content, a `- if` or `do` block, a filter, or a bare `-#` or `/` indents the next line.
- Plain text is treated like string content, so word suggestions don't pop up while you type prose and quotes don't auto-close there.
- Double-clicking a hyphenated class name such as `btn-primary` selects the whole name.

## Known limitations

- After a tag, `|` multiline Ruby (`%p= "a" + |`) highlights only the first line as Ruby. At the start of a line it works fully.
- While you type an attribute hash or HTML-style attribute list, lines after an unclosed `{` or `(` are colored as attributes until the bracket closes or a blank line appears.
- Comma-continued Ruby is highlighted one line at a time, so a string literal that spans lines loses its string color after the first line.
- Under Nord, Ruby identifiers inside `#{}` within a string take the string color. Ruby files in Nord behave the same way.
- Toggling a comment on a comma-continued Ruby line inserts Ruby's `#`. HAML joins those lines into one before running them, so commenting out a single continuation line breaks the call either way.

## Development

The extension itself has no dependencies. The test tools are dev dependencies only:

```sh
npm install
npm test
```

`npm test` runs the assertion files in [test](test). Each one is HAML with `-#` assertion lines underneath, in the [vscode-tmgrammar-test](https://github.com/PanAeon/vscode-tmgrammar-test) format. Embedded languages are tokenized with the grammars from the `tm-grammars` package.

To see how the grammar tokenizes any file:

```sh
npm run tokenize -- samples/kitchen_sink.haml
```

| Path | Purpose |
| --- | --- |
| [package.json](package.json) | Extension manifest and dev scripts |
| [syntaxes/haml.tmLanguage.json](syntaxes/haml.tmLanguage.json) | The grammar |
| [language_configuration.json](language_configuration.json) | Comments, brackets, folding and indentation |
| [samples/kitchen_sink.haml](samples/kitchen_sink.haml) | Every construct in one file |
| [scripts](scripts) | Test runner and tokenizer |
