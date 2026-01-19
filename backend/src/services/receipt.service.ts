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

            // Company Header
            doc.fontSize(16).font('Helvetica-Bold').text('Feitosa Soluções em Informática', { align: 'center' });
            doc.fontSize(10).font('Helvetica');
            doc.text('36623424000160', { align: 'center' });
            doc.text('Rua Coronel Jorge Teixeira', { align: 'center' });
            doc.text('69088-561 - Manaus/AM', { align: 'center' });

            // Email aligned to the right
            const emailY = 50;
            doc.text('iagofeitosa3@gmail.com', 450, emailY, { width: 100, align: 'right' });

            doc.moveDown(2);

            // Client Data Section
            doc.fontSize(12).font('Helvetica-Bold').text('Dados do Cliente', 50, doc.y);
            doc.moveDown(0.5);

            const clientDataY = doc.y;
            doc.fontSize(10).font('Helvetica');

            // Client name on the left
            const clientName = data.clientInfo?.companyName || data.clientInfo?.name || 'Cliente';
            doc.text(clientName, 50, clientDataY);

            // Date on the right
            const dateText = `Data: ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`;
            doc.text(dateText, 400, clientDataY, { width: 150, align: 'right' });

            doc.moveDown(0.5);

            // Client address (if available)
            if (data.clientInfo?.address) {
                const fullAddress = [
                    data.clientInfo.address,
                    data.clientInfo.city,
                    data.clientInfo.state,
                    data.clientInfo.zipCode
                ].filter(Boolean).join(', ');
                doc.text(fullAddress, 50);
            }

            doc.moveDown(1);

            // Receipt Number Header (gray background)
            const receiptHeaderY = doc.y;
            doc.rect(50, receiptHeaderY, 495, 25).fillAndStroke('#CCCCCC', '#000000');
            doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
            doc.text(
                `ORDEM DE SERVIÇO Nº ${data.receiptNumber || '0000-00'}`,
                50,
                receiptHeaderY + 7,
                { width: 495, align: 'center' }
            );

            doc.moveDown(2);

            // Services Section
            if (data.items && data.items.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Serviços', 50, doc.y);
                doc.moveDown(0.5);

                // Services Table Header
                const tableTop = doc.y;
                const tableHeaders = ['Nome', 'Quantidade', 'Unidade', 'Valor Unitário', 'Valor Total'];
                const colWidths = [200, 80, 60, 80, 75];
                let xPos = 50;

                doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666');
                tableHeaders.forEach((header, i) => {
                    doc.text(header, xPos, tableTop, { width: colWidths[i], align: i === 0 ? 'left' : 'right' });
                    xPos += colWidths[i];
                });

                doc.moveDown(0.5);

                // Services Table Rows
                doc.font('Helvetica').fillColor('#000000');
                data.items.forEach((item) => {
                    const rowY = doc.y;
                    xPos = 50;

                    doc.text(item.name, xPos, rowY, { width: colWidths[0] });
                    xPos += colWidths[0];

                    doc.text(item.quantity.toString(), xPos, rowY, { width: colWidths[1], align: 'right' });
                    xPos += colWidths[1];

                    doc.text(item.unit, xPos, rowY, { width: colWidths[2], align: 'right' });
                    xPos += colWidths[2];

                    doc.text(`R$ ${item.unitPrice.toFixed(2)}`, xPos, rowY, { width: colWidths[3], align: 'right' });
                    xPos += colWidths[3];

                    doc.text(`R$ ${item.totalPrice.toFixed(2)}`, xPos, rowY, { width: colWidths[4], align: 'right' });

                    doc.moveDown(0.8);
                });

                doc.moveDown(1);
            }

            // Total Section
            const totalY = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text('Total Serviços', 400, totalY, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold');
            doc.text(`R$ ${data.amount.toFixed(2)}`, 500, totalY, { width: 45, align: 'right' });

            doc.moveDown(1.5);

            // Subtotal and Total
            const subtotalY = doc.y;
            doc.font('Helvetica');
            doc.text('Subtotal', 400, subtotalY, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold');
            doc.text(`R$ ${data.amount.toFixed(2)}`, 500, subtotalY, { width: 45, align: 'right' });

            doc.moveDown(0.5);

            const finalTotalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total', 400, finalTotalY, { width: 100, align: 'right' });
            doc.text(`R$ ${data.amount.toFixed(2)}`, 500, finalTotalY, { width: 45, align: 'right' });

            doc.moveDown(2);

            // Payment Section
            doc.fontSize(12).font('Helvetica-Bold').text('Pagamento(s)', 50, doc.y);
            doc.moveDown(0.5);

            const paymentTableY = doc.y;
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666');
            doc.text('Pagamento', 50, paymentTableY, { width: 200 });
            doc.text('Vencimento', 300, paymentTableY, { width: 100, align: 'right' });
            doc.text('Valor', 450, paymentTableY, { width: 95, align: 'right' });

            doc.moveDown(0.5);

            doc.font('Helvetica').fillColor('#000000');
            const paymentRowY = doc.y;
            doc.text('À vista', 50, paymentRowY);
            doc.text(
                data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                300,
                paymentRowY,
                { width: 100, align: 'right' }
            );
            doc.text(`R$ ${data.amount.toFixed(2)}`, 450, paymentRowY, { width: 95, align: 'right' });

            doc.moveDown(2);

            // Observations Section
            doc.fontSize(12).font('Helvetica-Bold').text('Observações', 50, doc.y);
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            doc.text('Garantia: 90 Dias', 50, doc.y);

            // Signature Section (at bottom of page)
            const signatureY = 650;
            doc.moveDown(4);

            // Signature line for company
            doc.moveTo(80, signatureY).lineTo(250, signatureY).stroke();
            doc.fontSize(9).font('Helvetica-Bold').text('Feitosa Soluções em Informática', 80, signatureY + 10, {
                width: 170,
                align: 'center',
            });

            // Signature line for client
            doc.moveTo(320, signatureY).lineTo(490, signatureY).stroke();
            doc.text(clientName, 320, signatureY + 10, { width: 170, align: 'center' });

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });
    }
}

export const receiptService = new ReceiptService();
