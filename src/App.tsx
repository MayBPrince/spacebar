import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from './stores/uiStore'
import Dashboard from './components/Dashboard'
import FocusBoard from './components/FocusBoard'
import Notes from './components/Notes'
import Settings from './components/Settings'

function App() {
    const {
        isDrawerVisible,
        setDrawerVisible,
        theme,
        setTheme,
        drawerSide,
        setDrawerSide,
        isSettingsOpen,
        isFocusBoardOpen,
        isNotesOpen,
        setNotionKey,
        setNotionTasksDatabaseId,
        setNotionNotesDatabaseId,
        loadData
    } = useUIStore()

    // Initialize theme and data on mount
    useEffect(() => {
        // Load settings
        if (window.electronAPI) {
            window.electronAPI.getSettings().then((settings: any) => {
                if (settings.theme) setTheme(settings.theme)
                if (settings.drawerSide) setDrawerSide(settings.drawerSide)
                if (settings.notionKey) setNotionKey(settings.notionKey)
                if (settings.notionTasksDatabaseId) setNotionTasksDatabaseId(settings.notionTasksDatabaseId)
                if (settings.notionNotesDatabaseId) setNotionNotesDatabaseId(settings.notionNotesDatabaseId)
            })
        }
    }, [setTheme, setDrawerSide, setNotionKey, setNotionTasksDatabaseId, setNotionNotesDatabaseId])

    useEffect(() => {
        loadData()
    }, [loadData])

    useEffect(() => {
        document.documentElement.className = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme
    }, [theme])

    const renderContent = () => {
        return (
            <>
                <AnimatePresence mode="wait">
                    {/* Main Dashboard */}
                    <Dashboard />
                </AnimatePresence>

                {/* Overlays */}
                <AnimatePresence>
                    {isFocusBoardOpen && <FocusBoard />}
                </AnimatePresence>

                <AnimatePresence>
                    {isNotesOpen && <Notes />}
                </AnimatePresence>

                {/* Settings Overlay */}
                <AnimatePresence>
                    {isSettingsOpen && <Settings />}
                </AnimatePresence>
            </>
        )
    }

    // Auto-hide on blur (click outside)
    useEffect(() => {
        if (!window.electronAPI) return

        const unsubVisibility = window.electronAPI.onDrawerVisibility((visible: boolean) => {
            setDrawerVisible(visible)
        })

        const unsubBlur = window.electronAPI.onWindowBlur(() => {
            setDrawerVisible(false)
            // Also tell backend to hide it to sync state
            window.electronAPI.hideWindow()
        })

        return () => {
            unsubVisibility()
            unsubBlur()
        }
    }, [setDrawerVisible])

    return (
        <div className="h-full w-full bg-transparent">
            <AnimatePresence>
                {isDrawerVisible && (
                    <motion.div
                        initial={{ x: drawerSide === 'right' ? '100%' : '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: drawerSide === 'right' ? '100%' : '-100%', opacity: 0 }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 200,
                            mass: 1
                        }}
                        className="h-full w-full drawer-container overflow-hidden relative shadow-2xl"
                    >
                        {renderContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default App
