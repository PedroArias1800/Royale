import axios from './axios.js'

export const getParfumsRequest = async (page = 1) =>
    await axios.get(`/api/parfums?page=${page}`)

export const getAllParfumsRequest = async () =>
    await axios.get(`/api/parfums/all`)

export const postGetTypesRequest = async (countSell, page = 1) =>
    await axios.post(`/api/types?page=${page}`, {'countSell': countSell})

export const getAllTypesRequest = async () =>
    await axios.get(`/api/types/all`)

export const getBodiesRequest = async (page = 1) =>
    await axios.get(`/api/bodies?page=${page}`)

export const getAllBodiesRequest = async () =>
    await axios.get(`/api/bodies/all`)

export const getBrandsRequest = async (page = 1) =>
    await axios.get(`/api/brands?page=${page}`)

export const getAllBrandsRequest = async () =>
    await axios.get(`/api/brands/all`)

export const getVersionsRequest = async (page = 1) =>
    await axios.get(`/api/versions?page=${page}`)

export const getAllVersionsRequest = async () =>
    await axios.get(`/api/versions/all`)

export const getUsersRequest = async (page = 1) =>
    await axios.get(`/api/users?page=${page}`)

export const getAllUsersRequest = async () =>
    await axios.get(`/api/users/all`)

export const getPromotionsRequest = async (page = 1) =>
    await axios.get(`/api/promotions?page=${page}`)

export const getAllPromotionsRequest = async () =>
    await axios.get(`/api/promotions/all`)

export const getTransactionsRequest = async () =>
    await axios.get(`/transaction`, { 
        withCredentials: true
    });

    
export const putTransactionsRequest = async (id) =>
        await axios.put(`/transaction/${id}`)

export const getCouponsRequest = async (page = 1) =>
    await axios.get(`/api/coupons?page=${page}`)

export const getAllCouponsRequest = async () =>
    await axios.get(`/api/coupons/all`)


export const getTransactionsByUser = async (id) =>
    await axios.get(`/api/transactions/all/${id}`)

export const getCountTransactionsByUserThisMonth = async (id) =>
    await axios.get(`/api/transactions/monthly/${id}`)

export const getUsersByRoleSeller = async () =>
    await axios.get(`/api/users/sellers`)

export const getTypeByParfumId = async (parfumId) =>
    await axios.get(`/api/type/parfum/${parfumId}`)

export const getProvidersRequest = async (page = 1) =>
    await axios.get(`/api/providers?page=${page}`)

export const getAllProvidersRequest = async () =>
    await axios.get(`/api/providers/all`)
