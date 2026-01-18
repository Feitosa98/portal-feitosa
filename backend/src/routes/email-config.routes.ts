import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get email config (Admin only)
router.get('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const config = await prisma.emailConfig.findFirst({
            where: { active: true },
        });

        if (!config) {
            return res.status(404).json({ error: 'Configuração de email não encontrada' });
        }

        // Don't send password to frontend
        const { password, ...safeConfig } = config;

        res.json(safeConfig);
    } catch (error) {
        console.error('Get email config error:', error);
        res.status(500).json({ error: 'Erro ao buscar configuração de email' });
    }
});

// Create or update email config (Admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { host, port, user, password, from, secure } = req.body;

        // Deactivate all existing configs
        await prisma.emailConfig.updateMany({
            data: { active: false },
        });

        // Create new config
        const config = await prisma.emailConfig.create({
            data: {
                host,
                port,
                user,
                password,
                from,
                secure,
                active: true,
            },
        });

        const { password: _, ...safeConfig } = config;

        res.status(201).json(safeConfig);
    } catch (error) {
        console.error('Create email config error:', error);
        res.status(500).json({ error: 'Erro ao criar configuração de email' });
    }
});

export default router;
