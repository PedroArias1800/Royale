import React, { useMemo, useContext, useState } from 'react';
import { ParfumContext } from "../context/ParfumContext";
import { PaymentModal } from './PaymentModal';
import { postPagarRequest } from '../api/Cart.api';


export const CartResume = ({ products }) => {
  const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'
  const { cart, clearCart } = useContext(ParfumContext);  // Obtenemos el carrito desde el contexto
  const [isModalOpen, setModalOpen] = useState(false);
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const { totalItems, subTotal, totalPrice, totalSavings, productDetails } = useMemo(() => {
    let subTotal = 0; 
    let totalPrice = 0; 
    let totalItems = 0;
    let totalSavings = 0;
    let productDetails = [];  // Inicializamos aquí el array para los detalles del producto

    // Recorremos los productos en 'products' para mantener el orden original
    products.forEach((product) => {
      // Buscamos el producto correspondiente en el carrito
      const item = cart.find(
        (cartItem) => cartItem.id.toString() === product.parfum_id.toString() && cartItem.types_id.toString() === product.types_id.toString()
      );

      if (item) {
        const quantity = item.quantity;  // Cantidad desde el carrito
        const price = product.price || 0;  // Precio del producto
        const oldPrice = product.old_price || 0;  // Precio anterior

        // Calculamos el subTotal y el total de cada producto
        subTotal += oldPrice * quantity;
        totalPrice += price * quantity; // El total antes de aplicar descuento
        totalItems += quantity; // Contamos las unidades
        totalSavings += (oldPrice - price) * quantity; // Calculamos el ahorro

        // Agregamos el detalle del producto al array de detalles, manteniendo el orden de 'products'
        productDetails.push({
          parfum_id: product.parfum_id,
          types_id: product.types_id,
          brand_name: product.brand_name,
          title: product.title,
          quantity,
          version_name: product.version_name,
          ml: product.ml,
          price: product.price,
          old_price: product.old_price,
          subTotal: price * quantity
        });
      }
    });

    totalSavings = subTotal - totalPrice;

    return { totalItems, subTotal, totalPrice, totalSavings, productDetails };
  }, [cart, products]); // Dependemos de 'cart' y 'products'


  const handleResponse = (response) => {
    let alertMessage = '';
    let color = '';
    let color2 = '';
  
    if (response && response.res === true) {
      // Mostramos mensaje de éxito
      alertMessage = "¡Gracias por tu compra, en unos momentos contactaremos contigo!";
      color = '--color-dorado';
      color2 = '--color-dorado-hover';
  
    } else {

      alertMessage = "Ha ocurrido un error, inténtelo nuevamente en unos minutos.";
      color = '--color-rojo-alert';
      color2 = '--color-rojo-alert-hover';
    }
    clearCart(alertMessage, color, color2);
  ;
  };
  
  const handleFormSubmit = async (data) => {
    let message = `Has recibido un mensaje de ${data.name}, estos son los productos que ha seleccionado desde el sitio web de Royale:\n\n`;
  
    productDetails.forEach((item) => {
      message += `Producto: ${item.brand_name} ${item.title}\n`;
      message += `Versión: ${item.version_name} - ${item.ml}ml\n`;
      message += `Precio de Promoción: $${Number(item.price).toFixed(2)}\n`;
      message += `Precio Regular: $${Number(item.old_price).toFixed(2)}\n`;
      message += `Cantidad: ${item.quantity}\n`;
      message += `Enlace: ${URL}/parfum?id=${item.parfum_id}\n\n`;
    });
  
    const total = productDetails.reduce((sum, item) => sum + item.subTotal, 0);
    message += `Total: $${total.toFixed(2)}\n\n`;
    message += `Contactos:\n`;
    message += `Número de Teléfono: +507 ${data.phone}\n`;
    message += `Correo: ${data.email}\n\n`;
    message += `ROYALE, FINE PARFUM\n`;
    message += `${URL}`;
  
    const requestBody = { message: message, name: data.name };
  
    try {
      const response = await postPagarRequest(JSON.stringify(requestBody));
      if (response) {
        handleResponse(response);
      } else {
        console.log(response)
        handleResponse({ res: false });
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      handleResponse({ res: false });
    }
  
    // handleCloseModal();
  };
  

  return (
    <div className='cardResume'>
      <h2>Resumen del Pedido</h2>
      <div>
        {productDetails.map((item, index) => (
          <div className='liResumen' key={index}>
            <p>{item.brand_name} {item.title} X {item.quantity}</p>
            <p>${item.subTotal.toFixed(2)}</p>
          </div>
        ))}
        <hr />
        <div className='liResumen'>
          <p>Sub Total</p>
          <p>${subTotal.toFixed(2)}</p>
        </div>
        <div className='liResumen'>
          <p>Promociones</p>
          <p style={{ 'color': 'red' }}>-${totalSavings.toFixed(2)}</p>
        </div>
        <hr />
        <div className='liResumen'>
          <p>Total</p>
          <p>${totalPrice.toFixed(2)}</p>
        </div>
        <div className='liResumen'>
          <p>Has Ahorrado</p>
          <p style={{ 'color': 'var(--color-rojo)' }}>${totalSavings.toFixed(2)}</p>
        </div>
      </div>
      <div className='div2'>
        <button className='comprar' onClick={handleOpenModal}>{`Comprar Ahora (${totalItems})`}</button>
        <PaymentModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
};
