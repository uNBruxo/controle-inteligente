
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

    const { name, color, icon } = await req.json()
    const { id } = params

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Não é possível editar categorias padrão' },
        { status: 400 }
      )
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? category.name,
        color: color ?? category.color,
        icon: icon ?? category.icon,
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Não é possível excluir categorias padrão' },
        { status: 400 }
      )
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (category?.expenses?.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir categoria com gastos associados' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Categoria excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
  }
}
