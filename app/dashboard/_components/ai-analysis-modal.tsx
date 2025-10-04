
'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AIAnalysisModalProps {
  month: number
  year: number
  onClose: () => void
}

export default function AIAnalysisModal({ month, year, onClose }: AIAnalysisModalProps) {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setAnalysis('')

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error?.error || 'Erro ao analisar gastos')
        setIsLoading(false)
        return
      }

      const reader = res?.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('Stream não disponível')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setIsLoading(false)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed?.choices?.[0]?.delta?.content || ''
              if (content) {
                buffer += content
                setAnalysis(buffer)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao analisar:', error)
      toast.error('Erro ao processar análise')
      setIsLoading(false)
    }
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Análise Inteligente</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!analysis && !isLoading && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Análise com IA dos seus gastos
              </h3>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para receber uma análise personalizada e dicas de economia
                para o mês de {monthNames[month - 1]} de {year}.
              </p>
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Analisar Meus Gastos
              </button>
            </div>
          )}

          {isLoading && !analysis && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Analisando seus gastos...</p>
            </div>
          )}

          {analysis && (
            <div className="prose prose-blue max-w-none">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {analysis}
                </div>
                {isLoading && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Gerando análise...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {analysis && !isLoading && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
