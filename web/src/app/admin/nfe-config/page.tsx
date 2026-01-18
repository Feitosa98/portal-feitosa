'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, FileKey, AlertCircle, FileText } from 'lucide-react';

export default function NfeConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [environment, setEnvironment] = useState('HOMOLOGATION');
    const [certificatePass, setCertificatePass] = useState('');
    const [certificatePath, setCertificatePath] = useState<string | null>(null);

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
            const response = await api.get('/nfe-config');
            setEnvironment(response.data.environment);
            setCertificatePath(response.data.certificatePath);
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/nfe-config', {
                environment,
                certificatePass: certificatePass || undefined,
            });
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        setMessage(null);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/nfe-config/certificate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage({ type: 'success', text: 'Certificado enviado com sucesso!' });
            setCertificatePath(response.data.path);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao enviar certificado.' });
        } finally {
            setUploading(false);
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
                        <h1 className="text-2xl font-bold text-gray-900">Configuração NF-e</h1>
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
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-8">

                        {message && (
                            <div className={`mb-6 p-4 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <AlertCircle size={20} />
                                <span>{message.text}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-8 pb-4 border-b">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Parâmetros de Emissão</h2>
                                <p className="text-sm text-gray-600">Configure o ambiente e as credenciais para emissão de Notas Fiscais</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Environment Section */}
                            <section>
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Ambiente</h3>
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`
                                border-2 rounded-lg p-4 cursor-pointer transition-all
                                ${environment === 'HOMOLOGATION' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                            `}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="environment"
                                                    value="HOMOLOGATION"
                                                    checked={environment === 'HOMOLOGATION'}
                                                    onChange={(e) => setEnvironment(e.target.value)}
                                                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <span className="block font-medium text-gray-900">Homologação</span>
                                                    <span className="text-sm text-gray-500">Para testes e validação</span>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`
                                border-2 rounded-lg p-4 cursor-pointer transition-all
                                ${environment === 'PRODUCTION' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
                            `}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="environment"
                                                    value="PRODUCTION"
                                                    checked={environment === 'PRODUCTION'}
                                                    onChange={(e) => setEnvironment(e.target.value)}
                                                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                                                />
                                                <div>
                                                    <span className="block font-medium text-gray-900">Produção</span>
                                                    <span className="text-sm text-gray-500">Emissão com valor fiscal</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha do Certificado Digital</label>
                                        <input
                                            type="password"
                                            value={certificatePass}
                                            onChange={(e) => setCertificatePass(e.target.value)}
                                            placeholder="****************"
                                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Preencha apenas se desejar alterar a senha atual.</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-70"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </form>
                            </section>

                            {/* Certificate Upload Section */}
                            <section className="border-t pt-8">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Certificado Digital (A1)</h3>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`p-4 rounded-full ${certificatePath ? 'bg-green-100' : 'bg-gray-200'}`}>
                                                <FileKey size={32} className={certificatePath ? 'text-green-600' : 'text-gray-500'} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {certificatePath ? 'Certificado Instalado' : 'Nenhum certificado encontrado'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {certificatePath ? 'O sistema está pronto para assinar documentos.' : 'Faça o upload do arquivo .pfx ou .p12'}
                                                </p>
                                            </div>
                                        </div>

                                        <label className="inline-block">
                                            <span className={`
                                    cursor-pointer inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition
                                    ${uploading
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                                                }
                                `}>
                                                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".pfx,.p12"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                        </label>
                                        {uploading && <span className="ml-3 text-sm text-blue-600">Carregando arquivo...</span>}
                                    </div>

                                    <div className="w-full md:w-64 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} /> Requisitos
                                        </h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Modelo A1 (Arquivo)</li>
                                            <li>Extensão .pfx ou .p12</li>
                                            <li>Senha deve estar correta</li>
                                            <li>Validade em dia</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
