import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { cnpjService } from '../services/cnpj.service';
import { cepService } from '../services/cep.service';

const router = Router();
const prisma = new PrismaClient();

// Lookup CNPJ data
router.get('/cnpj/:cnpj', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { cnpj } = req.params;

        if (!cnpjService.validate(cnpj)) {
            return res.status(400).json({ error: 'CNPJ inválido' });
        }

        const data = await cnpjService.lookup(cnpj);
        res.json(data);
    } catch (error: any) {
        console.error('CNPJ lookup error:', error);
        res.status(500).json({ error: error.message || 'Erro ao consultar CNPJ' });
    }
});

// Lookup CEP data
router.get('/cep/:cep', authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { cep } = req.params;

        if (!cepService.validate(cep)) {
            return res.status(400).json({ error: 'CEP inválido' });
        }

        const data = await cepService.lookup(cep);
        res.json(data);
    } catch (error: any) {
        console.error('CEP lookup error:', error);
        res.status(500).json({ error: error.message || 'Erro ao consultar CEP' });
    }
});

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
        // We assume :id is the userId based on other routes usage
        if (req.user!.role !== 'ADMIN' && id !== req.user!.userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Update client
        const client = await prisma.client.update({
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

        // Update user if name or email provided (admin only or self?) -> let's allow self to update name/email
        if (name || email) {
            await prisma.user.update({
                where: { id: id as string },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                },
            });
        }

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
