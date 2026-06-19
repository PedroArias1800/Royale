import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const getPromotions = async () => 
    await axios.get(`${URL}/promotions`);
