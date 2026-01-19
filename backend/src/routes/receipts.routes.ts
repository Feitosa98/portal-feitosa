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
            where.clientId = String(req.query.clientId);
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
        const receiptId = Array.isArray(id) ? id[0] : id;

        const receipt = await prisma.receipt.findUnique({
            where: { id: receiptId },
            include: {
                client: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                boleto: true,
            },
        });

        if (!receipt) {
            return res.status(404).json({ error: 'Recibo não encontrado' });
        }

        const { receiptService } = require('../services/receipt.service');

        // Prepare data for receipt generation
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

        // Safely access properties that we know exist due to 'include'
        // Prisma return types can be tricky, so we rely on the runtime check above (!receipt)
        const clientData = receipt.client;
        const userData = clientData.user;

        await receiptService.generatePDF(
            {
                clientId: receipt.clientId,
                amount: receipt.amount,
                description: receipt.description || 'Pagamento recebido',
                clientInfo: {
                    name: userData.name,
                    companyName: clientData.companyName || undefined,
                    cnpj: clientData.cnpj || undefined,
                    cpf: clientData.cpf || undefined,
                    address: clientData.address || undefined,
                    city: clientData.city || undefined,
                    state: clientData.state || undefined,
                    zipCode: clientData.zipCode || undefined,
                },
                items,
                paymentDate: receipt.issueDate,
                receiptNumber: receipt.number,
            },
            filePath
        );

        // Update receipt record with new path
        const updatedReceipt = await prisma.receipt.update({
            where: { id: receiptId },
            data: { pdfPath: filePath },
        });

        res.json(updatedReceipt);

    } catch (error) {
        console.error('Regenerate receipt error:', error);
        res.status(500).json({ error: 'Erro ao regenerar recibo' });
    }
});

export default router;
