import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ClientDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        invoices: 0,
        receipts: 0,
        documents: 0,
        files: 0,
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(userData));
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [invoices, receipts, documents, files] = await Promise.all([
                api.get('/invoices'),
                api.get('/receipts'),
                api.get('/documents'),
                api.get('/files'),
            ]);

            setStats({
                invoices: invoices.data.length,
                receipts: receipts.data.length,
                documents: documents.data.length,
                files: files.data.length,
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
                    <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
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
                    <p className="text-gray-600 mt-2">Gerencie seus documentos e informações</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Notas Fiscais" value={stats.invoices} href="/notas-fiscais" />
                    <StatCard title="Recibos" value={stats.receipts} href="/recibos" />
                    <StatCard title="Certificados" value={stats.documents} href="/certificados" />
                    <StatCard title="Arquivos" value={stats.files} href="/drive" />
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <QuickLink title="Notas Fiscais" href="/notas-fiscais" />
                        <QuickLink title="Recibos" href="/recibos" />
                        <QuickLink title="Inventários" href="/inventarios" />
                        <QuickLink title="Certificados" href="/certificados" />
                        <QuickLink title="Drive" href="/drive" />
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
    return (
        <a
            href={href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
        >
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{value}</p>
        </a>
    );
}

function QuickLink({ title, href }: { title: string; href: string }) {
    return (
        <a
            href={href}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
        >
            <span className="text-gray-900 font-medium">{title}</span>
        </a>
    );
}
