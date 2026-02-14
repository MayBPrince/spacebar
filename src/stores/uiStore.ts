import { create } from 'zustand'
// Removed Notion client from frontend to avoid CORS/Illegal invocation errors
// Syncing is now handled via the Rust backend

export type ThemeType = 'light' | 'dark' | 'system'

// Note Interface
export interface Note {
    id: string
    content: string
    tags: string[]
    createdAt: string
    isArchived: boolean
    isPinned: boolean
    notionPageId?: string
}

interface UIState {
    // Drawer state
    isDrawerVisible: boolean
    setDrawerVisible: (visible: boolean) => void

    // Theme
    theme: ThemeType
    setTheme: (theme: ThemeType) => void

    // Drawer side
    drawerSide: 'left' | 'right'
    setDrawerSide: (side: 'left' | 'right') => void

    // Popups
    isFocusBoardOpen: boolean
    setFocusBoardOpen: (open: boolean) => void

    isNotesOpen: boolean
    setNotesOpen: (open: boolean) => void

    // Notes Focus
    activeNoteId: string | null
    setActiveNoteId: (id: string | null) => void

    // Settings panel
    isSettingsOpen: boolean
    setSettingsOpen: (open: boolean) => void

    isAuthOpen: boolean
    setAuthOpen: (open: boolean) => void

    // Input persistence
    draftInput: string
    setDraftInput: (value: string) => void

    // Data - Tasks
    tasks: { id: number; text: string; priority: 'p1' | 'p2' | 'p3'; date: string; completed: boolean; createdAt: string; notionPageId?: string }[]
    setTasks: (tasks: any[]) => void
    addTask: (task: any) => Promise<void>
    updateTask: (id: number, updates: any) => Promise<void>
    toggleTask: (id: number) => Promise<void>
    deleteTask: (id: number) => Promise<void>

    // Data - Notes
    notes: Note[]
    setNotes: (notes: Note[]) => void
    addNote: (content: string) => Promise<void>
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>
    deleteNote: (id: string) => Promise<void>

    // Data Loading
    loadData: () => Promise<void>

    notionKey: string
    setNotionKey: (key: string) => void
    notionTasksDatabaseId: string
    setNotionTasksDatabaseId: (id: string) => void
    notionNotesDatabaseId: string
    setNotionNotesDatabaseId: (id: string) => void

    // License
    isLicensed: boolean
    setIsLicensed: (licensed: boolean) => void
    checkLicense: () => Promise<void>
}

// Helper to extract Notion ID from full URL if provided
export const sanitizeNotionId = (id: string) => {
    if (!id) return ''
    if (!id.includes('/')) return id.trim()
    const parts = id.split('/')
    let lastPart = parts[parts.length - 1]
    // Handle IDs at the end of URLs
    return lastPart.split('?')[0].trim()
}

