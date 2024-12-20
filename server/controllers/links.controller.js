import dotenv from 'dotenv';
dotenv.config();

import { whatsapp } from '../lib/whatsapp.js';

const phoneNumber = process.env.PHONE_NUMBER;

export const sendWhatsapp = async (req, res) => {
  const message = req.body.message;
  try {
        const tel = phoneNumber;
        const chatId = tel.substring(1) + "@c.us";
        const number_details = await whatsapp.getNumberId(chatId);
        if (number_details) {
            await whatsapp.sendMessage(chatId, message);
            res.json({ res: true });
        } else {
            res.json({ res: false, message: "Número no válido" });
        }
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ res: false, error: 'Error interno del servidor' });
    }
};

// {
//   "message":   "Has recibido un mensaje de Pedro Arias, estos son los productos que ha seleccionado desde el sitio web de Royale:\n\nProducto: Dior Miss Dior\nVersión: Eau de Parfum - 100ml\nPrecio de Promoción: $85.00\nPrecio Regular: $120.00\nCantidad: 2\nEnlace: http://localhost:5173/parfum?id=2\n\nProducto: Dior Sauvage\nVersión: Eau de Parfum - 100ml\nPrecio de Promoción: $125.00\nPrecio Regular: $160.00\nCantidad: 1\nEnlace: http://localhost:5173/parfum?id=1\n\nTotal: $210.00\n\nContactos:\nNúmero de Teléfono: +507 6212-2951\nCorreo: pedrosoftdev18@gmail.com\n\nROYALE, FINE PARFUM\nhttp://localhost:5173"
// }
 