import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { username: 'QuickTiger89', password: 'dev', showWeightPublicly: false },
    { username: 'BraveWolf42', password: 'dev', showWeightPublicly: false },
    { username: 'SwiftPanda23', password: 'dev', showWeightPublicly: true },
  ]

  const created = []
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    })
    created.push(user)
  }

  const [u1, u2, u3] = created

  await prisma.activity.createMany({
    data: [
      { userId: u1.id, type: 'RUN', value: 3.5, unit: 'miles', notes: 'Morning jog' },
      { userId: u2.id, type: 'HYDRATION', value: 16, unit: 'oz' },
      { userId: u3.id, type: 'SWIM', value: 30, unit: 'minutes', notes: 'Pool laps' },
      { userId: u1.id, type: 'BIKE', value: 8, unit: 'miles' },
    ],
    skipDuplicates: true,
  })

  await prisma.weightLog.createMany({
    data: [
      { userId: u1.id, weight: 180, unit: 'lbs', isPublic: false },
      { userId: u3.id, weight: 150, unit: 'lbs', isPublic: true },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

