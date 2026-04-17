import 'dotenv/config'
import bcrypt from 'bcrypt'
import { prisma } from './prisma.js'

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@kalenda.app'
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.log('⚠️  ADMIN_PASSWORD not set, skipping admin seed.')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✅ Admin user already exists: ${email}`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: {
      email,
      name: 'Administrator',
      password: hashed,
      role: 'ADMIN',
    },
  })

  console.log(`✅ Admin user created: ${email}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
