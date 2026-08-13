import axios from './axios'
import baseAxios from 'axios'

export const getConsolidacionRequest = async (date) =>
    await axios.get(`/api/consolidacion${date ? `?date=${date}` : ''}`)

export const getConsolidacionRangeRequest = async (dateFrom, dateTo) =>
    await axios.get(`/api/consolidacion?date_from=${dateFrom}&date_to=${dateTo}`)

export const putDeliveryStatusRequest = async (txId, delivery_status, delivered_by = '', delivery_note = '') =>
    await axios.put(`/api/consolidacion/${txId}/delivery`, { delivery_status, delivered_by: delivered_by || undefined, delivery_note: delivery_note || undefined })

// Envía correo de entrega al cliente via EmailJS (requiere plantilla template_delivery_client)
export const postClientDeliveryEmail = async ({ to_email, to_name, order_number, delivered_by, delivery_note }) => {
    if (!to_email) return;
    try {
        await baseAxios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: 'service_fqjag8l',
            template_id: 'template_delivery_client',
            user_id: 'OR5r_YL2H4xVl2GiR',
            template_params: { to_email, to_name, order_number, delivered_by, delivery_note },
        });
    } catch (e) { console.warn('Email entrega no enviado:', e?.response?.data || e.message); }
};
