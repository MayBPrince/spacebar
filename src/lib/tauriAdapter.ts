import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open as openPath } from '@tauri-apps/plugin-shell';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

// Define types locally if needed, or import from somewhere
export interface ClipboardItem {
    id: string
    type: 'text' | 'image' | 'files'
    content: string
    timestamp: number
    pinned: boolean
    category?: string
}

export const tauriAdapter = {
    // Drawer controls
    toggleDrawer: () => invoke<void>('toggle_drawer'),
    hideDrawer: () => invoke<void>('hide_drawer'),
    showDrawer: () => invoke<void>('show_drawer'),
    hideWindow: () => invoke<void>('hide_drawer'), // Map to hideDrawer
    onDrawerVisibility: (callback: (visible: boolean) => void) => {
        const unlisten = listen<boolean>('drawer-visibility', (event) => {
            callback(event.payload);
        });
        return () => { unlisten.then(u => u()); };
    },
    onWindowBlur: (callback: () => void) => {
        const unlisten = listen('tauri://blur', () => {
            callback();
        });
        return () => { unlisten.then(u => u()); };
    },

    // Clipboard - Feature removed
    getClipboardHistory: async () => [],
    copyToClipboard: async () => false,
    deleteClipboardItem: async () => [],
    pinClipboardItem: async () => [],
    clearClipboardHistory: async () => [],
    onClipboardUpdate: (callback: (history: ClipboardItem[]) => void) => {
        const unlisten = listen<ClipboardItem[]>('clipboard-update', (event) => {
            callback(event.payload);
        });
        return () => { unlisten.then(u => u()); };
    },

    // App shortcuts
    launchApp: async (path: string) => {
        try {
            await openPath(path);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    getShortcuts: () => invoke<any[]>('get_shortcuts'),
    saveShortcuts: (shortcuts: any[]) => invoke<boolean>('save_shortcuts', { shortcuts }).then(() => true),

    // Settings
    getSettings: () => invoke<any>('get_settings'),
    saveSettings: (settings: any) => invoke<boolean>('save_settings', { settings }).then(() => true),

    // Window layouts
    getLayouts: () => invoke<any[]>('get_layouts'),
    saveLayout: (layout: any) => invoke<any[]>('save_layout', { layout }),
    deleteLayout: (id: string) => invoke<any[]>('delete_layout', { id }),

    // Conversations
    getConversations: () => invoke<any[]>('get_conversations'),
    saveConversations: (conversations: any[]) => invoke<boolean>('save_conversations', { conversations }).then(() => true),

    // Research notes
    getResearchNotes: () => invoke<any[]>('get_research_notes'),
    saveResearchNotes: (notes: any[]) => invoke<boolean>('save_research_notes', { notes }).then(() => true),

    // Tasks (Local Storage)
    getTasks: () => invoke<any[]>('get_tasks'),
    saveTasks: (tasks: any[]) => invoke<boolean>('save_tasks', { tasks }).then(() => true),

    // Notes (Local Storage)
    getNotes: () => invoke<any[]>('get_notes'),
    saveNotes: (notes: any[]) => invoke<boolean>('save_notes', { notes }).then(() => true),
    syncToNotion: (notionKey: string, databaseId: string, payload: any) =>
        invoke<string>('sync_to_notion', { notionKey, databaseId, payload }),
    testNotionConnection: (notionKey: string, databaseId: string) =>
        invoke<string>('test_notion_connection', { notionKey, databaseId }),
    updateNotionPage: (notionKey: string, pageId: string, payload: any) =>
        invoke<string>('update_notion_page', { notionKey, pageId, payload }),

    selectFiles: async () => {
        const selected: any = await openDialog({
            multiple: true,
            directory: false,
        });
        if (selected === null) return null;
        if (Array.isArray(selected)) {
            return selected.map(f => typeof f === 'string' ? f : f.path);
        }
        return typeof selected === 'string' ? [selected] : [selected.path];
    }
};
