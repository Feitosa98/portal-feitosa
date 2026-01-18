import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads/files';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
});

// Get files
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
            where.clientId = client.id;
        } else if (req.query.clientId) {
            where.clientId = req.query.clientId as string;
        }

        const files = await prisma.fileStorage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Erro ao buscar arquivos' });
    }
});

// Upload file
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const { clientId, description, folder } = req.body;

        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client || client.id !== clientId) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
        }

        const file = await prisma.fileStorage.create({
            data: {
                clientId,
                name: req.file.originalname,
                description,
                folder,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
            },
        });

        res.status(201).json(file);
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
});

export default router;
