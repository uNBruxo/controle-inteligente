
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { amount, description, categoryId, date } = await req.json()
    const { id } = params

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense || expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Gasto não encontrado' }, { status: 404 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : expense.amount,
        description: description ?? expense.description,
        categoryId: categoryId ?? expense.categoryId,
        date: date ? new Date(date) : expense.date,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Erro ao atualizar gasto:', error)
    return NextResponse.json({ error: 'Erro ao atualizar gasto' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense || expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Gasto não encontrado' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Gasto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir gasto:', error)
    return NextResponse.json({ error: 'Erro ao excluir gasto' }, { status: 500 })
  }
}
