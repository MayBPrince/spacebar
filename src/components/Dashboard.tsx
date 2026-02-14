import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, ArrowUpRight, CheckSquare, Tag } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useState, useRef, useEffect } from 'react'
import DatePicker from './DatePicker'
import EditTaskModal from './EditTaskModal'
import { renderTextWithLinks } from '../utils/linkUtils'
import { formatRelativeDate } from '../utils/dateUtils'

const Dashboard = () => {
    const {
        setFocusBoardOpen,
        setNotesOpen,
        setSettingsOpen,
        setDrawerVisible,
        tasks,
        toggleTask,
        addTask,
        updateTask,
        notes,
        addNote,
        draftInput,
        setDraftInput
    } = useUIStore()

    const [activeDatePicker, setActiveDatePicker] = useState<number | null>(null)
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
    const [showTagSuggestions, setShowTagSuggestions] = useState(false)
    const [filteredTags, setFilteredTags] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    // Use draftInput from store for persistence
    const inputValue = draftInput
    const setInputValue = setDraftInput

    // Tag Suggestion Logic
    useEffect(() => {
        const lastWord = inputValue.split(/\s+/).pop() || ''
        if (lastWord.startsWith('#')) {
            const query = lastWord.slice(1).toLowerCase()
            const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort()
            const filtered = allTags.filter(t => t.toLowerCase().includes(query))
            setFilteredTags(filtered)
            setShowTagSuggestions(filtered.length > 0)
        } else {
            setShowTagSuggestions(false)
        }
    }, [inputValue, notes])

    const handleTagSelect = (tag: string) => {
        const words = inputValue.split(/\s+/)
        words.pop() // remove the partial tag
        const newValue = [...words, '#' + tag].join(' ') + ' '
        setInputValue(newValue)
        setShowTagSuggestions(false)
        inputRef.current?.focus()
    }

    // Focus input when drawer opens
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    const handleOpenFocusBoard = () => setFocusBoardOpen(true)
    const handleOpenNotes = () => setNotesOpen(true)
    const handleClose = () => {
        window.electronAPI.hideWindow()
        setDrawerVisible(false)
    }

    const handleTaskToggle = (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        toggleTask(id)
    }

    const handleTaskClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        setEditingTaskId(id)
    }

    const handlePriorityClick = (e: React.MouseEvent, id: number, currentPriority: 'p1' | 'p2' | 'p3') => {
        e.stopPropagation()
        const nextPriority = currentPriority === 'p1' ? 'p2' : currentPriority === 'p2' ? 'p3' : 'p1'
        updateTask(id, { priority: nextPriority })
    }

    const handleDateClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        setActiveDatePicker(activeDatePicker === id ? null : id)
    }

    const handleDateSelect = (id: number, date: string) => {
        updateTask(id, { date })
        setActiveDatePicker(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.metaKey || e.ctrlKey) {
                // Add Note
                if (inputValue.trim()) {
                    addNote(inputValue)
                    setInputValue('')
                }
            } else {
                // Add Task
                if (inputValue.trim()) {
                    addTask({
                        id: Date.now(),
                        text: inputValue,
                        priority: 'p2', // Default P2 as requested
                        date: 'Today',
                        completed: false
                    })
                    setInputValue('')
                }
            }
        }
    }

    const handleSaveTask = () => {
        if (inputValue.trim()) {
            addTask({
                id: Date.now(),
                text: inputValue,
                priority: 'p2',
                date: 'Today',
                completed: false
            })
            setInputValue('')
            inputRef.current?.focus()
        }
    }

    const handleSaveNote = () => {
        if (inputValue.trim()) {
            addNote(inputValue)
            setInputValue('')
            inputRef.current?.focus()
        }
    }

    // Filter and sort tasks: show only incomplete ones, sorted by priority and date
    const activeTasks = tasks
        .filter(t => !t.completed)
        .sort((a, b) => {
            // Priority order: p1 > p2 > p3
            const priorityOrder = { p1: 1, p2: 2, p3: 3 }
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
            if (priorityDiff !== 0) return priorityDiff

            // Date order: earlier dates first
            const getDateValue = (dateStr: string) => {
                if (dateStr === 'Today') return 0
                if (dateStr === 'Tomorrow') return 1
                if (dateStr === 'No Date') return 999999
                // Parse actual dates
                const date = new Date(dateStr)
                return isNaN(date.getTime()) ? 999999 : date.getTime()
            }

            return getDateValue(a.date || a.createdAt) - getDateValue(b.date || b.createdAt)
        })
        .slice(0, 3)

    return (
        <div className="flex flex-col h-full bg-drawer-bg text-drawer-text px-4 pt-[34px] pb-4 select-none relative" onClick={() => setActiveDatePicker(null)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1" />
                <h1 className="text-xl font-medium tracking-tight">Spacebar</h1>
                <div className="flex-1 flex justify-end gap-3">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-1.5 hover:bg-drawer-surface rounded-lg transition-colors text-drawer-text-muted hover:text-drawer-text"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-drawer-surface rounded-lg transition-colors text-drawer-text-muted hover:text-drawer-text"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Focus Board Section */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-2 group cursor-pointer" onClick={handleOpenFocusBoard}>
                    <h2 className="text-[10px] font-semibold text-drawer-text-muted uppercase tracking-wider">Focus Board</h2>
                    <ArrowUpRight size={14} className="text-drawer-text-muted transition-opacity" />
                </div>

                {/* Background Card for Tasks */}
                <div className="bg-drawer-surface rounded-xl p-3 min-h-[60px]">
                    <div className="space-y-1">
                        {activeTasks.length > 0 ? (
                            activeTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between group py-1.5 hover:bg-drawer-surface-hover rounded-lg -mx-1 px-1 transition-colors cursor-pointer border border-transparent">
                                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                        <div
                                            onClick={(e) => handleTaskToggle(e, task.id)}
                                            className={`w-3.5 h-3.5 rounded-md border-2 flex items-center justify-center transition-colors hover:border-blue-500 z-10 shrink-0 ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-blue-500'
                                                }`}
                                        >
                                            {task.completed && <CheckSquare size={8} className="text-white" />}
                                        </div>
                                        <span
                                            onClick={(e) => handleTaskClick(e, task.id)}
                                            className={`text-sm truncate opacity-90 hover:text-white transition-colors flex-1 ${task.completed ? 'line-through text-drawer-text-muted' : ''}`}
                                        >
                                            {task.text}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs shrink-0 relative">
                                        <span
                                            onClick={(e) => handlePriorityClick(e, task.id, task.priority)}
                                            className={`px-1 py-0.5 rounded text-[9px] font-bold cursor-pointer hover:opacity-80 transition-opacity ${task.priority === 'p1' ? 'bg-red-600 text-white' :
                                                task.priority === 'p2' ? 'bg-amber-500 text-white' :
                                                    'bg-blue-500 text-white'
                                                }`}
                                        >
                                            {task.priority.toUpperCase()}
                                        </span>

                                        <div className="relative">
                                            <span
                                                onClick={(e) => handleDateClick(e, task.id)}
                                                className="text-white w-20 text-right hover:text-drawer-text transition-colors cursor-pointer block text-[11px]"
                                            >
                                                {task.date === 'Today' || task.date === 'Tomorrow' || task.date === 'No Date'
                                                    ? task.date
                                                    : formatRelativeDate(task.date || task.createdAt)}
                                            </span>
                                            {activeDatePicker === task.id && (
                                                <DatePicker
                                                    onSelect={(date) => {
                                                        handleDateSelect(task.id, date)
                                                        setActiveDatePicker(null)
                                                    }}
                                                    onClose={() => setActiveDatePicker(null)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-[11px] text-drawer-text-muted italic py-1">No active tasks.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="min-h-0 mb-3">
                <div className="flex items-center justify-between mb-2 group cursor-pointer" onClick={handleOpenNotes}>
                    <h2 className="text-[10px] font-semibold text-drawer-text-muted uppercase tracking-wider">Notes</h2>
                    <ArrowUpRight size={14} className="text-drawer-text-muted transition-opacity" />
                </div>

                {/* Background Card for Notes */}
                <div className="bg-drawer-surface rounded-xl p-3 min-h-[60px]">
                    <div className="flex flex-wrap gap-1.5">
                        {notes.filter(n => !n.isArchived).slice(0, 6).map((note) => (
                            <div key={note.id} className="px-2.5 py-1 rounded-full border border-drawer-border/20 bg-drawer-surface/30 text-[11px] hover:border-drawer-text-muted transition-colors cursor-pointer truncate max-w-[180px]">
                                {renderTextWithLinks(note.content)}
                            </div>
                        ))}
                        {notes.filter(n => !n.isArchived).length === 0 && (
                            <div className="text-[11px] text-drawer-text-muted italic">No notes yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editing Modal */}
            <AnimatePresence>
                {editingTaskId && (
                    <EditTaskModal
                        taskId={editingTaskId}
                        onClose={() => setEditingTaskId(null)}
                    />
                )}
            </AnimatePresence>
            <div className="flex-1" />

            {/* Bottom Input Area */}
            <div className="relative mb-0" onClick={e => e.stopPropagation()}>
                {/* Tag Suggestions */}
                <AnimatePresence>
                    {showTagSuggestions && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full mb-2 left-0 right-0 bg-drawer-surface border border-drawer-border rounded-xl p-2 shadow-xl z-20 flex flex-wrap gap-1.5"
                        >
                            {filteredTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagSelect(tag)}
                                    className="px-2 py-1 rounded-lg bg-drawer-bg border border-drawer-border hover:border-drawer-text text-[11px] transition-colors flex items-center gap-1"
                                >
                                    <Tag size={10} />
                                    {tag}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sliding Buttons */}
                <div className={`absolute bottom-full mb-2 left-0 right-0 flex gap-2 transition-all duration-300 ease-out transform ${inputValue && !showTagSuggestions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <button
                        onClick={handleSaveTask}
                        className="flex-1 bg-white text-black py-1.5 rounded-lg text-[11px] font-bold shadow-lg hover:opacity-90 transition-opacity"
                    >
                        Save Task
                    </button>
                    <button
                        onClick={handleSaveNote}
                        className="flex-1 bg-white border border-drawer-border text-black py-1.5 rounded-lg text-[11px] font-bold shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        Save Note
                    </button>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a task or note ..."
                    className="w-full bg-drawer-surface border border-drawer-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors placeholder:text-drawer-text-muted/60"
                />
            </div>
        </div>

    )
}

export default Dashboard
