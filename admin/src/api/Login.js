import axios from './axios.js'

export const postLoginRequest = async (login) =>
    await axios.post(`/api/login`, login, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

export const postRegisterRequest = async (user) => 
    await axios.post(`/api/user`, user, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

export const postLogOutRequest = async () => 
    await axios.post(`/api/logout`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

export const verifyTokenRequest = async () => 
    await axios.get(`/api/verify`, { 
        withCredentials: true
    });