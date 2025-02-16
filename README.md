<dd align="center"><img alt="React Native Directory Logo" height="96" src="./assets/icon.png" /></dd>
<h1 align="center">vscode-react-native-directory</h1>

<img alt="Extension preview" src="./assets/screenshot.png" />

A VS Code extension allowing to browse through React Native Directory and perform actions on the packages inside build-in Command Palette.

## Installation

> [!tip]
> The extension is currently in the development phase, and only manual build and installation is supported at this time.

1. Make sure you have [Bun](https://bun.sh/docs/installation) installed.
2. Checkout the repository locally.
3. Run `bun install && bun compile && bun package` to to install dependencies, compile source and prepare extension package file.
4. In VS Code:
   * Navigate to the "Extensions" pane (<kbd>Ctrl/Cmd+Shift+X</kbd>).
   * Click "More" button (three dots in the right corner of header) and select "Install from VSIX".
   * Select VSIX file which has been created in third step inside the checkout root directory.

## Contributing

1. Make sure you have [Bun](https://bun.sh/docs/installation) installed.
2. Checkout the repository locally.
3. Run `bun install && bun compile` to install dependencies and compile source.
4. In VS Code:
   * Open folder containing the extension repository.
   * Navigate to the "Run and Debug" pane (<kbd>Ctrl/Cmd+Shift+D</kbd>).
   * Select "Run with extension" launch task and press "Start Debugging" button (<kbd>F5</kbd>).