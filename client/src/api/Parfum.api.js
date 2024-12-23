import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const getParfumVersionRequest = async (id) => 
    await axios.get(`${URL}/parfum?id=${id}`);

export const getParfumsRequest = async (limit) => 
    await axios.get(`${URL}/parfums`, {
        headers: {
            'limit': limit
        }
    });

export const getParfumsBodyRequest = async () => 
    await axios.get(`${URL}/parfums/body`);
