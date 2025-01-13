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
            service_id: 'service_fqjag8l',
            template_id: 'template_boebcu4',
            user_id: 'OR5r_YL2H4xVl2GiR',
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


export const postTransactionRequest = async (transaction) =>
    await axios.post(`${URL}/transaction`, transaction, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });
