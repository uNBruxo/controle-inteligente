import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// Tipagem para gastos
interface Expense {
  amount: number
  description?: string
  category?: { name: string } | null
  date: Date
}

// Função para gerar CSV a partir de expenses
function generateCSV(expenses: Expense[], month: number, year: number) {
  const headers = ['Data', 'Descrição', 'Categoria', 'Valor']
  const rows = expenses.map((expense: Expense) => [
    new Date(expense.date).toLocaleDateString('pt-BR'),
    `"${expense.description || ''}"`,
    expense.category?.name || 'Sem categoria',
    expense.amount
  ])
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  return csvContent
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { month, year, action } = await req.json() as { month: number, year: number, action?: 'csv' | 'ai' }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const expenses: Expense[] = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate, lte: endDate }
      },
      include: { category: true },
      orderBy: { date: 'desc' }
    })

    if (expenses.length === 0) {
      return NextResponse.json({ error: 'Nenhum gasto encontrado para este mês' }, { status: 400 })
    }

    // Se a ação for exportar CSV
    if (action === 'csv') {
      const csv = generateCSV(expenses, month, year)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="gastos_${month}_${year}.csv"`
        }
      })
    }

    // Caso contrário, gerar análise de IA
    const groupedExpenses: Record<string, { total: number; count: number }> = {}
    let totalAmount = 0
    expenses.forEach((expense: Expense) => {
      const categoryName = expense.category?.name || 'Sem categoria'
      if (!groupedExpenses[categoryName]) groupedExpenses[categoryName] = { total: 0, count: 0 }
      groupedExpenses[categoryName].total += expense.amount || 0
      groupedExpenses[categoryName].count += 1
      totalAmount += expense.amount || 0
    })

    const expensesSummary = Object.entries(groupedExpenses)
      .map(([category, data]) => {
        const percentage = (data.total / totalAmount) * 100
        return `- ${category}: R$ ${data.total.toFixed(2)} (${percentage.toFixed(1)}% do total, ${data.count} gastos)`
      })
      .join('\n')

    const prompt = `Você é um consultor financeiro experiente. Analise os gastos do usuário e forneça uma análise personalizada e prática.

**Gastos do mês:**
Total gasto: R$ ${totalAmount.toFixed(2)}
Número de transações: ${expenses.length}

**Divisão por categoria:**
${expensesSummary}

**Sua tarefa:**
1. Analise o padrão de gastos do usuário
2. Identifique as categorias que mais consomem o orçamento
3. Forneça 3-5 dicas práticas e específicas para economizar
4. Seja encorajador e positivo
5. Use linguagem clara e amigável

Forneça uma análise completa e útil em português brasileiro.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 1500
      })
    })

    if (!response.ok) throw new Error('Erro ao chamar API de IA')

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined }
            if (done) break
            controller.enqueue(encoder.encode(decoder.decode(value)))
          }
        } catch (err) {
          console.error('Erro no stream:', err)
          controller.error(err)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Erro na análise/exportação:', error)
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}
