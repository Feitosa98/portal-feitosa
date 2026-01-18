import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { Package, Download, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Document {
    id: string;
    name: string;
    description?: string;
    filePath: string;
    fileSize: number;
}

export default function InventoryScreen() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await api.get('/documents?type=INVENTORY');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (url: string) => {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const renderItem = ({ item }: { item: Document }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Package size={24} color="#F59E0B" />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.size}>{formatFileSize(item.fileSize)}</Text>
                </View>
            </View>

            {item.description && (
                <Text style={styles.description}>{item.description}</Text>
            )}

            <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(item.filePath)}
            >
                <Download size={16} color="#F59E0B" />
                <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Inventários</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                </View>
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Nenhum inventário encontrado</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
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
    description: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 12,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    downloadText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F59E0B',
    },
});
