import axios from "axios";
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

const instance = axios.create({
    baseURL: URL,
    withCredentials: true
})

export default instance