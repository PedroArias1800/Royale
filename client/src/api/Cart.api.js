import axios from 'axios'
import emailjs from 'emailjs-com'
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

export const postCartRequest = async (cart) =>
    await axios.post(`${URL}/cart`, cart, {
        headers: {
            'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
        }
    });

export const postPagarRequest = async (requestBody) => {
    console.log(requestBody)
    try{
        const response = await emailjs
        .send(
            "service_6lj0xhq",
            "template_snrb433",
            requestBody,
            "rjA015kN-lpTr5sSD"
        )

        return { res: true, message: 'Correo enviado correctamente' }
    } catch (err) {
        return { res: false, msg: err.response?.data || err.message };
    }
}

    
    // try {
    //     const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
    //         service_id: 'service_6lj0xhq',    // Reemplaza con tu ID de servicio
    //         template_id: 'template_snrb433',   // Reemplaza con tu ID de plantilla
    //         user_id: 'rjA015kN-lpTr5sSD',     // Tu User ID de EmailJS
    //         template_params: {
    //             name: name,
    //             message: message
    //         }
    //     });

    //     return { res: true, message: 'Correo enviado correctamente' }
    // } catch (error) {
    //     return { res: false, msg: error.response?.data || error.message }
    // }

    // await axios.post(`${URL}/send`, requestBody, {
    //     headers: {
    //         'Content-Type': 'application/json' // Asegúrate de que el servidor entienda que es JSON
    //     }
    // });