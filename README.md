# Spacebar

**A sleek, modern, and open-source productivity drawer for Windows.**

Spacebar is a powerful productivity tool that gives you quick access to your clipboard history, AI chat, and more, all with a simple hotkey.

**[Download for Free on Gumroad](https://princepen.gumroad.com/l/spacebar)**

## Features

- **🎯 Global Hotkey**: Toggle the drawer from anywhere with `Ctrl+Shift+Space`.
- **📋 Clipboard Manager**: Automatically captures your clipboard history. Never lose a copied link or piece of text again.
- **💬 AI Chat**: Integrated chat with support for multiple AI providers.
- **🎨 Theming**: Comes with beautiful light and dark themes, and can also follow your system's theme.
- **✨ Modern UI**: A clean, minimal, and beautiful user interface.

## How to Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/) and its toolchain (for Tauri)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MayBPrince/spacebar.git
    cd spacebar
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build the application:**
    ```bash
    npm run tauri build
    ```
    This will create an installer in the `src-tauri/target/release/bundle/` directory.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
