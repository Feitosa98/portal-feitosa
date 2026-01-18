import { PrismaClient } from '@prisma/client';
import { nfeService } from './nfe.service';
import { emailService } from './email.service';

const prisma = new PrismaClient();

/**
 * Automation Service
 * Handles automatic generation of receipts and invoices after payment confirmation
 */

class AutomationService {
    /**
     * Process payment confirmation and trigger automation
     */
    async processPayment(confirmationId: string): Promise<void> {
        try {
            const confirmation = await prisma.paymentConfirmation.findUnique({
                where: { id: confirmationId },
            });

            if (!confirmation) {
                throw new Error('Confirmação de pagamento não encontrada');
            }

            const boleto = await prisma.boleto.findUnique({
                where: { id: confirmation.boletoId },
                include: {
                    client: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (!boleto) {
                throw new Error('Boleto não encontrado');
            }

            // 1. Generate Receipt
            if (!confirmation.receiptGenerated) {
                await this.generateReceipt(confirmation, boleto);
            }

            // 2. Generate Invoice (NF-e)
            if (!confirmation.invoiceGenerated) {
                await this.generateInvoice(confirmation, boleto);
            }

            console.log('Payment automation completed for confirmation:', confirmationId);
        } catch (error) {
            console.error('Payment automation error:', error);
            throw error;
        }
    }

    /**
     * Generate receipt automatically
     */
    private async generateReceipt(confirmation: any, boleto: any): Promise<void> {
        try {
            const receiptNumber = `REC-${Date.now()}`;

            const receipt = await prisma.receipt.create({
                data: {
                    clientId: boleto.clientId,
                    boletoId: boleto.id,
                    number: receiptNumber,
                    amount: confirmation.amount,
                    description: boleto.description || 'Pagamento recebido',
                    issueDate: confirmation.paymentDate,
                },
            });

            // Update confirmation
            await prisma.paymentConfirmation.update({
                where: { id: confirmation.id },
                data: { receiptGenerated: true },
            });

            // Send email
            try {
                await emailService.sendReceipt(
                    boleto.client.user.email,
                    `/api/receipts/${receipt.id}`,
                    receiptNumber
                );
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
            }

            console.log('Receipt generated:', receiptNumber);
        } catch (error) {
            console.error('Receipt generation error:', error);
            throw error;
        }
    }

    /**
     * Generate invoice (NF-e) automatically
     */
    private async generateInvoice(confirmation: any, boleto: any): Promise<void> {
        try {
            // Generate NF-e via service
            const nfeData = await nfeService.generate({
                clientId: boleto.clientId,
                amount: confirmation.amount,
                description: boleto.description || 'Serviços prestados',
            });

            // Save invoice to database
            const invoice = await prisma.invoice.create({
                data: {
                    clientId: boleto.clientId,
                    number: nfeData.number,
                    series: nfeData.series,
                    amount: confirmation.amount,
                    description: boleto.description,
                    nfeKey: nfeData.key,
                    nfeXml: nfeData.xml,
                    nfePdf: nfeData.pdfUrl,
                    issueDate: confirmation.paymentDate,
                },
            });

            // Update confirmation
            await prisma.paymentConfirmation.update({
                where: { id: confirmation.id },
                data: { invoiceGenerated: true },
            });

            // Send email
            try {
                if (boleto.client?.user?.email) {
                    await emailService.sendInvoice(
                        boleto.client.user.email,
                        nfeData.pdfUrl,
                        nfeData.number
                    );
                }
            } catch (emailError) {
                console.error('Failed to send invoice email:', emailError);
            }

            console.log('Invoice generated:', nfeData.number);
        } catch (error) {
            console.error('Invoice generation error:', error);
            throw error;
        }
    }
}

export const automationService = new AutomationService();
