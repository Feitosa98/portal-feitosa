'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Save } from 'lucide-react';

export default function EmailConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        host: '',
        port: 587,
        user: '',
        password: '',
        from: '',
        secure: true,
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData || JSON.parse(userData).role !== 'ADMIN') {
            router.push('/login');
            return;
        }
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await api.get('/email-config');
            setFormData({
                host: response.data.host,
                port: response.data.port,
                user: response.data.user,
                password: '',
                from: response.data.from,
                secure: response.data.secure,
            });
        } catch (error) {
            console.log('No config found, using defaults');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.post('/email-config', formData);
            alert('Configuração salva com sucesso!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            ← Voltar
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Configuração de Email</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Mail className="h-8 w-8 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Servidor SMTP</h2>
                                <p className="text-sm text-gray-600">
                                    Configure o servidor de email para envio automático
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Host SMTP *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.host}
                                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Porta *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seguro (TLS/SSL)
                                    </label>
                                    <select
                                        value={formData.secure ? 'true' : 'false'}
                                        onChange={(e) => setFormData({ ...formData, secure: e.target.value === 'true' })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Usuário (Email) *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.user}
                                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                        placeholder="seu-email@gmail.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Senha *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Senha ou App Password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Para Gmail, use uma senha de aplicativo
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remetente (From) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.from}
                                        onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                                        placeholder="Portal <noreply@portal.com>"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">💡 Dica</h4>
                                <p className="text-sm text-blue-800">
                                    Para usar o Gmail, você precisa gerar uma "Senha de App" nas configurações de
                                    segurança da sua conta Google. Não use sua senha normal.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="h-5 w-5" />
                                {saving ? 'Salvando...' : 'Salvar Configuração'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
