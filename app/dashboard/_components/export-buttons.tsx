
'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportButtonsProps {
  month: number
  year: number
}

export default function ExportButtons({ month, year }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const handleExportPDF = async () => {
    setIsExportingPDF(true)

    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })

      if (!res.ok) {
        toast.error('Erro ao exportar PDF')
        return
      }

      const data = await res.json()
      const html = data?.html

      // Abrir em nova janela para impressão
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        toast.success('PDF aberto! Use Ctrl+P para imprimir ou salvar')
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao exportar PDF')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)

    try {
      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })

      if (!res.ok) {
        toast.error('Erro ao exportar Excel')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gastos-${month}-${year}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Excel exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast.error('Erro ao exportar Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingPDF ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <FileDown className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">PDF</span>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingExcel ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">Excel</span>
      </button>
    </div>
  )
}
