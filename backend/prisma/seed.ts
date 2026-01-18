import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@portal.com';
    const hashedPassword = await bcrypt.hash('senha123', 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                active: true,
            },
        });
        console.log('Admin user created/verified:', user.email);
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
