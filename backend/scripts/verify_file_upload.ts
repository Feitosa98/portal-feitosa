
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

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
        console.log('✅ Logged in.');

        // Get Client
        const clientsRes = await axios.get(`${API_URL}/clients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const clientId = clientsRes.data[0].id;
        console.log(`✅ Using Client ID: ${clientId}`);

        // Create a dummy file
        const filePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(filePath, 'This is a test file for upload verification.');

        // 2. Upload Document (Inventory)
        console.log('\n2. Uploading Document (INVENTORY)...');
        const docForm = new FormData();
        docForm.append('file', fs.createReadStream(filePath));
        docForm.append('clientId', clientId);
        docForm.append('type', 'INVENTORY');
        docForm.append('description', 'Test Inventory File');

        const docRes = await axios.post(`${API_URL}/documents`, docForm, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...docForm.getHeaders()
            }
        });
        const docId = docRes.data.id;
        console.log('✅ Document Uploaded. ID:', docId);

        // 3. Upload File (Drive)
        console.log('\n3. Uploading File (Drive)...');
        const fileForm = new FormData();
        fileForm.append('file', fs.createReadStream(filePath));
        fileForm.append('clientId', clientId);
        fileForm.append('description', 'Test Drive File');

        const fileRes = await axios.post(`${API_URL}/files`, fileForm, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...fileForm.getHeaders()
            }
        });
        const fileId = fileRes.data.id;
        console.log('✅ File Uploaded. ID:', fileId);

        // 4. List Documents
        console.log('\n4. Listing Documents...');
        const listDocs = await axios.get(`${API_URL}/documents`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { clientId }
        });
        const foundDoc = listDocs.data.find((d: any) => d.id === docId);
        if (foundDoc) console.log('✅ Found uploaded document in list.');
        else console.error('❌ Document NOT found in list.');

        // 5. Cleanup
        console.log('\n5. Cleaning up (Deleting)...');
        await axios.delete(`${API_URL}/documents/${docId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Document Deleted.');

        // Clean up local dummy file
        fs.unlinkSync(filePath);

    } catch (error: any) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

run();
