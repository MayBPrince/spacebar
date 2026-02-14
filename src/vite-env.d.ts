/// <reference types="vite/client" />

export interface ClipboardItem {
    id: string
    type: 'text' | 'image' | 'files'
    content: string
    timestamp: number
    pinned: boolean
    category?: string
}

export interface ElectronAPI {
    // Drawer controls
    toggleDrawer: () => Promise<void>
    hideDrawer: () => Promise<void>
    showDrawer: () => Promise<void>
    hideWindow: () => Promise<void>
    onDrawerVisibility: (callback: (visible: boolean) => void) => () => void
    onWindowBlur: (callback: () => void) => () => void

    // Clipboard
    getClipboardHistory: () => Promise<ClipboardItem[]>
    copyToClipboard: (content: string, type: 'text' | 'image') => Promise<boolean>
    deleteClipboardItem: (id: string) => Promise<ClipboardItem[]>
    pinClipboardItem: (id: string) => Promise<ClipboardItem[]>
    clearClipboardHistory: () => Promise<ClipboardItem[]>
    onClipboardUpdate: (callback: (history: ClipboardItem[]) => void) => () => void

    // App shortcuts
    launchApp: (path: string) => Promise<boolean>
    getShortcuts: () => Promise<any[]>
    saveShortcuts: (shortcuts: any[]) => Promise<boolean>

    // Settings
    getSettings: () => Promise<any>
    saveSettings: (settings: any) => Promise<boolean>

    // Window layouts
    getLayouts: () => Promise<any[]>
    saveLayout: (layout: any) => Promise<any[]>
    deleteLayout: (id: string) => Promise<any[]>

    // Conversations
    getConversations: () => Promise<any[]>
    saveConversations: (conversations: any[]) => Promise<boolean>

    // Research notes
    getResearchNotes: () => Promise<any[]>
    saveResearchNotes: (notes: any[]) => Promise<boolean>
    selectFiles: () => Promise<string[] | null>

    // Tasks (Local Storage)
    getTasks: () => Promise<any[]>
    saveTasks: (tasks: any[]) => Promise<boolean>

    // Notes (Local Storage)
    getNotes: () => Promise<any[]>
    saveNotes: (notes: any[]) => Promise<boolean>
    syncToNotion: (notionKey: string, databaseId: string, payload: any) => Promise<string>
    testNotionConnection: (notionKey: string, databaseId: string) => Promise<string>
    updateNotionPage: (notionKey: string, pageId: string, payload: any) => Promise<string>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
