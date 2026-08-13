import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const postCartRequest = async (cart) =>
    await axios.post(`${URL}/cart`, cart, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });

export const postPagarRequest = async (message, name, phone = '') => {
    // Normaliza el teléfono: quita no-dígitos y antepone 507 si falta
    const digits = phone.replace(/\D/g, '');
    const waPhone = digits.startsWith('507') ? digits : `507${digits}`;

    try {
        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: 'service_fqjag8l',
            template_id: 'template_boebcu4',
            user_id: 'OR5r_YL2H4xVl2GiR',
            template_params: {
                name,
                message,
                phone: waPhone,
            }
        });

        return { res: true, message: 'Correo enviado correctamente' }
    } catch (error) {
        return { res: false, msg: error.response?.data || error.message }
    }
}


export const postTransactionRequest = async (transaction) =>
    await axios.post(`${URL}/transaction`, transaction, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });

    
export const getCuponRequest = async (cupon) =>
    await axios.get(`${URL}/cupon?id=${cupon}`)

export const getDeliveryOptionsRequest = async () =>
    await axios.get(`${URL}/delivery/public`)

export const postResolveDeliveryRequest = async (province, district, corregimiento) =>
    await axios.post(`${URL}/delivery/public/resolve`, { province, district, corregimiento })

export const postYappyCheckoutRequest = async (data) =>
    await axios.post(`${URL}/yappy/checkout`, data)

export const postYappyVerifyRequest = async (data) =>
    await axios.post(`${URL}/yappy/verify`, data)

export const postWompiCheckoutRequest = async (data) =>
    await axios.post(`${URL}/wompi/checkout`, data)

export const getWompiStatusRequest = async (wompiId) =>
    await axios.get(`${URL}/wompi/status?wompi_id=${wompiId}`)

export const postNewsletterRequest = async (email) =>
    await axios.post(`${URL}/newsletter`, { email })

// ── Emails al cliente via EmailJS ─────────────────────────────────────────────
// Requiere crear dos plantillas en EmailJS que usen {{to_email}} como destinatario.
const EMAILJS_SERVICE  = 'service_fqjag8l';
const EMAILJS_USER     = 'OR5r_YL2H4xVl2GiR';
// TODO: crear plantillas en EmailJS y actualizar estos IDs:
const TEMPLATE_CLIENT_CONFIRM  = 'template_confirm_client';  // Confirmación de compra al cliente
const TEMPLATE_CLIENT_DELIVERY = 'template_delivery_client'; // Aviso de entrega al cliente

export const postClientConfirmEmail = async ({ to_email, to_name, order_number, total, products, phone }) => {
    if (!to_email) return;
    try {
        await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: EMAILJS_SERVICE,
            template_id: TEMPLATE_CLIENT_CONFIRM,
            user_id: EMAILJS_USER,
            template_params: { to_email, to_name, order_number, total, products, phone },
        });
    } catch (e) { console.warn('Email confirmación no enviado:', e?.response?.data || e.message); }
};

export const postClientDeliveryEmail = async ({ to_email, to_name, order_number, delivered_by, delivery_note }) => {
    if (!to_email) return;
    try {
        await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: EMAILJS_SERVICE,
            template_id: TEMPLATE_CLIENT_DELIVERY,
            user_id: EMAILJS_USER,
            template_params: { to_email, to_name, order_number, delivered_by, delivery_note },
        });
    } catch (e) { console.warn('Email entrega no enviado:', e?.response?.data || e.message); }
};