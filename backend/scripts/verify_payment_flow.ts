
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
let token = '';

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@portal.com',
            password: 'senha123'
        });
        token = loginRes.data.token;
        console.log('✅ Logged in. Token:', token.substring(0, 10) + '...');

        console.log('\n2. Fetching Clients...');
        const clientsRes = await axios.get(`${API_URL}/clients`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        let clientId;
        if (clientsRes.data.length === 0) {
            console.log('No clients found. Creating one...');
            // Create client logic if needed, but assuming one exists from previous steps
            // For now, let's fail if no client, or maybe the browser agent created one?
            const createClient = await axios.post(`${API_URL}/clients`, {
                name: 'Cliente Teste Script',
                email: 'script@teste.com',
                password: 'password',
                companyName: 'Script Co',
                cpfCnpj: '11122233344',
                phone: '11999998888'
            }, { headers: { Authorization: `Bearer ${token}` } });
            clientId = createClient.data.id;
        } else {
            clientId = clientsRes.data[0].id;
        }
        console.log('✅ Using Client ID:', clientId);

        console.log('\n3. Creating Boleto...');
        const boletoNum = `SCRIPT-${Date.now()}`;
        const boletoRes = await axios.post(`${API_URL}/boletos`, {
            clientId,
            number: boletoNum,
            amount: 150.50,
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            description: 'Payment verification script'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const boletoId = boletoRes.data.id;
        console.log('✅ Boleto Created:', boletoRes.data.number, '| ID:', boletoId);
        console.log('   PDF URL:', boletoRes.data.pdfUrl);

        console.log('\n4. Simulating Payment Webhook...');
        const webhookRes = await axios.post(`${API_URL}/payments/webhook`, {
            externalId: boletoRes.data.number, // In our sim, we look up by number
            amount: 150.50,
            paymentDate: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${token}` } // Webhook doesn't actually need auth in our code, but good practice
        });
        console.log('✅ Webhook Response:', webhookRes.data);

        console.log('\n5. Verifying Boleto Status...');
        const checkBoleto = await axios.get(`${API_URL}/boletos`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { clientId } // Filter to find ours easily
        });
        const myBoleto = checkBoleto.data.find((b: any) => b.id === boletoId);

        if (myBoleto.status === 'PAID') {
            console.log('✅ SUCCESS: Boleto status is PAID');
        } else {
            console.error('❌ FAILURE: Boleto status is', myBoleto.status);
        }

        console.log('\n6. Checking for Invoices...');
        const invoicesRes = await axios.get(`${API_URL}/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Logic to find invoice might differ as there isn't a direct "get invoice by boleto" endpoint exposed easily, 
        // but let's check if count > 0 or if we see recent one.
        const recentInvoice = invoicesRes.data.find((i: any) => i.clientId === clientId && i.amount === 150.50);
        if (recentInvoice) {
            console.log('✅ SUCCESS: Invoice generated:', recentInvoice.number);
            console.log('   PDF URL:', recentInvoice.nfePdf);
        } else {
            console.error('❌ WARNING: Invoice not found for this amount/client');
        }

    } catch (error: any) {
        console.error('❌ Error caught:', error.response ? error.response.data : error.message);
    }
}

run();
