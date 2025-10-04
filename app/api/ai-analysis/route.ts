
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { month, year } = await req.json()

    // Buscar gastos do mês especificado
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    if (expenses?.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum gasto encontrado para este mês' },
        { status: 400 }
      )
    }

    // Agrupar gastos por categoria
    const groupedExpenses: Record<string, { total: number; count: number }> = {}
    let totalAmount = 0

    expenses.forEach((expense) => {
      const categoryName = expense?.category?.name || 'Sem categoria'
      if (!groupedExpenses[categoryName]) {
        groupedExpenses[categoryName] = { total: 0, count: 0 }
      }
      groupedExpenses[categoryName].total += expense?.amount || 0
      groupedExpenses[categoryName].count += 1
      totalAmount += expense?.amount || 0
    })

    // Preparar dados para a IA
    const expensesSummary = Object.entries(groupedExpenses)
      .map(([category, data]) => {
        const percentage = ((data?.total || 0) / totalAmount) * 100
        return `- ${category}: R$ ${(data?.total || 0).toFixed(2)} (${percentage.toFixed(1)}% do total, ${data?.count} gastos)`
      })
      .join('\n')

    const prompt = `Você é um consultor financeiro experiente. Analise os gastos do usuário e forneça uma análise personalizada e prática.

**Gastos do mês:**
Total gasto: R$ ${totalAmount.toFixed(2)}
Número de transações: ${expenses?.length || 0}

**Divisão por categoria:**
${expensesSummary}

**Sua tarefa:**
1. Analise o padrão de gastos do usuário
2. Identifique as categorias que mais consomem o orçamento
3. Forneça 3-5 dicas práticas e específicas para economizar
4. Seja encorajador e positivo
5. Use linguagem clara e amigável

Forneça uma análise completa e útil em português brasileiro.`

    // Chamar a API da OpenAI com streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao chamar API de IA')
    }

    // Criar stream para retornar ao cliente
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined }
            if (done) break

            const chunk = decoder.decode(value)
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error('Erro no stream:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Erro na análise de IA:', error)
    return NextResponse.json(
      { error: 'Erro ao processar análise' },
      { status: 500 }
    )
  }
}
