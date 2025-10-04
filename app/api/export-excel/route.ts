
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

    // Criar CSV
    const headers = ['Data', 'Descrição', 'Categoria', 'Valor']
    const rows = expenses.map((expense) => [
      new Date(expense?.date).toLocaleDateString('pt-BR'),
      `"${expense?.description}"`,
      expense?.category?.name,
      (expense?.amount || 0).toFixed(2),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    // Adicionar BOM para UTF-8
    const bom = '\uFEFF'
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gastos-${month}-${year}.csv"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar Excel:', error)
    return NextResponse.json({ error: 'Erro ao gerar Excel' }, { status: 500 })
  }
}
