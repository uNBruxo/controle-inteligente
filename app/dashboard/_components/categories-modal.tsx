
'use client'

import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  isDefault: boolean
}

interface CategoriesModalProps {
  categories: Category[]
  onClose: () => void
}

const COLORS = [
  '#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363',
  '#80D8C3', '#A19AD3', '#72BF78', '#FFB84D', '#A28FFF'
]

export default function CategoriesModal({ categories, onClose }: CategoriesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#60B5FF')

  const handleCreate = async () => {
    if (!newName) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, color: newColor }),
      })

      if (res.ok) {
        toast.success('Categoria criada!')
        setIsCreating(false)
        setNewName('')
        setNewColor('#60B5FF')
        onClose()
      } else {
        toast.error('Erro ao criar categoria')
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast.error('Erro ao criar categoria')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category?.id)
    setEditName(category?.name || '')
    setEditColor(category?.color || '#60B5FF')
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, color: editColor }),
      })

      if (res.ok) {
        toast.success('Categoria atualizada!')
        setEditingId(null)
        onClose()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao atualizar categoria')
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      toast.error('Erro ao atualizar categoria')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Categoria excluída!')
        onClose()
      } else {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao excluir categoria')
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Create New Category */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Plus className="w-5 h-5" />
              Criar Nova Categoria
            </button>
          ) : (
            <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da categoria"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              />
              <div className="flex gap-2 mb-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full ${newColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Criar
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                    setNewColor('#60B5FF')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                >
                  <XIcon className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3">
            {categories?.map((category) => {
              const isEditing = editingId === category?.id

              return (
                <div
                  key={category?.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome da categoria"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                      />
                      <div className="flex gap-2 mb-3">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`w-8 h-8 rounded-full ${editColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(category?.id)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                          <XIcon className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category?.color || '#60B5FF' }}
                        />
                        <span className="font-medium text-gray-900">{category?.name}</span>
                        {category?.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Padrão
                          </span>
                        )}
                      </div>
                      {!category?.isDefault && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category?.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
