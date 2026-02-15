# Spacebar

**A sleek, modern, and open-source productivity drawer for Windows & Mac.**
<img width="2540" height="1440" alt="Frame 7 (1)" src="https://github.com/user-attachments/assets/1452b78e-d527-4f62-aad3-4a5d7895647c" />


Spacebar is a powerful productivity tool that gives you quick access to your clipboard history, AI chat, and more, all with a simple hotkey.

**[Download for Free on Gumroad](https://princepen.gumroad.com/l/spacebar)**

## Feature

- **🎯 Global Hotkey**: Toggle the drawer with `Ctrl+Space`. and save your Idea
- **🗃️ Saving Methods**: `Ctrl+Enter` for saving as Notes; `Enter` for saving as Task
- **#️⃣ Use Hastag as Tag**: Use `#` at the end of notes to access Tag for notes
 
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
