import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Email Service
 * Sends emails using configured SMTP settings
 */

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
}

class EmailService {
    /**
     * Get active email configuration
     */
    private async getConfig() {
        const config = await prisma.emailConfig.findFirst({
            where: { active: true },
        });

        if (!config) {
            throw new Error('Configuração de email não encontrada');
        }

        return config;
    }

    /**
     * Create transporter with current config
     */
    private async createTransporter() {
        const config = await this.getConfig();

        return nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.password,
            },
        });
    }

    /**
     * Send email
     */
    async send(options: EmailOptions): Promise<boolean> {
        try {
            const config = await this.getConfig();
            const transporter = await this.createTransporter();

            await transporter.sendMail({
                from: config.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            });

            console.log('Email sent successfully to:', options.to);
            return true;
        } catch (error) {
            console.error('Email send error:', error);
            throw new Error('Erro ao enviar email');
        }
    }

    /**
     * Send boleto email
     */
    async sendBoleto(clientEmail: string, boletoUrl: string, amount: number, dueDate: Date) {
        const html = `
      <h2>Boleto Gerado</h2>
      <p>Um novo boleto foi gerado para você.</p>
      <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
      <p><strong>Vencimento:</strong> ${dueDate.toLocaleDateString('pt-BR')}</p>
      <p><a href="${boletoUrl}">Clique aqui para visualizar o boleto</a></p>
    `;

        return this.send({
            to: clientEmail,
            subject: 'Novo Boleto Gerado',
            html,
        });
    }

    /**
     * Send invoice email
     */
    async sendInvoice(clientEmail: string, invoiceUrl: string, invoiceNumber: string) {
        const html = `
      <h2>Nota Fiscal Emitida</h2>
      <p>Sua nota fiscal foi emitida com sucesso.</p>
      <p><strong>Número:</strong> ${invoiceNumber}</p>
      <p><a href="${invoiceUrl}">Clique aqui para visualizar a nota fiscal</a></p>
    `;

        return this.send({
            to: clientEmail,
            subject: `Nota Fiscal ${invoiceNumber}`,
            html,
        });
    }

    /**
     * Send receipt email
     */
    async sendReceipt(clientEmail: string, receiptUrl: string, receiptNumber: string) {
        const html = `
      <h2>Recibo de Pagamento</h2>
      <p>Seu pagamento foi confirmado.</p>
      <p><strong>Recibo:</strong> ${receiptNumber}</p>
      <p><a href="${receiptUrl}">Clique aqui para visualizar o recibo</a></p>
    `;

        return this.send({
            to: clientEmail,
            subject: `Recibo ${receiptNumber}`,
            html,
        });
    }
}

export const emailService = new EmailService();
