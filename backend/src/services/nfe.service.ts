import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * NF-e Service
 * Integrates with Brazilian invoice system (NF-e)
 * 
 * IMPORTANT: Configure your NF-e provider credentials in .env
 * Supported providers: Focus NFe, Bling, eNotas, etc.
 */

interface NFeData {
    clientId: string;
    amount: number;
    description: string;
    items?: any[];
}

interface NFeResponse {
    key: string;
    xml: string;
    pdfUrl: string;
    number: string;
    series: string;
}

class NFeService {
    private apiUrl: string;
    private apiKey: string;
    private apiSecret: string;

    constructor() {
        this.apiUrl = process.env.NFE_API_URL || '';
        this.apiKey = process.env.NFE_API_KEY || '';
        this.apiSecret = process.env.NFE_API_SECRET || '';
    }

    /**
     * Generate NF-e (Invoice)
     * This is a placeholder - implement based on your NF-e provider's API
     */
    async generate(data: NFeData): Promise<NFeResponse> {
        try {
            console.log('NF-e generation requested for client:', data.clientId);

            const config = await prisma.nfeConfig.findFirst();

            if (!config) {
                console.warn('NFe Config not found. Using default mock settings.');
            } else {
                console.log(`Generating NF-e in environment: ${config.environment}`);
                if (!config.certificatePath && config.environment === 'PRODUCTION') {
                    throw new Error('Certificado digital não configurado para emissão em Produção.');
                }
            }

            const isHomologation = config?.environment === 'HOMOLOGATION' || !config;
            const environmentLabel = isHomologation ? 'HOMOLOGAÇÃO - SEM VALOR FISCAL' : 'PRODUÇÃO';

            const key = `NFe${Date.now()}`;
            const number = String(Math.floor(Math.random() * 100000));
            const series = '1';

            // Generate Mock PDF with Environment Label
            const fileName = `${key}.pdf`;
            const filePath = `uploads/nfe/${fileName}`;
            await this.generatePdf(data, filePath, key, number, series, environmentLabel);

            return {
                key,
                xml: '<xml>...</xml>', // In a real scenario, this would be the actual XML
                pdfUrl: `/uploads/nfe/${fileName}`,
                number,
                series,
            };
        } catch (error) {
            console.error('NF-e generation error:', error);
            throw new Error('Erro ao gerar NF-e');
        }
    }

    private async generatePdf(data: NFeData, filePath: string, key: string, number: string, series: string, watermark: string): Promise<void> {
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
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const stream = fs.createWriteStream(fullPath);

            doc.pipe(stream);

            // Header - DANFE
            doc.fontSize(16).font('Helvetica-Bold').text('DANFE', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Documento Auxiliar da Nota Fiscal Eletrônica', { align: 'center' });

            if (watermark) {
                doc.fontSize(24).font('Helvetica-Bold').fillColor('red').opacity(0.3)
                    .text(watermark, { align: 'center', angle: 45, baseline: 'middle' });
                doc.fillColor('black').opacity(1); // Reset
            }

            doc.moveDown();

            // Info Box
            doc.rect(40, 100, 515, 80).stroke();
            doc.text('CHAVE DE ACESSO', 50, 110);
            doc.font('Helvetica-Bold').text(key, 50, 125);

            doc.font('Helvetica').text('NÚMERO', 50, 145);
            doc.font('Helvetica-Bold').text(number, 50, 160);

            doc.font('Helvetica').text('SÉRIE', 200, 145);
            doc.font('Helvetica-Bold').text(series, 200, 160);

            // Emitente
            doc.rect(40, 200, 515, 60).stroke();
            doc.font('Helvetica-Bold').text('EMITENTE: PORTAL DO CLIENTE LTDA', 50, 210);
            doc.font('Helvetica').text('CNPJ: 00.000.000/0001-00', 50, 230);

            // Destinatário
            doc.rect(40, 280, 515, 60).stroke();
            doc.font('Helvetica-Bold').text('DESTINATÁRIO', 50, 290);
            doc.font('Helvetica').text(`Cliente ID: ${data.clientId}`, 50, 310);

            // Valor
            doc.rect(40, 360, 515, 40).stroke();
            doc.font('Helvetica').text('VALOR TOTAL DA NOTA', 50, 370);
            doc.font('Helvetica-Bold').text(`R$ ${data.amount.toFixed(2)}`, 300, 370, { align: 'right' });

            // Descrição
            doc.rect(40, 420, 515, 200).stroke();
            doc.font('Helvetica-Bold').text('DADOS DOS PRODUTOS / SERVIÇOS', 50, 430);
            doc.font('Helvetica').text(data.description, 50, 450);

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });
    }

    /**
     * Cancel NF-e
     */
    async cancel(nfeKey: string, reason: string): Promise<boolean> {
        try {
            // TODO: Implement NF-e cancellation
            console.log('NF-e cancellation requested:', nfeKey, reason);
            return true;
        } catch (error) {
            console.error('NF-e cancellation error:', error);
            throw new Error('Erro ao cancelar NF-e');
        }
    }

    /**
     * Query NF-e status
     */
    async getStatus(nfeKey: string): Promise<string> {
        try {
            // TODO: Implement status query
            return 'AUTORIZADA';
        } catch (error) {
            console.error('NF-e status query error:', error);
            throw new Error('Erro ao consultar status da NF-e');
        }
    }
}

export const nfeService = new NFeService();
