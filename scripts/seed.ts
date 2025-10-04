
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Criar conta teste padrão
  const hashedPassword = await bcrypt.hash('johndoe123', 10)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'john@doe.com',
      password: hashedPassword,
    },
  })

  console.log('Usuário teste criado:', testUser.email)

  // Criar categorias padrão
  const defaultCategories = [
    { name: 'Alimentação', color: '#FF9149', icon: 'utensils' },
    { name: 'Transporte', color: '#60B5FF', icon: 'car' },
    { name: 'Moradia', color: '#80D8C3', icon: 'home' },
    { name: 'Lazer', color: '#FF90BB', icon: 'smile' },
    { name: 'Saúde', color: '#FF6363', icon: 'heart' },
    { name: 'Educação', color: '#A19AD3', icon: 'book' },
  ]

  for (const cat of defaultCategories) {
    const category = await prisma.category.upsert({
      where: { 
        id: `default-${cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}` 
      },
      update: {},
      create: {
        id: `default-${cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: true,
        userId: null,
      },
    })
    console.log('Categoria criada:', category.name)
  }

  // Criar alguns gastos de exemplo para o usuário teste
  const categories = await prisma.category.findMany()
  
  const sampleExpenses = [
    {
      amount: 45.80,
      description: 'Supermercado - Compras da semana',
      date: new Date(2025, 9, 1),
      categoryId: categories.find(c => c.name === 'Alimentação')?.id || categories[0].id,
    },
    {
      amount: 15.00,
      description: 'Uber para o trabalho',
      date: new Date(2025, 9, 2),
      categoryId: categories.find(c => c.name === 'Transporte')?.id || categories[1].id,
    },
    {
      amount: 1200.00,
      description: 'Aluguel do mês',
      date: new Date(2025, 9, 1),
      categoryId: categories.find(c => c.name === 'Moradia')?.id || categories[2].id,
    },
    {
      amount: 80.00,
      description: 'Cinema com amigos',
      date: new Date(2025, 9, 3),
      categoryId: categories.find(c => c.name === 'Lazer')?.id || categories[3].id,
    },
  ]

  for (const expense of sampleExpenses) {
    await prisma.expense.create({
      data: {
        ...expense,
        userId: testUser.id,
      },
    })
  }

  console.log('Gastos de exemplo criados!')
  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro durante seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
