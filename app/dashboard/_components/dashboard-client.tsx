
'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, Plus, Sparkles, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import ExpenseForm from './expense-form'
import ExpensesList from './expenses-list'
import ExpensesChart from './expenses-chart'
import AIAnalysisModal from './ai-analysis-modal'
import CategoriesModal from './categories-modal'
import ExportButtons from './export-buttons'
import MonthSelector from './month-selector'

interface User {
  id: string
  name: string
  email: string
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
  isDefault: boolean
}

interface Expense {
  id: string
  amount: number
  description: string
  date: string
  categoryId: string
  category: Category
}

export default function DashboardClient({ user }: { user: User }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear, filterCategory])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Buscar categorias
      const categoriesRes = await fetch('/api/categories')
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      // Buscar gastos do mês
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      if (filterCategory !== 'all') {
        params.append('categoryId', filterCategory)
      }

      const expensesRes = await fetch(`/api/expenses?${params.toString()}`)
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpenseAdded = () => {
    loadData()
    toast.success('Gasto adicionado com sucesso!')
  }

  const handleExpenseDeleted = () => {
    loadData()
    toast.success('Gasto excluído com sucesso!')
  }

  const handleExpenseUpdated = () => {
    loadData()
    toast.success('Gasto atualizado com sucesso!')
  }

  const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp?.amount || 0), 0) || 0
  const expensesCount = expenses?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Meu Orçamento Inteligente
                </h1>
                <p className="text-sm text-gray-600">Olá, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total do Mês</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              R$ {totalExpenses.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total de Gastos</span>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{expensesCount}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setShowAIModal(true)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Análise Inteligente</span>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-white text-lg font-semibold">
                Clique para analisar seus gastos com IA
              </p>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as categorias</option>
                {categories?.map((cat) => (
                  <option key={cat?.id} value={cat?.id}>
                    {cat?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
            >
              Gerenciar Categorias
            </button>
            <ExportButtons month={selectedMonth} year={selectedYear} />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form and List */}
          <div className="lg:col-span-2 space-y-8">
            <ExpenseForm
              categories={categories}
              onExpenseAdded={handleExpenseAdded}
            />
            <ExpensesList
              expenses={expenses}
              categories={categories}
              onExpenseDeleted={handleExpenseDeleted}
              onExpenseUpdated={handleExpenseUpdated}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Chart */}
          <div className="lg:col-span-1">
            <ExpensesChart expenses={expenses} />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAIModal && (
        <AIAnalysisModal
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setShowAIModal(false)}
        />
      )}

      {showCategoriesModal && (
        <CategoriesModal
          categories={categories}
          onClose={() => {
            setShowCategoriesModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
