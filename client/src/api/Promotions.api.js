import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'https://api.royalepanama.com'

export const getPromotions = async () => 
    await axios.get(`${URL}/promotions`);
