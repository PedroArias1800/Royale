import axios from './axios.js'

export const postFilteredParfumsRequest = async (page = 1, filter) =>
    await axios.post(`/api/parfums/filtered?page=${page}`, filter)

export const postFilteredTypesRequest = async (page = 1, filter) =>
    await axios.post(`/api/typess/filtered?page=${page}`, filter)

export const postFilteredBrandsRequest = async (page = 1, filter) =>
    await axios.post(`/api/brands/filtered?page=${page}`, filter)

export const postFilteredVersionsRequest = async (page = 1, filter) =>
    await axios.post(`/api/versions/filtered?page=${page}`, filter)

export const postFilteredBodiesRequest = async (page = 1, filter) =>
    await axios.post(`/api/bodies/filtered?page=${page}`, filter)

export const postFilteredUsersRequest = async (page = 1, filter) =>
    await axios.post(`/api/users/filtered?page=${page}`, filter)

export const postFilteredTransactionsRequest = async (page = 1, filter) =>
    await axios.post(`/api/transactions/filtered?page=${page}`, filter)

export const postFilteredCouponsRequest = async (page = 1, filter) =>
    await axios.post(`/api/coupons/filtered?page=${page}`, filter)

