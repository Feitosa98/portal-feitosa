import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { HardDrive, Download, ArrowLeft, Upload, Trash2, File as FileIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FileData {
    id: string;
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
}

export default function DriveScreen() {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const response = await api.get('/files');
            setFiles(response.data);
        } catch (error) {
            console.error('Error loading drive files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setUploading(true);

            const userStr = await AsyncStorage.getItem('user');
            const user = JSON.parse(userStr || '{}');

            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'application/octet-stream',
            } as any);
            formData.append('clientId', user.id);

            await api.post('/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Sucesso', 'Arquivo enviado com sucesso!');
            loadFiles();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Erro', 'Falha ao enviar arquivo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Confirmar exclusão',
            'Tem certeza que deseja apagar este arquivo?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Apagar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/files/${id}`);
                            loadFiles();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível apagar o arquivo.');
                        }
                    }
                }
            ]
        );
    };

    const handleDownload = (url: string) => {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const renderItem = ({ item }: { item: FileData }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <FileIcon size={24} color="#EC4899" />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.size}>{formatFileSize(item.fileSize)}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(item.filePath)}
            >
                <Download size={16} color="#EC4899" />
                <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Drive</Text>
                </View>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Upload size={20} color="#FFF" />
                            <Text style={styles.uploadButtonText}>Upload</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EC4899" />
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Nenhum arquivo encontrado</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    uploadButton: {
        backgroundColor: '#EC4899',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    uploadButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    list: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    size: {
        fontSize: 12,
        color: '#6B7280',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDF2F8',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    downloadText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EC4899',
    },
});
