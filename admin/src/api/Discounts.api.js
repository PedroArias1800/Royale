import axios from 'axios'

export const getDiscountRulesRequest = async (page = 1) =>
    await axios.get(`/api/discounts?page=${page}`)

export const postDiscountRuleRequest = async (data) =>
    await axios.post('/api/discounts', data)

export const putDiscountRuleRequest = async (id, data) =>
    await axios.put(`/api/discounts/${id}`, data)

export const deleteDiscountRuleRequest = async (id) =>
    await axios.delete(`/api/discounts/${id}`)

export const postDiscountPreviewRequest = async (filters) =>
    await axios.post('/api/discounts/preview', filters)

export const postFilteredDiscountsRequest = async (page = 1, filter) =>
    await axios.post(`/api/discounts/filtered?page=${page}`, filter)
