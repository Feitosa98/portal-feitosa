import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/api';
import { FileText, Download, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Invoice {
    id: string;
    number: string;
    amount: number;
    issueDate: string;
    description?: string;
    nfePdf?: string;
}

export default function InvoicesScreen() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const response = await api.get('/invoices');
            setInvoices(response.data);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (url: string) => {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    };

    const renderItem = ({ item }: { item: Invoice }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <FileText size={24} color="#2563EB" />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.invoiceNumber}>Nota #{item.number}</Text>
                    <Text style={styles.date}>{new Date(item.issueDate).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={styles.amount}>R$ {item.amount.toFixed(2)}</Text>
            </View>

            {item.description && (
                <Text style={styles.description}>{item.description}</Text>
            )}

            {item.nfePdf && (
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item.nfePdf!)}
                >
                    <Download size={16} color="#2563EB" />
                    <Text style={styles.downloadText}>Download PDF</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Notas Fiscais</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Nenhuma nota fiscal encontrada</Text>
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
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    invoiceNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    date: {
        fontSize: 12,
        color: '#6B7280',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
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
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    downloadText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2563EB',
    },
});
