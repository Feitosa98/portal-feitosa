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
            const receiptNumber = `${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${new Date().getFullYear().toString().slice(-2)}`;

            // Generate PDF using receipt service
            const { receiptService } = require('./receipt.service');
            const fileName = `REC${Date.now()}.pdf`;
            const filePath = `uploads/receipts/${fileName}`;

            // Parse description to extract items if available
            const items = [];
            if (boleto.description) {
                items.push({
                    name: boleto.description,
                    quantity: 1,
                    unit: 'un',
                    unitPrice: confirmation.amount,
                    totalPrice: confirmation.amount,
                });
            }

            await receiptService.generatePDF(
                {
                    clientId: boleto.clientId,
                    amount: confirmation.amount,
                    description: boleto.description || 'Pagamento recebido',
                    clientInfo: {
                        name: boleto.client.user.name,
                        companyName: boleto.client.companyName,
                        cnpj: boleto.client.cnpj,
                        cpf: boleto.client.cpf,
                        address: boleto.client.address,
                        city: boleto.client.city,
                        state: boleto.client.state,
                        zipCode: boleto.client.zipCode,
                    },
                    items,
                    paymentDate: confirmation.paymentDate,
                    receiptNumber,
                },
                filePath
            );

            const receipt = await prisma.receipt.create({
                data: {
                    clientId: boleto.clientId,
                    boletoId: boleto.id,
                    number: receiptNumber,
                    amount: confirmation.amount,
                    description: boleto.description || 'Pagamento recebido',
                    issueDate: confirmation.paymentDate,
                    pdfPath: `/uploads/receipts/${fileName}`,
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
                    `/uploads/receipts/${fileName}`,
                    receiptNumber
                );
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
            }

            console.log('Receipt generated:', receiptNumber, 'PDF:', fileName);
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
