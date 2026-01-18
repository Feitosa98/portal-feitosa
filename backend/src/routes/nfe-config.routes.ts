import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for certificate upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR_CERT || './uploads/certificates';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original name or fixed name per config? 
        // Let's use timestamp to avoid overwriting issues during active use, but maybe clean up old ones?
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Accept .pfx or .p12
        if (file.originalname.endsWith('.pfx') || file.originalname.endsWith('.p12')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only .pfx and .p12 are allowed.'));
        }
    }
});

// Get NFe Config
router.get('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const config = await prisma.nfeConfig.findFirst();
        res.json(config || { environment: 'HOMOLOGATION', certificatePath: null });
    } catch (error) {
        console.error('Get NFe config error:', error);
        res.status(500).json({ error: 'Erro ao buscar configuração da NF-e' });
    }
});

// Update NFe Config (Environment & Password)
router.put('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { environment, certificatePass } = req.body;

        const existing = await prisma.nfeConfig.findFirst();

        let config;
        if (existing) {
            config = await prisma.nfeConfig.update({
                where: { id: existing.id },
                data: {
                    environment,
                    certificatePass, // In real app, encrypt this!
                },
            });
        } else {
            config = await prisma.nfeConfig.create({
                data: {
                    environment,
                    certificatePass,
                },
            });
        }

        res.json(config);
    } catch (error) {
        console.error('Update NFe config error:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
});

// Upload Certificate
router.post('/certificate', authMiddleware, adminOnly, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum certificado enviado' });
        }

        const existing = await prisma.nfeConfig.findFirst();

        if (existing) {
            // Optional: Delete old certificate file if exists
            if (existing.certificatePath && fs.existsSync(existing.certificatePath)) {
                try {
                    fs.unlinkSync(existing.certificatePath);
                } catch (e) {
                    console.error('Failed to delete old certificate:', e);
                }
            }

            await prisma.nfeConfig.update({
                where: { id: existing.id },
                data: {
                    certificatePath: req.file.path,
                },
            });
        } else {
            await prisma.nfeConfig.create({
                data: {
                    certificatePath: req.file.path,
                },
            });
        }

        res.json({ message: 'Certificado enviado com sucesso', path: req.file.path });
    } catch (error) {
        console.error('Upload certificate error:', error);
        res.status(500).json({ error: 'Erro ao enviar certificado' });
    }
});

export default router;
