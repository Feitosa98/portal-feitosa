'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserPlus, Edit, Trash2, X, Search, Loader2 } from 'lucide-react';

interface Client {
    id: string;
    companyName?: string;
    cnpj?: string;
    cpf?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    user: {
        id: string;
        name: string;
        email: string;
        active: boolean;
    };
}

export default function ClientesPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyName: '',
        cnpj: '',
        cpf: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData || JSON.parse(userData).role !== 'ADMIN') {
            router.push('/login');
            return;
        }
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCNPJLookup = async () => {
        if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
            alert('Digite um CNPJ válido');
            return;
        }

        setLookupLoading(true);
        try {
            const response = await api.get(`/clients/cnpj/${formData.cnpj}`);
            setFormData({
                ...formData,
                companyName: response.data.companyName,
                address: response.data.address,
                city: response.data.city,
                state: response.data.state,
                zipCode: response.data.zipCode,
            });
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao consultar CNPJ');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCEPLookup = async () => {
        if (!formData.zipCode || formData.zipCode.replace(/\D/g, '').length !== 8) {
            alert('Digite um CEP válido');
            return;
        }

        setLookupLoading(true);
        try {
            const response = await api.get(`/clients/cep/${formData.zipCode}`);
            setFormData({
                ...formData,
                address: response.data.street,
                city: response.data.city,
                state: response.data.state,
                zipCode: response.data.zipCode,
            });
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao consultar CEP');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/clients', formData);
            setShowModal(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                companyName: '',
                cnpj: '',
                cpf: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
            });
            loadClients();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao criar cliente');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

        try {
            await api.delete(`/clients/${id}`);
            loadClients();
        } catch (error) {
            alert('Erro ao deletar cliente');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    };

    const formatCEP = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
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
                        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Clientes</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <UserPlus className="h-5 w-5" />
                            Novo Cliente
                        </button>
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
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Empresa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            CNPJ/CPF
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Cidade
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {clients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {client.user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{client.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {client.companyName || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {client.cnpj || client.cpf || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {client.city ? `${client.city}/${client.state}` : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${client.user.active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {client.user.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Novo Cliente</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Dados Básicos */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados de Acesso</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nome *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Senha *
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dados da Empresa */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                CNPJ
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.cnpj}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })
                                                    }
                                                    placeholder="00.000.000/0000-00"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCNPJLookup}
                                                    disabled={lookupLoading}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {lookupLoading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Search className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                CPF
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cpf}
                                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                                placeholder="000.000.000-00"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Razão Social / Nome da Empresa
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.companyName}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, companyName: e.target.value })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefone
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Endereço */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.zipCode}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, zipCode: formatCEP(e.target.value) })
                                                    }
                                                    placeholder="00000-000"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCEPLookup}
                                                    disabled={lookupLoading}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {lookupLoading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Search className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Endereço
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Rua, número, complemento"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cidade
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Estado
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                placeholder="UF"
                                                maxLength={2}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
                                    >
                                        Criar Cliente
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