export const useUIStore = create<UIState>((set, get) => ({
    // ... rest of the store implementation ...
    // Drawer
    isDrawerVisible: true,
    setDrawerVisible: (visible) => set({ isDrawerVisible: visible }),

    // License
    isLicensed: true,
    setIsLicensed: (licensed) => set({ isLicensed: licensed }),
    checkLicense: async () => {
        set({ isLicensed: true })
    },

    // Theme
    theme: 'dark',
    setTheme: (theme) => set({ theme }),

    // Drawer side
    drawerSide: 'right',
    setDrawerSide: (side) => set({ drawerSide: side }),

    // Popups
    isFocusBoardOpen: false,
    setFocusBoardOpen: (open) => set({ isFocusBoardOpen: open }),

    isNotesOpen: false,
    setNotesOpen: (open) => set({ isNotesOpen: open }),

    // Notes
    activeNoteId: null,
    setActiveNoteId: (id) => set({ activeNoteId: id }),

    // Settings
    isSettingsOpen: false,
    setSettingsOpen: (open) => set({ isSettingsOpen: open }),

    isAuthOpen: false,
    setAuthOpen: (open) => set({ isAuthOpen: open }),

    // Input persistence
    draftInput: '',
    setDraftInput: (value) => set({ draftInput: value }),

    // Data - Tasks
    tasks: [],
    setTasks: (tasks) => set({ tasks }),
    addTask: async (task) => {
        // Optimistic update
        const tempId = task.id || Date.now()
        const newTask = {
            ...task,
            id: tempId,
            createdAt: task.createdAt || new Date().toISOString()
        }
        const newTasks = [newTask, ...get().tasks]
        set({ tasks: newTasks })

        // Save to local disk immediately
        if (window.electronAPI) {
            await window.electronAPI.saveTasks(newTasks)
        }

        // Sync to Notion if configured
        const { notionKey, notionTasksDatabaseId } = get()
        const sanitizedDbId = sanitizeNotionId(notionTasksDatabaseId)
        if (notionKey && sanitizedDbId && window.electronAPI) {
            try {
                // Sync with Name, date, Priority, and Type
                const payload = {
                    parent: { database_id: sanitizedDbId },
                    properties: {
                        Name: {
                            title: [{ text: { content: task.text } }]
                        },
                        // "date" property as seen in user's screenshot
                        date: {
                            date: { start: new Date().toISOString().split('T')[0] }
                        },
                        Priority: {
                            select: { name: task.priority.toUpperCase() }
                        },
                        Done: {
                            checkbox: false
                        }
                    }
                }
                console.log('Syncing Task to Notion with payload:', payload)
                const pageId = await window.electronAPI.syncToNotion(notionKey, sanitizedDbId, payload)

                // Update task with notionPageId
                if (pageId && pageId !== 'Success' && pageId !== 'Unknown ID') {
                    const tasksWithId = get().tasks.map(t => t.id === tempId ? { ...t, notionPageId: pageId } : t)
                    set({ tasks: tasksWithId })
                    await window.electronAPI.saveTasks(tasksWithId)
                }
            } catch (error: any) {
                console.error('Notion Sync Error (Task):', error)
                alert(`Notion Sync Failed: ${error.message || error}`)
            }
        }
    },
    updateTask: async (id, updates) => {
        const newTasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        set({ tasks: newTasks })

        // Save to local disk
        if (window.electronAPI) {
            await window.electronAPI.saveTasks(newTasks)
        }

        // Sync update to Notion if notionPageId exists
        const task = newTasks.find(t => t.id === id)
        const { notionKey } = get()
        if (task?.notionPageId && notionKey && window.electronAPI) {
            try {
                const payload: any = { properties: {} }
                if (updates.text) {
                    payload.properties.Name = { title: [{ text: { content: updates.text } }] }
                }
                if (updates.priority) {
                    payload.properties.Priority = { select: { name: updates.priority.toUpperCase() } }
                }
                if (updates.date) {
                    // Try to parse relative date or use raw string if possible
                    // Notion expects ISO 8601 for date properties
                    let isoDate = new Date().toISOString().split('T')[0] // Default
                    if (updates.date === 'Tomorrow') {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        isoDate = tomorrow.toISOString().split('T')[0]
                    } else if (updates.date !== 'Today' && updates.date !== 'No Date') {
                        // Attempt to parse "10 Mar 26" format
                        const parsed = new Date(updates.date)
                        if (!isNaN(parsed.getTime())) {
                            isoDate = parsed.toISOString().split('T')[0]
                        }
                    }

                    if (updates.date === 'No Date') {
                        payload.properties.date = null
                    } else {
                        payload.properties.date = { date: { start: isoDate } }
                    }
                }
                if (updates.completed !== undefined) {
                    payload.properties.Done = { checkbox: updates.completed }
                }

                if (Object.keys(payload.properties).length > 0) {
                    await window.electronAPI.updateNotionPage(notionKey, task.notionPageId, payload)
                }
            } catch (error) {
                console.error('Notion Update Error (Task):', error)
            }
        }
    },
    toggleTask: async (id) => {
        const currentTask = get().tasks.find(t => t.id === id)
        if (!currentTask) return

        const newCompleted = !currentTask.completed
        const newTasks = get().tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t)
        set({ tasks: newTasks })

        // Save to local disk
        if (window.electronAPI) {
            await window.electronAPI.saveTasks(newTasks)
        }

        // Sync completion status to Notion
        const { notionKey } = get()
        if (currentTask.notionPageId && notionKey && window.electronAPI) {
            try {
                const payload = {
                    properties: {
                        Done: { checkbox: newCompleted }
                    }
                }
                await window.electronAPI.updateNotionPage(notionKey, currentTask.notionPageId, payload)
            } catch (error) {
                console.error('Notion Toggle Error:', error)
            }
        }
    },
    deleteTask: async (id) => {
        const taskToDelete = get().tasks.find(t => t.id === id)
        const newTasks = get().tasks.filter(t => t.id !== id)
        set({ tasks: newTasks })

        // Save to local disk
        if (window.electronAPI) {
            await window.electronAPI.saveTasks(newTasks)
        }

        // Archive in Notion if notionPageId exists
        const { notionKey } = get()
        if (taskToDelete?.notionPageId && notionKey && window.electronAPI) {
            try {
                await window.electronAPI.updateNotionPage(notionKey, taskToDelete.notionPageId, { archived: true })
            } catch (error) {
                console.error('Notion Delete Error (Task):', error)
            }
        }
    },

    // Data - Notes
    notes: [],
    setNotes: (notes) => set({ notes }),
    addNote: async (content) => {
        const tempId = Date.now().toString()
        const extractedTags = content.match(/#(\w+)/g)?.map(tag => tag.replace('#', '')) || []
        const tags = extractedTags.length > 0 ? extractedTags : ['untag']
        const newNote: Note = {
            id: tempId,
            content,
            tags,
            createdAt: new Date().toISOString(),
            isArchived: false,
            isPinned: false
        }
        const newNotes = [newNote, ...get().notes]
        set({ notes: newNotes })

        // Save to local disk immediately
        if (window.electronAPI) {
            await window.electronAPI.saveNotes(newNotes)
        }

        // Sync to Notion if configured
        const { notionKey, notionNotesDatabaseId } = get()
        const sanitizedDbId = sanitizeNotionId(notionNotesDatabaseId)
        if (notionKey && sanitizedDbId && window.electronAPI) {
            try {
                const payload = {
                    parent: { database_id: sanitizedDbId },
                    properties: {
                        Name: {
                            title: [{ text: { content: content.replace(/#(\w+)/g, '').replace(/\s+/g, ' ').trim() || content } }]
                        },
                        date: {
                            date: { start: new Date().toISOString().split('T')[0] }
                        },
                        Tags: {
                            select: { name: tags[0] }
                        }
                    }
                }
                console.log('Syncing Note to Notion with payload:', payload)
                const pageId = await window.electronAPI.syncToNotion(notionKey, sanitizedDbId, payload)

                // Update note with notionPageId
                if (pageId && pageId !== 'Success' && pageId !== 'Unknown ID') {
                    const notesWithId = get().notes.map(n => n.id === tempId ? { ...n, notionPageId: pageId } : n)
                    set({ notes: notesWithId })
                    await window.electronAPI.saveNotes(notesWithId)
                }
            } catch (error: any) {
                console.error('Notion Sync Error (Note):', error)
                alert(`Notion Sync Failed: ${error.message || error}`)
            }
        }
    },
    updateNote: async (id, updates) => {
        const newNotes = get().notes.map(n => {
            if (n.id === id) {
                const updatedNote = { ...n, ...updates }
                if (updates.content) {
                    const extractedTags = updates.content.match(/#(\w+)/g)?.map(tag => tag.replace('#', '')) || []
                    updatedNote.tags = extractedTags.length > 0 ? extractedTags : ['untag']
                }
                return updatedNote
            }
            return n
        })
        set({ notes: newNotes })

        // Save to local disk
        if (window.electronAPI) {
            await window.electronAPI.saveNotes(newNotes)
        }

        // Sync update to Notion if notionPageId exists
        const note = newNotes.find(n => n.id === id)
        const { notionKey } = get()
        if (note?.notionPageId && notionKey && window.electronAPI) {
            try {
                const payload: any = { properties: {} }
                if (updates.content) {
                    const extractedTags = updates.content.match(/#(\w+)/g)?.map(tag => tag.replace('#', '')) || []
                    const finalTag = extractedTags.length > 0 ? extractedTags[0] : 'untag'
                    const cleanContent = updates.content.replace(/#(\w+)/g, '').replace(/\s+/g, ' ').trim() || updates.content
                    payload.properties.Name = { title: [{ text: { content: cleanContent } }] }
                    payload.properties.Tags = {
                        select: { name: finalTag }
                    }
                }

                if (Object.keys(payload.properties).length > 0) {
                    await window.electronAPI.updateNotionPage(notionKey, note.notionPageId, payload)
                }
            } catch (error) {
                console.error('Notion Update Error (Note):', error)
            }
        }
    },
    deleteNote: async (id) => {
        const noteToDelete = get().notes.find(n => n.id === id)
        const newNotes = get().notes.filter(n => n.id !== id)
        set({ notes: newNotes })

        // Save to local disk
        if (window.electronAPI) {
            await window.electronAPI.saveNotes(newNotes)
        }

        // Archive in Notion if notionPageId exists
        const { notionKey } = get()
        if (noteToDelete?.notionPageId && notionKey && window.electronAPI) {
            try {
                await window.electronAPI.updateNotionPage(notionKey, noteToDelete.notionPageId, { archived: true })
            } catch (error) {
                console.error('Notion Delete Error (Note):', error)
            }
        }
    },

    // Data Loading
    loadData: async () => {
        try {
            // Only load from local storage
            if (window.electronAPI) {
                const localTasks = await window.electronAPI.getTasks()
                const localNotes = await window.electronAPI.getNotes()

                if (localTasks && localTasks.length > 0) {
                    set({ tasks: localTasks })
                }
                if (localNotes && localNotes.length > 0) {
                    set({ notes: localNotes })
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
    },

    // Integrations
    notionKey: '',
    setNotionKey: (key) => set({ notionKey: key }),
    notionTasksDatabaseId: '',
    setNotionTasksDatabaseId: (id) => set({ notionTasksDatabaseId: id }),
    notionNotesDatabaseId: '',
    setNotionNotesDatabaseId: (id) => set({ notionNotesDatabaseId: id })
}))
