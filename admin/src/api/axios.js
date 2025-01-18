import axios from "axios";
const URL = 'https://api.royalepanama.com'

const instance = axios.create({
    baseURL: URL,
    withCredentials: true
})

export default instance