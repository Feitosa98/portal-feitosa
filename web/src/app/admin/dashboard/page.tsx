'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Users, FileText, Receipt, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        clients: 0,
        invoices: 0,
        receipts: 0,
        boletos: 0,
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        setUser(parsedUser);
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [clients, invoices, receipts, boletos] = await Promise.all([
                api.get('/clients'),
                api.get('/invoices'),
                api.get('/receipts'),
                api.get('/boletos'),
            ]);

            setStats({
                clients: clients.data.length,
                invoices: invoices.data.length,
                receipts: receipts.data.length,
                boletos: boletos.data.length,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700">{user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Bem-vindo, {user.name}!</h2>
                    <p className="text-gray-600 mt-2">Gerencie clientes e documentos do sistema</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Clientes"
                        value={stats.clients}
                        icon={<Users className="h-8 w-8" />}
                        color="blue"
                        href="/admin/clientes"
                    />
                    <StatCard
                        title="Notas Fiscais"
                        value={stats.invoices}
                        icon={<FileText className="h-8 w-8" />}
                        color="green"
                        href="/admin/notas-fiscais"
                    />
                    <StatCard
                        title="Recibos"
                        value={stats.receipts}
                        icon={<Receipt className="h-8 w-8" />}
                        color="purple"
                        href="/admin/recibos"
                    />
                    <StatCard
                        title="Boletos"
                        value={stats.boletos}
                        icon={<DollarSign className="h-8 w-8" />}
                        color="yellow"
                        href="/admin/boletos"
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <QuickAction title="Gerenciar Clientes" href="/admin/clientes" />
                        <QuickAction title="Confirmar Pagamentos" href="/admin/pagamentos" />
                        <QuickAction title="Gerenciar Boletos" href="/admin/boletos" />
                        <QuickAction title="Configurar Email" href="/admin/email-config" />
                        <QuickAction title="Configurar NF-e" href="/admin/nfe-config" />
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    href,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    href?: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        yellow: 'bg-yellow-50 text-yellow-600',
    }[color];

    const content = (
        <>
            <div className={`${colorClasses} p-3 rounded-lg w-fit mb-4`}>{icon}</div>
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </>
    );

    if (href) {
        return (
            <a href={href} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer block">
                {content}
            </a>
        );
    }

    return <div className="bg-white rounded-xl shadow-sm p-6">{content}</div>;
}

function QuickAction({ title, href }: { title: string; href: string }) {
    return (
        <a
            href={href}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
        >
            <span className="text-gray-900 font-medium">{title}</span>
        </a>
    );
}
