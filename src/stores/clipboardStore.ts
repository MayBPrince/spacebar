import { create } from 'zustand'

export interface ClipboardItem {
    id: string
    type: 'text' | 'image' | 'files'
    content: string
    timestamp: number
    pinned: boolean
    category?: string
}

interface ClipboardState {
    history: ClipboardItem[]
    setHistory: (history: ClipboardItem[]) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    selectedCategory: string | null
    setSelectedCategory: (category: string | null) => void
}

export const useClipboardStore = create<ClipboardState>((set) => ({
    history: [],
    setHistory: (history) => set({ history }),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    selectedCategory: null,
    setSelectedCategory: (category) => set({ selectedCategory: category }),
}))
