
'use client'

import { useState } from 'react'
import { Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  amount: number
  description: string
  date: string
  categoryId: string
  category: Category
}

interface ExpensesListProps {
  expenses: Expense[]
  categories: Category[]
  onExpenseDeleted: () => void
  onExpenseUpdated: () => void
  isLoading: boolean
}

export default function ExpensesList({
  expenses,
  categories,
  onExpenseDeleted,
  onExpenseUpdated,
  isLoading,
}: ExpensesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (expense: Expense) => {
    setEditingId(expense?.id)
    setEditAmount(expense?.amount?.toString() || '')
    setEditDescription(expense?.description || '')
    setEditCategoryId(expense?.categoryId || '')
    setEditDate(new Date(expense?.date).toISOString().split('T')[0] || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount('')
    setEditDescription('')
    setEditCategoryId('')
    setEditDate('')
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          description: editDescription,
          categoryId: editCategoryId,
          date: editDate,
        }),
      })

      if (res.ok) {
        handleCancelEdit()
        onExpenseUpdated()
      } else {
        toast.error('Erro ao atualizar gasto')
      }
    } catch (error) {
      console.error('Erro ao atualizar gasto:', error)
      toast.error('Erro ao atualizar gasto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) {
      return
    }

    setDeletingId(id)

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onExpenseDeleted()
      } else {
        toast.error('Erro ao excluir gasto')
      }
    } catch (error) {
      console.error('Erro ao excluir gasto:', error)
      toast.error('Erro ao excluir gasto')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (expenses?.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gastos Recentes</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum gasto encontrado neste período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gastos Recentes</h2>
      
      <div className="space-y-3">
        {expenses?.map((expense) => {
          const isEditing = editingId === expense?.id
          const isDeleting = deletingId === expense?.id

          return (
            <div
              key={expense?.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Valor"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Descrição"
                  />
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {categories?.map((cat) => (
                      <option key={cat?.id} value={cat?.id}>
                        {cat?.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(expense?.id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: expense?.category?.color || '#60B5FF' }}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {expense?.category?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(expense?.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{expense?.description}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      R$ {(expense?.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense?.id)}
                      disabled={isDeleting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Excluir"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
