# Unsafe Typescript Highlighter for VS Code

Visually mark out unsafe Typescript features in your code.

**Supports**: Typescript, JSX (`.tsx`) and Vue/Svelte single component files.

## Features

TODO: ...

![Highlight Typescript unsafe features](assets/image.png)

### Motivation

TODO: Why and thanks

Thanks to [Matt Pocock](https://twitter.com/mattpocockuk/status/1732485506556940782)

## Extension Settings

This extension contributes the following settings: TODO: 

- `unsafeTypescript.enable`: Specifies the relative path to the `package.json` file of the root of the workspaces. Default value: `package.json`.
- `unsafeTypescript.run`: This extension needs to modify the `files.exclude` setting to hide folders. This setting specifies the scope of the setting change. If `workspace`, the setting will be modified in the workspace settings. If `workspace-folder`, the setting will be modified in the workspace folder settings. If `global`, the setting will be modified in the user settings.
- `unsafeTypescript.decorate`: Enable output logs for debugging purposes.
- `unsafeTypescript.highlight.nonNullAssertion.enable`: TODO
- `unsafeTypescript.highlight.asTypeAssertion.enable`: TODO
- `unsafeTypescript.highlight.angleBracketedTypeAssertion.enable`: TODO
- `unsafeTypescript.highlight.typePredicate.enable`: TODO

## Release Notes

### 1.0.0

Initial release of Unsafe Typescript Highlighter.

## License

This extension is licensed under the [MIT License](LICENSE).
