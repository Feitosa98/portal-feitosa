import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { automationService } from '../services/automation.service';

const router = Router();
const prisma = new PrismaClient();

// Confirm payment and trigger automation (Admin only)
router.post('/confirm', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { boletoId, amount, paymentDate } = req.body;

        // Create payment confirmation
        const confirmation = await prisma.paymentConfirmation.create({
            data: {
                boletoId,
                amount,
                paymentDate: new Date(paymentDate),
            },
        });

        // Update boleto status
        await prisma.boleto.update({
            where: { id: boletoId },
            data: {
                status: 'PAID',
                paymentDate: new Date(paymentDate),
                paidAmount: amount,
            },
        });

        // Trigger automation (generate receipt and invoice)
        try {
            await automationService.processPayment(confirmation.id);
        } catch (error) {
            console.error('Automation error:', error);
            // Continue even if automation fails
        }

        res.status(201).json(confirmation);
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Erro ao confirmar pagamento' });
    }
});

// Get payment confirmations (Admin only)
router.get('/confirmations', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const confirmations = await prisma.paymentConfirmation.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json(confirmations);
    } catch (error) {
        console.error('Get confirmations error:', error);
        res.status(500).json({ error: 'Erro ao buscar confirmações' });
    }
});

/**
 * Webhook Simulation Endpoint
 * This bypasses auth to simulate an external service call, 
 * but for security in production, you should verify a signature header.
 */
router.post('/webhook', async (req: AuthRequest, res: Response) => {
    try {
        const { externalId, paymentDate, amount } = req.body;

        console.log('Webhook received:', req.body);

        const boleto = await prisma.boleto.findUnique({
            where: { number: externalId }, // Using number as externalId for simplicity in simulation
        });

        if (!boleto) {
            return res.status(404).json({ error: 'Boleto not found' });
        }

        if (boleto.status === 'PAID') {
            return res.status(200).json({ message: 'Already paid' });
        }

        // Create payment confirmation
        const confirmation = await prisma.paymentConfirmation.create({
            data: {
                boletoId: boleto.id,
                amount: Number(amount),
                paymentDate: new Date(paymentDate),
            },
        });

        // Update boleto status
        await prisma.boleto.update({
            where: { id: boleto.id },
            data: {
                status: 'PAID',
                paymentDate: new Date(paymentDate),
                paidAmount: Number(amount),
            },
        });

        // Trigger automation
        automationService.processPayment(confirmation.id).catch(err => {
            console.error('Automation error in webhook:', err);
        });

        res.status(200).json({ message: 'Webhook processed', confirmationId: confirmation.id });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
