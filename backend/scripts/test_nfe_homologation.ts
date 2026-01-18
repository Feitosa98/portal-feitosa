
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_URL = 'http://localhost:3001/api';
let token = '';

async function run() {
    try {
        console.log('1. Authentication...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@portal.com',
            password: 'senha123'
        });
        token = loginRes.data.token;
        console.log('✅ Logged in.');

        console.log('\n2. Setting Config to HOMOLOGATION...');
        // Set config
        await axios.put(`${API_URL}/nfe-config`, {
            environment: 'HOMOLOGATION'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Environment set to HOMOLOGATION');

        console.log('\n3. Uploading Dummy Certificate...');
        const dummyCertPath = path.join(__dirname, 'test_certificate.pfx');
        fs.writeFileSync(dummyCertPath, 'DUMMY CERTIFICATE CONTENT');

        const form = new FormData();
        form.append('file', fs.createReadStream(dummyCertPath));

        await axios.post(`${API_URL}/nfe-config/certificate`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log('✅ Dummy certificate uploaded');
        fs.unlinkSync(dummyCertPath);


        console.log('\n4. Creating Boleto & Simulating Payment (Triggers NFe)...');
        // Get client
        const clientRes = await axios.get(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
        const clientId = clientRes.data[0].id;

        // Create Boleto
        const boletoNum = `HOMOLOG-${Date.now()}`;
        const boletoRes = await axios.post(`${API_URL}/boletos`, {
            clientId,
            number: boletoNum,
            amount: 199.90, // Distinct amount to find later
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            description: 'Teste Homologação NFe'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Boleto created:', boletoNum);

        // Pay it
        await axios.post(`${API_URL}/payments/webhook`, {
            externalId: boletoNum,
            amount: 199.90,
            paymentDate: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Payment Webhook Sent');

        // Wait a bit for async automation? 
        // Automation service is async but called without await? No, usually awaited.
        // Let's check invoice list.
        setTimeout(async () => {
            console.log('\n5. Verifying Generated NFe...');
            const invoicesRes = await axios.get(`${API_URL}/invoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Find our invoice (amount 199.90)
            const invoice = invoicesRes.data.find((i: any) => i.amount === 199.90);

            if (invoice && invoice.nfePdf) {
                console.log('✅ Invoice Generated:', invoice.number);
                console.log('   PDF URL:', invoice.nfePdf);
                console.log('✅ SUCCESS: System is emitting in Homologation!');
            } else {
                console.error('❌ Invoice not found or PDF missing.');
            }
        }, 2000);

    } catch (error: any) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

run();
