import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads/documents';
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

// Get documents
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

        if (req.query.type) {
            where.type = req.query.type as string;
        }

        const documents = await prisma.document.findMany({
            where,
            include: {
                client: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Erro ao buscar documentos' });
    }
});

// Upload document
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const { clientId, type, description } = req.body;

        // Authorization check
        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client || client.id !== clientId) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
        }

        const document = await prisma.document.create({
            data: {
                clientId,
                name: req.file.originalname,
                type: type || 'GENERAL',
                description,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
            },
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Erro ao fazer upload do documento' });
    }
});

// Delete document
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const document = await prisma.document.findUnique({ where: { id: id as string } });
        if (!document) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Authorization check
        if (req.user!.role !== 'ADMIN') {
            const client = await prisma.client.findUnique({
                where: { userId: req.user!.userId },
            });
            if (!client || document.clientId !== client.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
        }

        // Delete file from filesystem
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await prisma.document.delete({ where: { id } });

        res.json({ message: 'Documento deletado com sucesso' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Erro ao deletar documento' });
    }
});

export default router;
