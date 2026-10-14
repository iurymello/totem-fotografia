import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Criando utilizador administrador inicial...');

  const adminEmail = 'iurymellofotografia@gmail.com';
  const hashedPassword = await bcrypt.hash('IuryMello2026!', 10); // Altere a palavra-passe aqui!

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      name: 'Iury Mello',
      password: hashedPassword,
    },
  });

  console.log(`✅ Administrador configurado com sucesso: ${admin.email}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());