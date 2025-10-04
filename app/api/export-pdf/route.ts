
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

    // Agrupar por categoria
    const groupedExpenses: Record<string, number> = {}
    let totalAmount = 0

    expenses.forEach((expense) => {
      const categoryName = expense?.category?.name || 'Sem categoria'
      if (!groupedExpenses[categoryName]) {
        groupedExpenses[categoryName] = 0
      }
      groupedExpenses[categoryName] += expense?.amount || 0
      totalAmount += expense?.amount || 0
    })

    // Criar HTML simples para PDF
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Gastos - ${monthName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #3b82f6; color: white; }
    .summary { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: #3b82f6; }
  </style>
</head>
<body>
  <h1>Meu Orçamento Inteligente</h1>
  <h2>Relatório de Gastos - ${monthName}</h2>
  
  <div class="summary">
    <p><strong>Período:</strong> ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}</p>
    <p><strong>Total de gastos:</strong> ${expenses?.length || 0}</p>
    <p class="total">Total gasto: R$ ${totalAmount.toFixed(2)}</p>
  </div>

  <h3>Gastos por Categoria</h3>
  <table>
    <thead>
      <tr>
        <th>Categoria</th>
        <th>Total</th>
        <th>Porcentagem</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(groupedExpenses)
        .map(([category, total]) => {
          const percentage = ((total / totalAmount) * 100).toFixed(1)
          return `
            <tr>
              <td>${category}</td>
              <td>R$ ${total.toFixed(2)}</td>
              <td>${percentage}%</td>
            </tr>
          `
        })
        .join('')}
    </tbody>
  </table>

  <h3>Detalhamento dos Gastos</h3>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Descrição</th>
        <th>Categoria</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
      ${expenses
        .map((expense) => `
          <tr>
            <td>${new Date(expense?.date).toLocaleDateString('pt-BR')}</td>
            <td>${expense?.description}</td>
            <td>${expense?.category?.name}</td>
            <td>R$ ${(expense?.amount || 0).toFixed(2)}</td>
          </tr>
        `)
        .join('')}
    </tbody>
  </table>
</body>
</html>
    `

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
