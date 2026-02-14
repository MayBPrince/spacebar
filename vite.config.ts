import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            overlay: true,
        },
        watch: {
            usePolling: true,
            interval: 1000,
            ignored: [
                "**/src-tauri/**",
                "**/dist/**",
                "**/node_modules/.vite/**"
            ]
        }
    },
})
