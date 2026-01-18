import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get invoices (filtered by client if not admin)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        // If not admin, filter by client
        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }
            where.clientId = client.id;
        } else if (req.query.clientId) {
            where.clientId = req.query.clientId as string;
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                client: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { issueDate: 'desc' },
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Erro ao buscar notas fiscais' });
    }
});

// Get invoice by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: id as string },
            include: {
                client: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Nota fiscal não encontrada' });
        }

        // Authorization check
        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client || invoice.clientId !== client.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Erro ao buscar nota fiscal' });
    }
});

// Create invoice (Admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { clientId, number, series, amount, description, issueDate } = req.body;

        const invoice = await prisma.invoice.create({
            data: {
                clientId,
                number,
                series,
                amount,
                description,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
            },
            include: {
                client: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Erro ao criar nota fiscal' });
    }
});

// Update invoice (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { number, series, amount, description, nfeKey, nfeXml, nfePdf } = req.body;

        const invoice = await prisma.invoice.update({
            where: { id: id as string },
            data: {
                number,
                series,
                amount,
                description,
                nfeKey,
                nfeXml,
                nfePdf,
            },
        });

        res.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Erro ao atualizar nota fiscal' });
    }
});

// Delete invoice (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.invoice.delete({ where: { id: id as string } });

        res.json({ message: 'Nota fiscal deletada com sucesso' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: 'Erro ao deletar nota fiscal' });
    }
});

export default router;
