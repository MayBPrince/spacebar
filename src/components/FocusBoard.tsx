import { motion } from 'framer-motion'
import { Search, X, CheckSquare, Trash2 } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useState } from 'react'
import { renderTextWithLinks } from '../utils/linkUtils'

const FocusBoard = () => {
    const { isFocusBoardOpen, setFocusBoardOpen, tasks, toggleTask, deleteTask } = useUIStore()
    const [searchQuery, setSearchQuery] = useState('')

    if (!isFocusBoardOpen) return null

    // Filter tasks based on search
    const filteredTasks = tasks.filter(task =>
        task.text.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 bg-drawer-bg z-20 flex flex-col p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-drawer-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-drawer-surface border border-drawer-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors"
                        autoFocus
                    />
                </div>
                <button
                    onClick={() => setFocusBoardOpen(false)}
                    className="p-2 hover:bg-drawer-surface rounded-lg transition-colors text-drawer-text-muted hover:text-drawer-text"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTasks.length === 0 ? (
                    <div className="text-center text-drawer-text-muted mt-10 text-sm">No tasks found</div>
                ) : (
                    filteredTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between group py-3 px-3 hover:bg-drawer-surface/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-drawer-border/50">
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors hover:border-blue-500 ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-drawer-text-muted/40'
                                        }`}
                                >
                                    {task.completed && <CheckSquare size={10} className="text-white" />}
                                </div>
                                <span className={`text-sm truncate opacity-90 ${task.completed ? 'line-through text-drawer-text-muted' : 'text-drawer-text'}`}>
                                    {renderTextWithLinks(task.text)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.priority === 'p1' ? 'bg-priority-p1 text-white' :
                                    task.priority === 'p2' ? 'bg-priority-p2 text-black' :
                                        'bg-priority-p3 text-white'
                                    }`}>
                                    {task.priority.toUpperCase()}
                                </span>
                                <span className="text-xs text-drawer-text-muted w-16 text-right">{task.date}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteTask(task.id)
                                    }}
                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded text-drawer-text-muted transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    )
}

export default FocusBoard
