'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Package, Download } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
    createdAt: string;
}

export default function InventariosPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

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
            const response = await api.get('/documents?type=INVENTORY');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
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
                        <h1 className="text-2xl font-bold text-gray-900">Inventários</h1>
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
                ) : documents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Nenhum inventário encontrado
                        </h3>
                        <p className="text-gray-600">
                            Seus inventários aparecerão aqui quando forem disponibilizados.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Package className="h-10 w-10 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {doc.name}
                                            </h3>
                                            {doc.description && (
                                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span>•</span>
                                                <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(doc.filePath, '_blank')}
                                        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center gap-2 flex-shrink-0"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
