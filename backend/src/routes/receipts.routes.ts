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

// Regenerate receipt PDF (Admin only)
router.post('/:id/regenerate', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                client: { include: { user: { select: { name: true, email: true, cpf: true } } } },
                boleto: true,
            },
        });

        if (!receipt) {
            return res.status(404).json({ error: 'Recibo não encontrado' });
        }

        const { receiptService } = require('../services/receipt.service');

        // Prepare data for receipt generation
        // Note: For older receipts, we might not have all item details if they weren't stored structurally.
        // We will infer from description or use default.

        let items = [];
        if (receipt.boleto?.description) {
            items.push({
                name: receipt.boleto.description,
                quantity: 1,
                unit: 'un',
                unitPrice: receipt.amount,
                totalPrice: receipt.amount
            });
        } else {
            // Fallback
            items.push({
                name: receipt.description || 'Serviços de Informática',
                quantity: 1,
                unit: 'un',
                unitPrice: receipt.amount,
                totalPrice: receipt.amount
            });
        }

        const fileName = `REC${Date.now()}.pdf`;
        const filePath = `uploads/receipts/${fileName}`;

        await receiptService.generatePDF(
            {
                clientId: receipt.clientId,
                amount: receipt.amount,
                description: receipt.description || 'Pagamento recebido',
                clientInfo: {
                    name: receipt.client.user.name,
                    companyName: receipt.client.companyName || undefined,
                    cnpj: receipt.client.cnpj || undefined,
                    cpf: receipt.client.cpf || receipt.client.user.cpf || undefined, // Adjust based on user schema if needed
                    address: receipt.client.address || undefined,
                    city: receipt.client.city || undefined,
                    state: receipt.client.state || undefined,
                    zipCode: receipt.client.zipCode || undefined,
                },
                items,
                paymentDate: receipt.issueDate,
                receiptNumber: receipt.number,
            },
            filePath
        );

        // Update receipt record with new path
        const updatedReceipt = await prisma.receipt.update({
            where: { id },
            data: { pdfPath: filePath },
        });

        res.json(updatedReceipt);

    } catch (error) {
        console.error('Regenerate receipt error:', error);
        res.status(500).json({ error: 'Erro ao regenerar recibo' });
    }
});

export default router;
