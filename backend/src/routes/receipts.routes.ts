import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get receipts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
            where.clientId = client.id;
        } else if (req.query.clientId) {
            where.clientId = req.query.clientId as string;
        }

        const receipts = await prisma.receipt.findMany({
            where,
            include: {
                client: { include: { user: { select: { name: true, email: true } } } },
                boleto: true,
            },
            orderBy: { issueDate: 'desc' },
        });

        res.json(receipts);
    } catch (error) {
        console.error('Get receipts error:', error);
        res.status(500).json({ error: 'Erro ao buscar recibos' });
    }
});

// Create receipt (Admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { clientId, number, amount, description, issueDate, boletoId } = req.body;

        const receipt = await prisma.receipt.create({
            data: {
                clientId,
                number,
                amount,
                description,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                boletoId,
            },
        });

        res.status(201).json(receipt);
    } catch (error) {
        console.error('Create receipt error:', error);
        res.status(500).json({ error: 'Erro ao criar recibo' });
    }
});

export default router;
