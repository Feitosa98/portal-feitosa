/**
 * Receipt PDF Generation Service
 * Generates professional receipts with company branding and client details
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

interface ReceiptData {
    clientId: string;
    amount: number;
    description: string;
    clientInfo?: {
        name: string;
        companyName?: string;
        cnpj?: string;
        cpf?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    items?: Array<{
        name: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
    }>;
    paymentDate?: Date;
    receiptNumber?: string;
}

class ReceiptService {
    /**
     * Generate receipt PDF
     */
    async generatePDF(data: ReceiptData, filePath: string): Promise<void> {
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

            // Company Header - Centered
            doc.fontSize(18).font('Helvetica-Bold');
            doc.text('Feitosa Soluções em Informática', 50, 50, { align: 'center', width: 495 });

            doc.fontSize(9).font('Helvetica');
            doc.text('36623424000160', { align: 'center' });
            doc.text('Rua Coronel Jorge Teixeira', { align: 'center' });
            doc.text('69088-561 - Manaus/AM', { align: 'center' });

            // Email - Right aligned
            doc.fontSize(9);
            doc.text('iagofeitosa3@gmail.com', 400, 95, { width: 145, align: 'right' });

            doc.moveDown(2);

            // Client Data Section Header
            const clientSectionY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Dados do Cliente', 50, clientSectionY);
            doc.moveDown(0.5);

            // Client Info
            const clientDataY = doc.y;
            doc.fontSize(10).font('Helvetica');

            const clientName = data.clientInfo?.companyName || data.clientInfo?.name || 'Cliente';
            doc.text(clientName, 50, clientDataY);

            // Date on the right
            const dateText = `Data: ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`;
            doc.text(dateText, 350, clientDataY, { width: 195, align: 'right' });

            doc.moveDown(0.3);

            // Client address
            if (data.clientInfo?.address) {
                const addressParts = [
                    data.clientInfo.address,
                    data.clientInfo.city,
                    data.clientInfo.state,
                    data.clientInfo.zipCode
                ].filter(Boolean).join(', ');
                doc.fontSize(9).text(addressParts, 50);
            }

            doc.moveDown(1.5);

            // Receipt Number Header (gray background)
            const receiptHeaderY = doc.y;
            doc.rect(50, receiptHeaderY, 495, 22).fillAndStroke('#D3D3D3', '#000000');
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
            doc.text(
                `ORDEM DE SERVIÇO Nº ${data.receiptNumber || '0000-00'}`,
                50,
                receiptHeaderY + 6,
                { width: 495, align: 'center' }
            );

            doc.moveDown(1.5);

            // Services Section
            if (data.items && data.items.length > 0) {
                const servicesY = doc.y;

                // Services Table Header
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
                doc.text('Nome', 50, servicesY, { width: 220, continued: false });
                doc.text('Quantidade', 270, servicesY, { width: 70, align: 'center' });
                doc.text('Unidade', 340, servicesY, { width: 60, align: 'center' });
                doc.text('Valor Unitário', 400, servicesY, { width: 70, align: 'right' });
                doc.text('Valor Total', 470, servicesY, { width: 75, align: 'right' });

                doc.moveDown(0.8);

                // Services Table Rows
                doc.font('Helvetica').fontSize(9);
                data.items.forEach((item) => {
                    const rowY = doc.y;

                    doc.text(item.name, 50, rowY, { width: 220 });
                    doc.text(item.quantity.toString(), 270, rowY, { width: 70, align: 'center' });
                    doc.text(item.unit, 340, rowY, { width: 60, align: 'center' });
                    doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 400, rowY, { width: 70, align: 'right' });
                    doc.text(`R$ ${item.totalPrice.toFixed(2)}`, 470, rowY, { width: 75, align: 'right' });

                    doc.moveDown(0.6);
                });

                doc.moveDown(0.5);
            }

            // Totals Section - Right aligned
            const totalsX = 370;
            let currentY = doc.y;

            doc.fontSize(9).font('Helvetica');
            doc.text('Total Serviços', totalsX, currentY, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold');
            doc.text(`R$ ${data.amount.toFixed(2)}`, totalsX + 100, currentY, { width: 75, align: 'right' });

            currentY += 20;
            doc.font('Helvetica');
            doc.text('Subtotal', totalsX, currentY, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold');
            doc.text(`R$ ${data.amount.toFixed(2)}`, totalsX + 100, currentY, { width: 75, align: 'right' });

            currentY += 20;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Total', totalsX, currentY, { width: 100, align: 'right' });
            doc.text(`R$ ${data.amount.toFixed(2)}`, totalsX + 100, currentY, { width: 75, align: 'right' });

            doc.moveDown(2);

            // Payment Section
            const paymentY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
            doc.text('Pagamento(s)', 50, paymentY);
            doc.moveDown(0.8);

            // Payment Table Header
            const paymentTableY = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Pagamento', 50, paymentTableY, { width: 200 });
            doc.text('Vencimento', 300, paymentTableY, { width: 100, align: 'center' });
            doc.text('Valor', 450, paymentTableY, { width: 95, align: 'right' });

            doc.moveDown(0.6);

            // Payment Row
            const paymentRowY = doc.y;
            doc.font('Helvetica');
            doc.text('À vista', 50, paymentRowY);
            doc.text(
                data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                300,
                paymentRowY,
                { width: 100, align: 'center' }
            );
            doc.text(`R$ ${data.amount.toFixed(2)}`, 450, paymentRowY, { width: 95, align: 'right' });

            doc.moveDown(2);

            // Observations Section
            const obsY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Observações', 50, obsY);
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica');
            doc.text('Garantia: 90 Dias', 50);

            // Signature Section (at bottom of page)
            const signatureY = 700;

            // Company signature line
            doc.moveTo(80, signatureY).lineTo(250, signatureY).stroke();
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Feitosa Soluções em Informática', 80, signatureY + 8, {
                width: 170,
                align: 'center',
            });

            // Client signature line
            doc.moveTo(320, signatureY).lineTo(490, signatureY).stroke();
            doc.text(clientName, 320, signatureY + 8, { width: 170, align: 'center' });

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });
    }
}

export const receiptService = new ReceiptService();
