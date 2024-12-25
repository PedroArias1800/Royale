import axios from 'axios'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const postCartRequest = async (cart) =>
    await axios.post(`${URL}/cart`, cart, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });

export const postPagarRequest = async (message, name) => {
    try {
        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: 'service_6lj0xhq',
            template_id: 'template_snrb433',
            user_id: 'rjA015kN-lpTr5sSD',
            template_params: {
                name: name,
                message: message
            }
        });

        return { res: true, message: 'Correo enviado correctamente' }
    } catch (error) {
        return { res: false, msg: error.response?.data || error.message }
    }
}