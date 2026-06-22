import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const getDiscountsPublicRequest = async () =>
    await axios.get(`${URL}/discounts/public`)
