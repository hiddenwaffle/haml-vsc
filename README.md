# HAML Syntax for VS Code

Syntax highlighting for HAML templates (`.haml`), including the Ruby, JavaScript, CSS and other languages embedded in them. It uses standard token names, so any color theme, Nord included, colors HAML the way it colors HTML, CSS and Ruby. It also colors `` ```haml `` code blocks in Markdown files.

## Install

With VS Code running, clone the repository into its extensions folder:

```sh
git clone https://github.com/hiddenwaffle/haml-vsc.git ~/.vscode/extensions/haml-vsc
```

Then run **Developer: Reload Window** from the Command Palette and open a `.haml` file. The status bar should show "HAML" as the language.

- Clone into the extensions folder itself. A symbolic link to a clone kept elsewhere did not load when tried.
- If the extension doesn't appear, move its folder out of the extensions folder and back in while VS Code is running, then reload.
- The extensions folder is `~/.vscode/extensions` on macOS and Linux. VS Code Insiders and other builds use a different folder.

## Update

```sh
cd ~/.vscode/extensions/haml-vsc
git pull
```

VS Code can be open or closed while you pull. Afterwards, restart VS Code or run **Developer: Reload Window**. If VS Code then reports that extensions changed on disk, reload once more.

## Optional extensions

- `:sass` filters are colored only if another extension provides Sass highlighting.
- `:erb` filters use the Ruby LSP extension's ERB highlighting if it is installed, and HTML highlighting otherwise.

## More

[DEVELOPMENT.md](DEVELOPMENT.md) covers known limitations, the colors under Nord, and how to change and test the extension.
