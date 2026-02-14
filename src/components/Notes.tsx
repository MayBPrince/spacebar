import { motion } from 'framer-motion'
import { Search, X, Archive, Tag, MoreHorizontal, Trash2, Plus } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useState, useRef, useEffect } from 'react'
import { renderTextWithLinks } from '../utils/linkUtils'

const Notes = () => {
    const { isNotesOpen, setNotesOpen, notes, deleteNote, updateNote } = useUIStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [view, setView] = useState<'all' | 'archived'>('all')
    const [isMenuOpen, setMenuOpen] = useState(false)
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [newTagInput, setNewTagInput] = useState('')
    const [isAddingTag, setIsAddingTag] = useState(false)
    const tagInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isAddingTag && tagInputRef.current) {
            tagInputRef.current.focus()
        }
    }, [isAddingTag])

    if (!isNotesOpen) return null

    // Get all unique tags
    const allTags = Array.from(new Set([
        ...notes.flatMap(n => n.tags),
        // Add default tags if needed, or just rely on user created ones
    ])).sort()

    // Filter notes
    const filteredNotes = notes.filter(note => {
        // Search filter
        const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase())
        // View filter (Archive vs All)
        const matchesView = view === 'archived' ? note.isArchived : !note.isArchived
        // Tag filter
        const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true

        return matchesSearch && matchesView && matchesTag
    })

    const handleArchiveToggle = (id: string, currentStatus: boolean) => {
        updateNote(id, { isArchived: !currentStatus })
    }

    const handleDelete = (id: string) => {
        deleteNote(id)
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTagInput.trim()) {
            // Since we don't have a separate Tags store, we just add it to the filter list visually
            // but we need to assign it to a note. 
            // WAIT, the requirement is creating a tag. 
            // Usually tags are created when assigned to a note or just exist.
            // "add a way to create tag in the full screen of notes page"
            // I'll make it so this input adds a tag to the *selected* note if we were editing one,
            // but for a general "Tag List", it's tricky without a separate store.
            // I will assume for now this adds it to the list for filtering, 
            // BUT actually, to make it persist, it needs to be on a note.
            // Let's implement: Creating a tag here just switches the filter to it, 
            // and when you create a NEW note while that filter is active, it auto-tags it.
            // OR simpler: Just allow typing a new tag name to filter by it (and potentially tag new notes).

            // Actually, best approach: Just allow filtering by existing tags + show input to "Filter/Create".
            // If they create a tag, where does it go?
            // "notes with no tag will get into archived after 30 days" implies automatic handling.
            // "any tag can be customise"

            // Let's stick to: Visual Tag List + "New Tag" button that just lets you filter by a new tag (implied creation) 
            // OR allows adding a tag to a *Note*? 
            // The request says "create tag in the full screen".
            // I will make it so you can add a tag to the *active view*?
            // Re-reading: "any tag can be customise"

            // I'll add a simple way: 
            // 1. "Add Tag" button in header.
            // 2. Click it -> Input shows.
            // 3. Enter -> Adds to a `customTags` local state or just allows it to be used.
            // Since I can't easily change the note structure without database refactor, 
            // I'll just rely on tags present in notes + this ephemeral list.

            setSelectedTag(newTagInput.trim())
            setNewTagInput('')
            setIsAddingTag(false)
        }
    }

    // Handing tag assignment to note: we need a way to Tag a note.
    // I'll add a "+" button on the NOTE card to add a tag.
    const addTagToNote = (noteId: string, tag: string) => {
        const note = notes.find(n => n.id === noteId)
        if (note && !note.tags.includes(tag)) {
            updateNote(noteId, { tags: [...note.tags, tag] })
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 bg-drawer-bg z-20 flex flex-col p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-drawer-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-drawer-surface border border-drawer-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-drawer-text-muted transition-colors"
                        autoFocus
                    />
                </div>

                {/* Menu Toggle */}
                <button
                    onClick={() => setMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-lg transition-colors ${view === 'archived' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-drawer-surface text-drawer-text-muted'}`}
                >
                    {view === 'archived' ? <Archive size={20} /> : <MoreHorizontal size={20} />}
                </button>

                <button
                    onClick={() => setNotesOpen(false)}
                    className="p-2 hover:bg-drawer-surface rounded-lg transition-colors text-drawer-text-muted hover:text-drawer-text"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Menu / Tags Bar */}
            <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen || view === 'archived' ? 'mb-4' : 'mb-0 h-0'}`}>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center">
                    <button
                        onClick={() => { setView('all'); setSelectedTag(null) }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${view === 'all' && !selectedTag ? 'bg-drawer-text text-drawer-bg border-drawer-text' : 'bg-transparent border-drawer-border text-drawer-text-muted hover:border-drawer-text'
                            }`}
                    >
                        All Notes
                    </button>
                    <button
                        onClick={() => { setView('archived'); setSelectedTag(null) }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${view === 'archived' ? 'bg-drawer-text text-drawer-bg border-drawer-text' : 'bg-transparent border-drawer-border text-drawer-text-muted hover:border-drawer-text'
                            }`}
                    >
                        <Archive size={12} className="inline mr-1" />
                        Archived
                    </button>
                    <div className="w-[1px] bg-drawer-border h-6 mx-1 my-auto" />
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => { setView('all'); setSelectedTag(selectedTag === tag ? null : tag) }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedTag === tag ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent border-drawer-border text-drawer-text-muted hover:border-drawer-text'
                                }`}
                        >
                            <Tag size={12} className="inline mr-1" />
                            {tag}
                        </button>
                    ))}

                    {/* Add Tag Button */}
                    {isAddingTag ? (
                        <input
                            ref={tagInputRef}
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            onBlur={() => setIsAddingTag(false)}
                            placeholder="New Tag..."
                            className="px-3 py-1.5 rounded-full text-xs bg-drawer-surface border border-drawer-text-muted focus:outline-none focus:border-drawer-text min-w-[80px]"
                        />
                    ) : (
                        <button
                            onClick={() => setIsAddingTag(true)}
                            className="px-2 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border bg-transparent border-dashed border-drawer-text-muted text-drawer-text-muted hover:border-drawer-text hover:text-drawer-text flex items-center"
                        >
                            <Plus size={12} className="mr-1" /> New Tag
                        </button>
                    )}

                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {filteredNotes.length === 0 ? (
                    <div className="text-center text-drawer-text-muted mt-10 text-sm">
                        {view === 'archived' ? "No archived notes" : "No notes found"}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredNotes.map((note) => (
                            <div key={note.id} className="group relative bg-drawer-surface/50 border border-transparent hover:border-drawer-border rounded-xl p-4 transition-all hover:bg-drawer-surface break-words">
                                <p className="text-sm text-drawer-text line-clamp-4 leading-relaxed mb-6">
                                    {renderTextWithLinks(note.content)}
                                </p>

                                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-1 flex-wrap">
                                        {note.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-drawer-bg px-1.5 py-0.5 rounded text-drawer-text-muted border border-drawer-border">
                                                #{tag}
                                            </span>
                                        ))}
                                        {/* Quick Tag Add on Note (Optional, but nice) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const tag = prompt("Add tag:")
                                                if (tag) addTagToNote(note.id, tag)
                                            }}
                                            className="text-[10px] bg-drawer-bg px-1.5 py-0.5 rounded text-drawer-text-muted border border-dashed border-drawer-text-muted hover:border-drawer-text hover:text-drawer-text"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleArchiveToggle(note.id, note.isArchived) }}
                                            className="p-1.5 hover:bg-drawer-bg rounded text-drawer-text-muted hover:text-blue-500 transition-colors"
                                            title={note.isArchived ? "Unarchive" : "Archive"}
                                        >
                                            <Archive size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                                            className="p-1.5 hover:bg-drawer-bg rounded text-drawer-text-muted hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default Notes
