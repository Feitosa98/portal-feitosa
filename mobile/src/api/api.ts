import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your computer's IP address if testing on a physical device
// Android Emulator uses 10.0.2.2 to access localhost
const API_URL = 'http://10.0.2.2:3001/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
