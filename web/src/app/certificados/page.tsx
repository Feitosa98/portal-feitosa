'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Award, Download, Upload, Trash2 } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
}

export default function CertificadosPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await api.get('/documents?type=CERTIFICATE');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const clientId = user.id; // This should be the client ID, adjust as needed

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', clientId);
            formData.append('type', 'CERTIFICATE');

            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            loadDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload do certificado');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este certificado?')) return;

        try {
            await api.delete(`/documents/${id}`);
            loadDocuments();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Erro ao deletar certificado');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
                            onClick={() => router.push('/dashboard')}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            ← Voltar
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
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
                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <label className="block">
                        <input
                            type="file"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-700 font-medium">
                                {uploading ? 'Fazendo upload...' : 'Clique para fazer upload de um certificado'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                PDF, JPG, PNG até 10MB
                            </p>
                        </div>
                    </label>
                </div>

                {/* Documents List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Nenhum certificado encontrado
                        </h3>
                        <p className="text-gray-600">
                            Faça upload dos seus certificados usando o botão acima.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                                <div className="flex items-start justify-between mb-4">
                                    <Award className="h-10 w-10 text-blue-600" />
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                                    {doc.name}
                                </h3>
                                {doc.description && (
                                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                                )}
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <button
                                    onClick={() => window.open(doc.filePath, '_blank')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
