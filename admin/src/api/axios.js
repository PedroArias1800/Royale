import axios from "axios";
const URL = 'http://93.188.162.15:4001'

const instance = axios.create({
    baseURL: URL,
    withCredentials: true
})

export default instance