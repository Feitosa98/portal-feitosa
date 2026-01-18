import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { boletoService } from '../services/boleto.service';

const router = Router();
const prisma = new PrismaClient();

// Get boletos
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

        const boletos = await prisma.boleto.findMany({
            where,
            include: {
                client: { include: { user: { select: { name: true, email: true } } } },
                receipt: true,
            },
            orderBy: { dueDate: 'desc' },
        });

        res.json(boletos);
    } catch (error) {
        console.error('Get boletos error:', error);
        res.status(500).json({ error: 'Erro ao buscar boletos' });
    }
});

// Create boleto (Admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { clientId, number, amount, dueDate, description } = req.body;

        const boleto = await prisma.boleto.create({
            data: {
                clientId,
                number,
                amount: Number(amount),
                dueDate: new Date(dueDate),
                description,
            },
            include: {
                client: {
                    include: { user: true }
                }
            }
        });

        // Generate PDF and update boleto with details
        const boletoData = await boletoService.generate({
            clientId,
            amount: Number(amount),
            dueDate: new Date(dueDate),
            description,
            clientInfo: {
                name: boleto.client.user.name,
                cpfCnpj: boleto.client.cpfCnpj,
                email: boleto.client.user.email,
            }
        });

        // Update boleto with generated PDF URL and barcode
        const updatedBoleto = await prisma.boleto.update({
            where: { id: boleto.id },
            data: {
                barcode: boletoData.barcode,
                digitableLine: boletoData.digitableLine,
                pdfUrl: boletoData.pdfUrl,
            }
        });

        res.status(201).json(updatedBoleto);
    } catch (error: any) {
        console.error('Create boleto error:', error);
        res.status(500).json({ error: 'Erro ao criar boleto', details: error.message });
    }
});

// Update boleto status (Admin only)
router.patch('/:id/status', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, paymentDate, paidAmount } = req.body;

        const boleto = await prisma.boleto.update({
            where: { id },
            data: {
                status,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                paidAmount,
            },
        });

        res.json(boleto);
    } catch (error) {
        console.error('Update boleto status error:', error);
        res.status(500).json({ error: 'Erro ao atualizar status do boleto' });
    }
});

export default router;
