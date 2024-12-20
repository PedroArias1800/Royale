import React, { useMemo, useContext, useState } from 'react';
import { ParfumContext } from "../context/ParfumContext";
import { PaymentModal } from './PaymentModal';

export const CartResume = ({ products }) => {
  const { cart } = useContext(ParfumContext);  // Obtenemos el carrito desde el contexto
  const [isModalOpen, setModalOpen] = useState(false);
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  
  const { totalItems, subTotal, totalPrice, totalSavings } = useMemo(() => {
    let subTotal = 0; 
    let totalPrice = 0; 
    let totalItems = 0;
    let totalSavings = 0;

    // Obtenemos el carrito desde localStorage
    
    // Recorremos los productos en el carrito
    cart.forEach((item) => {
      // Buscamos el producto correspondiente en el array 'products'
      const product = products.find(
        (prod) => prod.parfum_id.toString() === item.id.toString() && prod.types_id.toString() === item.types_id.toString()
      );
      
      if (product) {
        const quantity = item.quantity; // Cantidad desde localStorage
        const price = product.price || 0;  // Precio del producto
        const oldPrice = product.old_price || 0;  // Precio anterior

        // Calculamos el subTotal y el total de cada producto
        subTotal += oldPrice * quantity;
        totalPrice += price * quantity; // El total antes de aplicar descuento
        totalItems += quantity; // Contamos las unidades

        // Calculamos el ahorro
        totalSavings += (oldPrice - price) * quantity;
      }
    });

    // El total de ahorros es la diferencia entre el subTotal y el totalPrice
    totalSavings = subTotal - totalPrice;

    return { totalItems, subTotal, totalPrice, totalSavings };
  }, [cart, products]); // Dependemos de 'cart' y 'products'

  const handleFormSubmit = (data) => {
    console.log("Datos enviados:", data);
    // Aquí puedes enviar los datos a tu backend
    handleCloseModal();
  };

  return (
    <div className='cardResume'>
      <h2>Resumen del Pedido</h2>
      <div>
        <div className='liResumen'>
          <p>Sub Total</p>
          <p>${subTotal.toFixed(2)}</p>
        </div>
        <div className='liResumen'>
          <p>Promociones</p>
          <p style={{'color': 'red'}}>-${totalSavings.toFixed(2)}</p>
        </div>
        <hr />
        <div className='liResumen'>
          <p>Total</p>
          <p>${totalPrice.toFixed(2)}</p>
        </div>
        <div className='liResumen'>
          <p>Has Ahorrado</p>
          <p style={{'color': 'var(--color-rojo)'}}>${totalSavings.toFixed(2)}</p>
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
