'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FolderOpen, File, Download, Upload, Trash2 } from 'lucide-react';

interface FileData {
    id: string;
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    folder?: string;
    createdAt: string;
}

export default function DrivePage() {
    const router = useRouter();
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const response = await api.get('/files');
            setFiles(response.data);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const clientId = user.id;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', clientId);

            await api.post('/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            loadFiles();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload do arquivo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja deletar este arquivo?')) return;

        try {
            await api.delete(`/files/${id}`);
            loadFiles();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Erro ao deletar arquivo');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        return '📎';
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
                        <h1 className="text-2xl font-bold text-gray-900">Meus Arquivos</h1>
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
                                {uploading ? 'Fazendo upload...' : 'Clique para fazer upload de arquivos'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Qualquer tipo de arquivo até 10MB
                            </p>
                        </div>
                    </label>
                </div>

                {/* Files List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : files.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FolderOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Nenhum arquivo encontrado
                        </h3>
                        <p className="text-gray-600">
                            Faça upload dos seus arquivos usando o botão acima.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Descrição
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tamanho
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{getFileIcon(file.mimeType)}</span>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {file.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {file.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatFileSize(file.fileSize)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => window.open(file.filePath, '_blank')}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
