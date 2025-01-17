import axios from 'axios'
const URL = 'http://93.188.162.15:4001'

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
