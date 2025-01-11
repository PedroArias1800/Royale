import axios from './axios.js'

export const postUsersRequest = async (user) =>
    await axios.post(`/api/user`, user)

export const putUsersRequest = async (id, user) =>
    await axios.put(`/api/user/${id}`, user)
