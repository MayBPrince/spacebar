import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { tauriAdapter } from './lib/tauriAdapter'

// Inject Tauri adapter to mimic Electron API
window.electronAPI = tauriAdapter;

// Disable right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
