
'use client'

import dynamic from 'next/dynamic'

const PieChart = dynamic(() => import('./pie-chart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
})

interface Category {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  amount: number
  category: Category
}

interface ExpensesChartProps {
  expenses: Expense[]
}

export default function ExpensesChart({ expenses }: ExpensesChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gastos por Categoria</h2>
      <PieChart expenses={expenses} />
    </div>
  )
}
