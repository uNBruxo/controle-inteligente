
'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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

interface PieChartProps {
  expenses: Expense[]
}

export default function PieChartComponent({ expenses }: PieChartProps) {
  const chartData = useMemo(() => {
    const grouped: Record<string, { name: string; value: number; color: string }> = {}

    expenses?.forEach((expense) => {
      const categoryName = expense?.category?.name || 'Sem categoria'
      const categoryColor = expense?.category?.color || '#60B5FF'
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          name: categoryName,
          value: 0,
          color: categoryColor,
        }
      }
      grouped[categoryName].value += expense?.amount || 0
    })

    return Object.values(grouped).sort((a, b) => (b?.value || 0) - (a?.value || 0))
  }, [expenses])

  if (chartData?.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500">
        Nenhum dado para exibir
      </div>
    )
  }

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry?.value / chartData?.reduce((sum, item) => sum + (item?.value || 0), 0)) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry?.color || '#60B5FF'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
          contentStyle={{ fontSize: 11 }}
        />
        <Legend
          verticalAlign="top"
          align="center"
          wrapperStyle={{ fontSize: 11, paddingBottom: 20 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
