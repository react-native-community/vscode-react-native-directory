<dd align="center"><img alt="React Native Directory Logo" height="96" src="./assets/icon.png" /></dd>
<h1 align="center">vscode-react-native-directory</h1>

<p align="center">
  <a aria-label="Latest release" href="https://github.com/react-native-community/vscode-react-native-directory/releases" target="_blank">
    <img alt="Latest release" src="https://img.shields.io/github/package-json/v/react-native-community/vscode-react-native-directory?style=flat-square&color=0366D6&labelColor=49505A" />
  </a>
  <a aria-label="Workflow status" href="https://github.com/react-native-community/vscode-react-native-directory/actions" target="_blank">
    <img alt="Workflow status" src="https://img.shields.io/github/actions/workflow/status/react-native-community/vscode-react-native-directory/verify.yml?branch=main&style=flat-square&labelColor=49505A" />
  </a>
  <a aria-label="Install from VS Code Marketplace" href="https://marketplace.visualstudio.com/items?itemName=react-native-directory.vscode-react-native-directory" target="_blank">
    <img alt="Install from VS Code Marketplace" src="https://img.shields.io/badge/marketplace-25292E?style=flat-square&label=%20&labelColor=49505A&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgMzIgMzIiIGZpbGw9IiNCQ0MzQ0QiPjxwYXRoIGQ9Ik0zMC44NjUgMy40NDggMjQuMjgyLjI4MWExLjk5IDEuOTkgMCAwIDAtMi4yNzYuMzg1TDkuMzk3IDEyLjE3MSAzLjkwMiA4LjAwNGExLjMzIDEuMzMgMCAwIDAtMS43MDMuMDczTC40MzkgOS42ODFhMS4zMyAxLjMzIDAgMCAwLS4wMDUgMS45NjlMNS4yIDE1Ljk5OS40MzQgMjAuMzQ4YTEuMzMgMS4zMyAwIDAgMCAuMDA1IDEuOTY5bDEuNzYgMS42MDRhMS4zMyAxLjMzIDAgMCAwIDEuNzAzLjA3M2w1LjQ5NS00LjE3MiAxMi42MTUgMTEuNTFhMS45OCAxLjk4IDAgMCAwIDIuMjcxLjM4NWw2LjU4OS0zLjE3MmExLjk5IDEuOTkgMCAwIDAgMS4xMy0xLjgwMlY1LjI0OGMwLS43NjYtLjQ0My0xLjQ2OS0xLjEzNS0xLjgwMnptLTYuODYgMTkuODE4TDE0LjQzMiAxNmw5LjU3My03LjI2NnoiLz48L3N2Zz4=" />
  </a>
  <a aria-label="Install from Open VSX" href="https://open-vsx.org/extension/react-native-directory/vscode-react-native-directory" target="_blank">
    <img alt="Install from Open VSX" src="https://img.shields.io/badge/vscode-open%20vsx-25292E?style=flat-square&label=%20&logoColor=BCC3CD&labelColor=49505A&logo=Eclipse%20IDE" />
  </a>
</p>

<p align="center">
A VS Code extension that allows browsing through the <a href="https://reactnative.directory/">React Native Directory</a><br/>
and performing actions related to the chosen package inside the built-in editor Command Palette.
</p>

<p align="center">
<img alt="Search mode" src="./assets/screenshot.png" width="500" align="center" />
<img alt="Actions list" src="./assets/screenshot-actions.png" width="500" align="center" />
</p>

## ⚡️ Features

* Search through the packages registered in the React Native Directory.
* Narrow down the results by using filter tokens, such as `:ios`, `:newArchitecture`, or `:hasTypes`.
  * Valid tokens are a subset of all possible API query options, and the values can be seen [in this file](/src/utils.ts#L33-L55).
* Install the selected packages in the current workspace using your preferred package manager.
* Dive deep into the stats and analysis with the provided metadata and links.

## 📦 Installation

#### VS Marketplace
1. Go to [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=react-native-directory.vscode-react-native-directory).
1. Click on the **"Install"** button.

#### Open VSX Registry
1. Go to [Open VSX Registry](https://open-vsx.org/extension/react-native-directory/vscode-react-native-directory).
1. Click on the **"Download"** button
1. In VS Code:
   * Navigate to the **"Extensions"** pane (<kbd>Ctrl/Cmd+Shift+X</kbd>).
   * Click **"More"** button (three dots in the right corner of header) and select **"Install from VSIX"**.
   * Select the VSIX file downloaded earlier in the process.

## 📝 Contributing

1. Make sure you have [Bun](https://bun.sh/docs/installation) installed.
1. Checkout the repository locally.
1. Run the following commands to install dependencies and compile source:
   
   ```sh
   bun install
   ```
1. In VS Code:
   * Open folder containing the extension repository.
   * Navigate to the **"Run and Debug"** pane (<kbd>Ctrl/Cmd+Shift+D</kbd>).
   * Select **"Run with extension"** launch task, and press **"Start Debugging"** button (<kbd>F5</kbd>).
