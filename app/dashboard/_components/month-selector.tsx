
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  selectedMonth: number
  selectedYear: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export default function MonthSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: MonthSelectorProps) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12)
      onYearChange(selectedYear - 1)
    } else {
      onMonthChange(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1)
      onYearChange(selectedYear + 1)
    } else {
      onMonthChange(selectedMonth + 1)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      
      <span className="text-sm font-semibold text-gray-900 min-w-[150px] text-center">
        {monthNames[selectedMonth - 1]} {selectedYear}
      </span>
      
      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
}
