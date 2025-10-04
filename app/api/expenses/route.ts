
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')

    const where: any = { userId: session.user.id }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Erro ao buscar gastos:', error)
    return NextResponse.json({ error: 'Erro ao buscar gastos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { amount, description, categoryId, date } = await req.json()

    if (!amount || !description || !categoryId) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        categoryId,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar gasto:', error)
    return NextResponse.json({ error: 'Erro ao criar gasto' }, { status: 500 })
  }
}
