import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/clients.routes';
import invoiceRoutes from './routes/invoices.routes';
import receiptRoutes from './routes/receipts.routes';
import boletoRoutes from './routes/boletos.routes';
import documentRoutes from './routes/documents.routes';
import fileStorageRoutes from './routes/file-storage.routes';
import emailConfigRoutes from './routes/email-config.routes';
import paymentRoutes from './routes/payments.routes';
import nfeConfigRoutes from './routes/nfe-config.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/boletos', boletoRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/files', fileStorageRoutes);
app.use('/api/email-config', emailConfigRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/nfe-config', nfeConfigRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
