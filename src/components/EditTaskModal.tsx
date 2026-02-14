import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import DatePicker from './DatePicker'

interface EditTaskModalProps {
    taskId: number
    onClose: () => void
}

const EditTaskModal = ({ taskId, onClose }: EditTaskModalProps) => {
    const { tasks, updateTask, deleteTask } = useUIStore()
    const task = tasks.find(t => t.id === taskId)
    const [text, setText] = useState(task?.text || '')
    const [priority, setPriority] = useState<'p1' | 'p2' | 'p3'>(task?.priority || 'p2')
    const [date, setDate] = useState(task?.date || 'Today')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [])

    if (!task) return null

    const handleSave = () => {
        if (text.trim()) {
            updateTask(taskId, { text, priority, date })
            onClose()
        }
    }

    const handleDelete = () => {
        deleteTask(taskId)
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-drawer-surface border border-drawer-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-drawer-text">Edit Task</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Task"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="text-drawer-text-muted hover:text-drawer-text transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-drawer-text-muted uppercase tracking-wider mb-2">Task Name</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-drawer-bg border border-drawer-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-drawer-accent transition-colors text-drawer-text"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-drawer-text-muted uppercase tracking-wider mb-2">Priority</label>
                            <div className="flex gap-2">
                                {(['p1', 'p2', 'p3'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${priority === p
                                                ? 'ring-2 ring-offset-1 ring-offset-drawer-surface ring-drawer-accent'
                                                : 'opacity-50 hover:opacity-100'
                                            } ${p === 'p1' ? 'bg-priority-p1 text-white' :
                                                p === 'p2' ? 'bg-priority-p2 text-black' :
                                                    'bg-priority-p3 text-white'
                                            }`}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <label className="block text-xs font-semibold text-drawer-text-muted uppercase tracking-wider mb-2">Due Date</label>
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full flex items-center justify-between bg-drawer-bg border border-drawer-border rounded-xl px-4 py-2.5 text-sm hover:border-drawer-text-muted transition-colors text-drawer-text"
                            >
                                <span>{date}</span>
                                <CalendarIcon size={16} className="text-drawer-text-muted" />
                            </button>
                            {showDatePicker && (
                                <div className="absolute top-full left-0 mt-2 z-10">
                                    <DatePicker
                                        onSelect={(newDate) => {
                                            setDate(newDate)
                                            setShowDatePicker(false)
                                        }}
                                        onClose={() => setShowDatePicker(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            className="bg-drawer-text text-drawer-bg px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default EditTaskModal
