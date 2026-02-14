import { motion } from 'framer-motion'
import { useUIStore, ThemeType, sanitizeNotionId } from '../stores/uiStore'
import { X, Sun, Moon, Monitor, MessageSquarePlus } from 'lucide-react'

export default function Settings() {
    const {
        theme, setTheme,
        drawerSide, setDrawerSide,
        setSettingsOpen,
        notionKey, setNotionKey,
        notionTasksDatabaseId, setNotionTasksDatabaseId,
        notionNotesDatabaseId, setNotionNotesDatabaseId
    } = useUIStore()

    const saveSettings = async () => {
        if (window.electronAPI) {
            await window.electronAPI.saveSettings({
                theme,
                drawerSide,
                notionKey,
                notionTasksDatabaseId,
                notionNotesDatabaseId
            })
        }
        setSettingsOpen(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-drawer-bg border border-drawer-border"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-drawer-border">
                    <h2 className="font-semibold text-drawer-text">Settings</h2>
                    <button
                        onClick={() => setSettingsOpen(false)}
                        className="p-2 rounded-lg transition-colors hover:bg-drawer-surface text-drawer-text"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Theme */}
                    <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase mb-3 block text-drawer-text-muted">Theme</label>
                        <div className="flex gap-2">
                            {(['light', 'dark', 'system'] as ThemeType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${theme === t
                                        ? 'bg-drawer-surface-hover border-drawer-border text-drawer-text'
                                        : 'bg-drawer-surface border-transparent text-drawer-text-muted hover:text-drawer-text'
                                        }`}
                                >
                                    <div>
                                        {t === 'light' ? <Sun size={18} /> : t === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
                                    </div>
                                    <span className="text-[10px] capitalize font-medium">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Side Selection */}
                    <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase mb-3 block text-drawer-text-muted">Drawer Position</label>
                        <div className="flex gap-2 bg-drawer-surface p-1 rounded-xl border border-drawer-border/50">
                            {(['left', 'right'] as const).map((side) => (
                                <button
                                    key={side}
                                    onClick={() => setDrawerSide(side)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs transition-all capitalize font-medium ${drawerSide === side
                                        ? 'bg-drawer-bg text-drawer-text shadow-sm border border-drawer-border'
                                        : 'text-drawer-text-muted hover:text-drawer-text'
                                        }`}
                                >
                                    {side}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* Integrations */}
                    <div>
                        <label className="text-[10px] font-bold tracking-widest uppercase mb-3 block text-drawer-text-muted">External Integrations</label>
                        <div className="bg-drawer-surface p-4 rounded-xl border border-drawer-border">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-drawer-accent" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-drawer-text">Notion Sync</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block text-drawer-text-muted">Notion Integration Token</label>
                                    <input
                                        type="password"
                                        value={notionKey}
                                        onChange={(e) => setNotionKey(e.target.value)}
                                        placeholder="secret_..."
                                        className="w-full bg-drawer-surface border border-drawer-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors text-drawer-text"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block text-drawer-text-muted">Tasks Database ID</label>
                                        <input
                                            type="text"
                                            value={notionTasksDatabaseId}
                                            onChange={(e) => setNotionTasksDatabaseId(e.target.value)}
                                            placeholder="Enter ID for Tasks"
                                            className="w-full bg-drawer-surface border border-drawer-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors text-drawer-text"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block text-drawer-text-muted">Notes Database ID</label>
                                        <input
                                            type="text"
                                            value={notionNotesDatabaseId}
                                            onChange={(e) => setNotionNotesDatabaseId(e.target.value)}
                                            placeholder="Enter ID for Notes"
                                            className="w-full bg-drawer-surface border border-drawer-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors text-drawer-text"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!notionKey) {
                                            alert('Please enter your Notion Integration Token')
                                            return
                                        }
                                        if (!notionTasksDatabaseId && !notionNotesDatabaseId) {
                                            alert('Please enter at least one Database ID (Tasks or Notes)')
                                            return
                                        }

                                        try {
                                            if (window.electronAPI) {
                                                const results = []

                                                if (notionTasksDatabaseId) {
                                                    const taskId = sanitizeNotionId(notionTasksDatabaseId)
                                                    await window.electronAPI.testNotionConnection(notionKey, taskId)
                                                    results.push('Tasks Database verified')
                                                }

                                                if (notionNotesDatabaseId) {
                                                    const noteId = sanitizeNotionId(notionNotesDatabaseId)
                                                    await window.electronAPI.testNotionConnection(notionKey, noteId)
                                                    results.push('Notes Database verified')
                                                }

                                                alert(`Connection Successful!\n\n${results.join('\n')}`)
                                            }
                                        } catch (err: any) {
                                            console.error(err)
                                            alert(`Connection failed: ${err.message || err}\n\nEnsure your Database columns are correctly named.`)
                                        }
                                    }}
                                    className="w-full py-2 bg-drawer-surface hover:bg-drawer-surface-hover border border-drawer-border rounded-lg text-xs font-semibold transition-colors text-drawer-text"
                                >
                                    Test Connections
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    <div>
                        <a
                            href="https://tally.so/r/44xkM5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold transition-all border border-drawer-border bg-drawer-surface text-drawer-text hover:bg-drawer-surface-hover"
                        >
                            <MessageSquarePlus size={16} />
                            Share Feedback
                        </a>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-drawer-border flex gap-2 bg-drawer-bg">
                    <button
                        onClick={() => setSettingsOpen(false)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-drawer-surface text-drawer-text border border-drawer-border hover:bg-drawer-surface-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveSettings}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-opacity hover:opacity-90 bg-drawer-accent text-black"
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}
