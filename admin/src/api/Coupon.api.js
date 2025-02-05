import axios from './axios.js'

export const postCouponsRequest = async (coupon) =>
    await axios.post(`/api/coupon`, coupon, {
        headers: { 'Content-Type': 'application/json' }
    })

export const putCouponsRequest = async (id, coupon) =>
    await axios.put(`/api/coupon/${id}`, coupon, {
        headers: { 'Content-Type': 'application/json' }
    })

export const deleteCouponsRequest = async (id) =>
    await axios.delete(`/api/coupon/${id}`)