/**
 * Boleto Service
 * Integrates with payment gateways for boleto generation
 * 
 * IMPORTANT: Configure your payment gateway credentials in .env
 * Supported gateways: Asaas, Mercado Pago, PagSeguro, etc.
 */

interface BoletoData {
    clientId: string;
    amount: number;
    dueDate: Date;
    description: string;
    clientInfo?: {
        name: string;
        cpfCnpj: string;
        email: string;
    };
}

interface BoletoResponse {
    externalId: string;
    barcode: string;
    digitableLine: string;
    pdfUrl: string;
}

class BoletoService {
    private apiUrl: string;
    private apiKey: string;

    constructor() {
        this.apiUrl = process.env.PAYMENT_API_URL || '';
        this.apiKey = process.env.PAYMENT_API_KEY || '';
    }

    /**
     * Generate boleto
     * This is a placeholder - implement based on your payment gateway's API
     */
    async generate(data: BoletoData): Promise<BoletoResponse> {
        try {
            console.log('Boleto generation requested:', data);

            const externalId = `BOL${Date.now()}`;
            const barcode = '34191.79001 01043.510047 91020.150008 5 84430000002000';
            const digitableLine = '34191.79001 01043.510047 91020.150008 5 84430000002000';

            // Generate Mock PDF
            const fileName = `${externalId}.pdf`;
            const filePath = `uploads/boletos/${fileName}`;
            await this.generatePdf(data, filePath, barcode, digitableLine);

            return {
                externalId,
                barcode,
                digitableLine,
                pdfUrl: `/uploads/boletos/${fileName}`,
            };
        } catch (error) {
            console.error('Boleto generation error:', error);
            throw new Error('Erro ao gerar boleto');
        }
    }

    private async generatePdf(data: BoletoData, filePath: string, barcode: string, digitableLine: string): Promise<void> {
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        const fullPath = path.join(__dirname, '../../', filePath);

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(fullPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('BOLETO BANCÁRIO', { align: 'center' });
            doc.moveDown();

            // Bank Info
            doc.fontSize(12).text('Banco: 001 - Banco do Brasil', { align: 'left' });
            doc.fontSize(10).text(`Linha Digitável: ${digitableLine}`, { align: 'left' });
            doc.moveDown();

            // Box
            doc.rect(50, 150, 500, 300).stroke();

            // Data
            const startY = 170;
            const col1 = 70;
            const col2 = 300;

            doc.fontSize(10);
            doc.text('Beneficiário:', col1, startY);
            doc.font('Helvetica-Bold').text('PORTAL DO CLIENTE LTDA', col1, startY + 15);

            doc.font('Helvetica').text('Pagador:', col1, startY + 50);
            if (data.clientInfo) {
                doc.font('Helvetica-Bold').text(data.clientInfo.name, col1, startY + 65);
                doc.font('Helvetica').text(data.clientInfo.cpfCnpj, col1, startY + 80);
            }

            doc.font('Helvetica').text('Vencimento:', col2, startY);
            doc.font('Helvetica-Bold').text(new Date(data.dueDate).toLocaleDateString('pt-BR'), col2, startY + 15);

            doc.font('Helvetica').text('Valor:', col2, startY + 50);
            doc.font('Helvetica-Bold').text(`R$ ${data.amount.toFixed(2)}`, col2, startY + 65);

            doc.font('Helvetica').text('Instruções:', col1, startY + 130);
            doc.text(data.description, col1, startY + 145);

            // Barcode (Mock visual)
            doc.rect(70, 400, 460, 40).fill('black');
            doc.fill('black').fontSize(8).text(barcode, 70, 450, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });
    }

    /**
     * Check payment status
     */
    async checkPaymentStatus(externalId: string): Promise<{ paid: boolean; paymentDate?: Date }> {
        try {
            console.log('Checking payment status for:', externalId);
            return { paid: true, paymentDate: new Date() }; // Auto-confirm for testing if needed
        } catch (error) {
            console.error('Payment status check error:', error);
            throw new Error('Erro ao verificar status do pagamento');
        }
    }

    /**
     * Cancel boleto
     */
    async cancel(externalId: string): Promise<boolean> {
        try {
            console.log('Boleto cancellation requested:', externalId);
            return true;
        } catch (error) {
            console.error('Boleto cancellation error:', error);
            throw new Error('Erro ao cancelar boleto');
        }
    }
}

export const boletoService = new BoletoService();
