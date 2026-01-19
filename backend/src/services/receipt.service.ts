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

            // Brand Colors
            const PRIMARY_COLOR = '#0f3c66'; // Dark Blue
            const ACCENT_COLOR = '#f3f4f6'; // Light Gray
            const TEXT_COLOR = '#1f2937'; // Dark Gray
            const WHITE = '#ffffff';

            doc.pipe(stream);

            // --- HEADER ---
            let headerY = 50;

            // Logo (Left)
            const logoPath = path.join(__dirname, '../assets/logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 40, { width: 100 });
            }

            // Company Info (Right)
            doc.font('Helvetica-Bold').fontSize(16).fillColor(PRIMARY_COLOR);
            doc.text('Feitosa Soluções em Informática', 200, 45, { align: 'right', width: 345 });

            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);
            doc.text('36.623.424/0001-60', 200, 65, { align: 'right', width: 345 });
            doc.text('Rua Coronel Jorge Teixeira', 200, 78, { align: 'right', width: 345 });
            doc.text('69088-561 - Manaus/AM', 200, 91, { align: 'right', width: 345 });
            doc.text('iagofeitosa3@gmail.com', 200, 104, { align: 'right', width: 345 });

            // Divider
            doc.moveDown();
            doc.moveTo(50, 125).lineTo(545, 125).lineWidth(1).strokeColor(PRIMARY_COLOR).stroke();

            // --- RECEIPT TITLE & NUMBER ---
            const titleY = 145;
            doc.rect(50, titleY, 595 - 100, 30).fill(PRIMARY_COLOR); // Full width background
            doc.font('Helvetica-Bold').fontSize(14).fillColor(WHITE);
            doc.text(
                `ORDEM DE SERVIÇO Nº ${data.receiptNumber || '0000-00'}`,
                50,
                titleY + 8,
                { align: 'center', width: 495 }
            );

            // --- CLIENT INFO ---
            const clientY = 190;

            // Left Column: Client Details
            doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR);
            doc.text('DADOS DO CLIENTE', 50, clientY);

            doc.font('Helvetica').fontSize(10).fillColor(TEXT_COLOR);
            const clientName = data.clientInfo?.companyName || data.clientInfo?.name || 'Cliente Consumidor';
            doc.text(clientName, 50, clientY + 20);

            if (data.clientInfo?.address) {
                const addressParts = [
                    data.clientInfo.address,
                    data.clientInfo.city,
                    data.clientInfo.state,
                    data.clientInfo.zipCode
                ].filter(Boolean).join(', ');
                doc.fontSize(9).text(addressParts, 50, clientY + 35, { width: 300 });
            }

            // Right Column: Date & Status
            doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR);
            doc.text('DETALHES', 350, clientY);

            doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_COLOR);
            doc.text('Data de Emissão:', 350, clientY + 20);
            doc.font('Helvetica').text(
                data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                450, clientY + 20, { align: 'right' }
            );

            // --- SERVICES TABLE ---
            const tableY = 250;

            // Table Header
            doc.rect(50, tableY, 495, 20).fill(ACCENT_COLOR);
            doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY_COLOR);

            const colX = { desc: 60, qty: 300, unit: 360, price: 420, total: 490 };
            const colW = { desc: 230, qty: 50, unit: 50, price: 60, total: 55 };

            doc.text('DESCRIÇÃO', colX.desc, tableY + 6);
            doc.text('QTD', colX.qty, tableY + 6, { width: colW.qty, align: 'center' });
            doc.text('UN', colX.unit, tableY + 6, { width: colW.unit, align: 'center' });
            doc.text('UNITÁRIO', colX.price, tableY + 6, { width: colW.price, align: 'right' });
            doc.text('TOTAL', colX.total, tableY + 6, { width: colW.total, align: 'right' });

            // Table Body
            let currentY = tableY + 25;
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);

            if (data.items && data.items.length > 0) {
                data.items.forEach((item, index) => {
                    // Zebra striping
                    if (index % 2 === 0) {
                        doc.rect(50, currentY - 4, 495, 18).fillOpacity(0.5).fill(ACCENT_COLOR).fillOpacity(1);
                        doc.fillColor(TEXT_COLOR); // Reset fill color for text
                    }

                    doc.text(item.name, colX.desc, currentY, { width: colW.desc });
                    doc.text(item.quantity.toString(), colX.qty, currentY, { width: colW.qty, align: 'center' });
                    doc.text(item.unit, colX.unit, currentY, { width: colW.unit, align: 'center' });
                    doc.text(`R$ ${item.unitPrice.toFixed(2)}`, colX.price, currentY, { width: colW.price, align: 'right' });
                    doc.text(`R$ ${item.totalPrice.toFixed(2)}`, colX.total, currentY, { width: colW.total, align: 'right' });

                    currentY += 20;
                });
            } else {
                doc.text('Serviços Diversos', colX.desc, currentY);
                doc.text(`R$ ${data.amount.toFixed(2)}`, colX.total, currentY, { width: colW.total, align: 'right' });
                currentY += 20;
            }

            // Divider Line
            doc.moveTo(50, currentY).lineTo(545, currentY).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
            currentY += 10;

            // --- TOTALS SECTION ---
            const totalsW = 150;
            const totalsX = 545 - totalsW;

            doc.font('Helvetica').fontSize(10);
            doc.text('Subtotal:', totalsX, currentY, { width: 70, align: 'left' });
            doc.text(`R$ ${data.amount.toFixed(2)}`, totalsX + 70, currentY, { width: 80, align: 'right' });

            currentY += 20;

            // Total Highlight Box
            doc.rect(totalsX - 10, currentY - 5, totalsW + 10, 25).fill(PRIMARY_COLOR);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(WHITE);
            doc.text('TOTAL:', totalsX, currentY + 2);
            doc.text(`R$ ${data.amount.toFixed(2)}`, totalsX + 70, currentY + 2, { width: 80, align: 'right' });

            // --- PAYMENT INFO ---
            const paymentY = currentY + 50;
            doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR);
            doc.text('PAGAMENTO', 50, paymentY);

            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);
            doc.text('Forma: À vista', 50, paymentY + 20);
            doc.text(`Vencimento: ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, 50, paymentY + 35);


            // --- OBSERVATIONS ---
            const obsY = paymentY; // Same Y line but right side or below
            doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY_COLOR);
            doc.text('OBSERVAÇÕES', 300, obsY);
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);
            doc.text('Garantia de 90 dias para serviços.', 300, obsY + 20);
            doc.text('Equipamentos não retirados em 90 dias serão vendidos para custear despesas.', 300, obsY + 32, { width: 240 });

            // --- FOOTER / SIGNATURES ---
            const signatureY = 700;

            // Company Signature
            doc.moveTo(60, signatureY).lineTo(230, signatureY).lineWidth(1).strokeColor(TEXT_COLOR).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text('FEITOSA SOLUÇÕES EM INFORMÁTICA', 60, signatureY + 5, { width: 170, align: 'center' });

            // Client Signature
            doc.moveTo(310, signatureY).lineTo(480, signatureY).stroke();
            doc.font('Helvetica').fontSize(8).text(clientName.toUpperCase(), 310, signatureY + 5, { width: 170, align: 'center' });

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });
    }
}

export const receiptService = new ReceiptService();
