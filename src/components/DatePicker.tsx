import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface DatePickerProps {
    onSelect: (date: string) => void
    onClose: () => void
}

const DatePicker = ({ onSelect, onClose }: DatePickerProps) => {
    const [currentDate, setCurrentDate] = useState(new Date())

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

    const checkIsToday = (day: number) => {
        const today = new Date()
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
    }

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const handleDateClick = (e: React.MouseEvent, day: number) => {
        e.stopPropagation()
        // Format date as "10 Mar 26" or "Today"
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        const today = new Date()

        let dateString = ""
        if (date.toDateString() === today.toDateString()) {
            dateString = "Today"
        } else {
            // Check if it's tomorrow
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            if (date.toDateString() === tomorrow.toDateString()) {
                dateString = "Tomorrow"
            } else {
                dateString = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
            }
        }

        onSelect(dateString)
        onClose()
    }

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-2 bg-drawer-surface border border-drawer-border rounded-xl shadow-2xl z-50 p-4 w-64 select-none"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-drawer-text">{monthName}</span>
                <div className="flex gap-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-drawer-surface-hover rounded-md text-drawer-text-muted hover:text-drawer-text transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-drawer-surface-hover rounded-md text-drawer-text-muted hover:text-drawer-text transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-[10px] font-medium text-drawer-text-muted uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isToday = checkIsToday(day)
                    return (
                        <button
                            key={day}
                            onClick={(e) => handleDateClick(e, day)}
                            className={`
                                h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-colors
                                ${isToday ? 'bg-blue-500 text-white font-bold' : 'text-drawer-text hover:bg-drawer-surface-hover'}
                            `}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-drawer-border flex justify-between">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect("Today")
                        onClose()
                    }}
                    className="text-xs text-blue-500 hover:text-blue-400 font-medium"
                >
                    Today
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect("No Date")
                        onClose()
                    }}
                    className="text-xs text-drawer-text-muted hover:text-drawer-text"
                >
                    Remove
                </button>
            </div>
        </motion.div>
    )
}

export default DatePicker
