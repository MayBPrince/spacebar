export function formatRelativeDate(dateInput: string | number | Date): string {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return 'Today'

    const now = new Date()
    // Reset hours to compare dates only
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffTime = d1.getTime() - d2.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays === -1) return 'Tomorrow'

    if (diffDays > 0) {
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return date.toLocaleDateString()
    } else {
        const aheadDays = Math.abs(diffDays)
        if (aheadDays < 7) return `${aheadDays} days ahead`
        if (aheadDays < 30) return `${Math.floor(aheadDays / 7)} weeks ahead`
        return date.toLocaleDateString()
    }
}
