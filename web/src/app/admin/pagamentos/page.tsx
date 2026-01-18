'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DollarSign, CheckCircle } from 'lucide-react';

interface Boleto {
    id: string;
    number: string;
    amount: number;
    dueDate: string;
    status: string;
    client: {
        user: {
            name: string;
        };
    };
}

export default function PagamentosPage() {
    const router = useRouter();
    const [boletos, setBoletos] = useState<Boleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBoleto, setSelectedBoleto] = useState<string | null>(null);
    const [confirmData, setConfirmData] = useState({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData || JSON.parse(userData).role !== 'ADMIN') {
            router.push('/login');
            return;
        }
        loadBoletos();
    }, []);

    const loadBoletos = async () => {
        try {
            const response = await api.get('/boletos');
            // Filter only pending boletos
            setBoletos(response.data.filter((b: Boleto) => b.status === 'PENDING'));
        } catch (error) {
            console.error('Error loading boletos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (boletoId: string) => {
        try {
            await api.post('/payments/confirm', {
                boletoId,
                amount: confirmData.amount,
                paymentDate: confirmData.paymentDate,
            });

            alert('Pagamento confirmado! Recibo e NF-e serão gerados automaticamente.');
            setSelectedBoleto(null);
            loadBoletos();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao confirmar pagamento');
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
                        <h1 className="text-2xl font-bold text-gray-900">Confirmar Pagamentos</h1>
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : boletos.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Nenhum pagamento pendente
                        </h3>
                        <p className="text-gray-600">Todos os boletos foram processados.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Número
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Cliente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Vencimento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Valor
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
                                    {boletos.map((boleto) => (
                                        <tr key={boleto.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{boleto.number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{boleto.client.user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    R$ {boleto.amount.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pendente
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {selectedBoleto === boleto.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Valor"
                                                            value={confirmData.amount || ''}
                                                            onChange={(e) =>
                                                                setConfirmData({ ...confirmData, amount: parseFloat(e.target.value) })
                                                            }
                                                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={confirmData.paymentDate}
                                                            onChange={(e) =>
                                                                setConfirmData({ ...confirmData, paymentDate: e.target.value })
                                                            }
                                                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                                                        />
                                                        <button
                                                            onClick={() => handleConfirm(boleto.id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedBoleto(null)}
                                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBoleto(boleto.id);
                                                            setConfirmData({
                                                                amount: boleto.amount,
                                                                paymentDate: new Date().toISOString().split('T')[0],
                                                            });
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                                                    >
                                                        Confirmar Pagamento
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Automação</h4>
                    <p className="text-sm text-blue-800">
                        Ao confirmar um pagamento, o sistema automaticamente:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                        <li>Gera um recibo de pagamento</li>
                        <li>Emite a nota fiscal (NF-e)</li>
                        <li>Envia emails para o cliente com os documentos</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
