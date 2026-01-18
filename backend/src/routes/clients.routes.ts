import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get all clients (Admin only)
router.get('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        active: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

// Get client by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const client = await prisma.client.findUnique({
            where: { userId: id as string },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Authorization check
        if (req.user!.role !== 'ADMIN' && client.userId !== req.user!.userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

// Create client (Admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, name, companyName, cnpj, cpf, phone, address, city, state, zipCode } = req.body;

        // Create user first
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'CLIENT',
            },
        });

        // Create client
        const client = await prisma.client.create({
            data: {
                userId: user.id,
                companyName,
                cnpj,
                cpf,
                phone,
                address,
                city,
                state,
                zipCode,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        active: true,
                    },
                },
            },
        });

        res.status(201).json(client);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});

// Update client
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { companyName, cnpj, cpf, phone, address, city, state, zipCode, name, email } = req.body;

        // Check authorization
        const existingClient = await prisma.client.findUnique({ where: { id } });
        if (!existingClient) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        if (req.user!.role !== 'ADMIN' && existingClient.userId !== req.user!.userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Update client
        const client = await prisma.client.update({
            where: { id },
            data: {
                companyName,
                cnpj,
                cpf,
                phone,
                address,
                where: { userId: id as string },
                data: {
                    companyName,
                    cnpj,
                    cpf,
                    phone,
                    address,
                    city,
                    state,
                    zipCode,
                },
            });

        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// Delete client (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Delete user (cascade will delete client)
        await prisma.user.delete({ where: { id: id as string } });

        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
});

export default router;
