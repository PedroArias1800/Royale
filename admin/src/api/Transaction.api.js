import axios from './axios.js'

export const getAllTransactionsRequest = async (page = 1) =>
    await axios.get(`/api/transaction/all?page=${page}`)
