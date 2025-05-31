import { useMemo, useState } from 'react';
import { PaymentModal } from './PaymentModal';
import { postPagarRequest, postTransactionRequest, getCuponRequest } from '../api/Cart.api';
import { useParfum } from '../context/ParfumContext'


export const CartResume = ({ products }) => {
  const { cart, clearCart, URLFrontend } = useParfum();  // Obtenemos el carrito desde el contexto
  const [isModalOpen, setModalOpen] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [dataCupon, setDataCupon] = useState({
    _id: '',
    valido: false,
    texto: '¿Tienes un cupón de descuento?'
  });
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const { totalItems, subTotal, totalPrice, totalSavings, totalSavingsCoupon, flashSavings, productDetails, productsId, typesId, quantities } = useMemo(() => {
    let subTotal = 0; 
    let totalPrice = 0; 
    let totalItems = 0;
    let totalSavings = 0;
    let totalSavingsCoupon = 0;
    let flashSavings = 0;
    let productDetails = [];
    let productsId = [];
    let typesId = [];
    let quantities = [];
    
    // Recorremos los productos en 'products' para mantener el orden original
    products.forEach((product) => {
      // Buscamos el producto correspondiente en el carrito
      const item = cart.find(
        (cartItem) => cartItem.id === product.parfum._id && cartItem.types_id === product.type._id
      );
      const validFlash = product?.type?.type_of_sale == 'Flash' && product?.type?.quantity_flash > 0 ? true : false

      if (item) {
        const quantity = item.quantity;  // Cantidad desde el carrito
        const price = product.type.price || 0;  // Precio del producto
        const oldPrice = product.type.old_price || 0;  // Precio anterior

        // Calculamos el subTotal y el total de cada producto
        subTotal += oldPrice * quantity;
        totalPrice += price * quantity; // El total antes de aplicar descuento
        totalItems += quantity; // Contamos las unidades
        flashSavings += validFlash ? (product.type.price - product.type.price_flash) * item.quantity : 0
        totalSavings += (oldPrice - price) * quantity; // Calculamos el ahorro
        if (dataCupon?.productsThatApply == 0 || dataCupon?.productsThatApply == product.parfum.gender){
          totalSavingsCoupon += (price * quantity)*(percentage/100)
        }

        // Agregamos el detalle del producto al array de detalles, manteniendo el orden de 'products'
        productDetails.push({
          parfum_id: product.parfum._id,
          types_id: product.type._id,
          brand_name: product.parfum.brand_id_fk.brand_name,
          title: product.parfum.title,
          quantity,
          version_name: product.parfum.version_id_fk.version_name,
          ml: product.type.ml,
          price: product.type.price,
          price_flash: product.type.price_flash,
          old_price: product.type.old_price,
          subTotal: price * quantity,
          type_of_sale: product.type.type_of_sale
        });
        productsId.push(`${product.parfum?._id}=${product.parfum?.title}`)
        typesId.push(product.type?._id)
        quantities.push(quantity)
      }
    });

    totalSavings = subTotal - totalPrice;
    totalPrice = totalPrice - flashSavings;


    return { totalItems, subTotal, totalPrice, totalSavings, totalSavingsCoupon, productDetails, productsId, typesId, quantities, flashSavings };
  }, [cart, products, dataCupon]); // Dependemos de 'cart' y 'products'


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
    const transaction = {
      userName: data.name,
      phone: data.phone,
      direction: data.address,
      email: data.email,
      subTotal: subTotal.toFixed(2),
      total: (totalPrice.toFixed(2)-totalSavingsCoupon.toFixed(2)).toFixed(2),
      code: dataCupon._id,
      products: productsId,
      productsTypes: typesId,
      quantities: quantities,
    }

    try {
        const res = await postTransactionRequest(transaction);
        if (res.status === 200) {
            console.log('Transacción guardada con éxito');
        } else {
            console.error('Ocurrió un error al guardar la transacción.');
        }
    } catch (error) {
        console.error('Error al guardar la transacción:', error);
    }

    let name = data.name
    let message = `Hola, soy ${name} y estos son los productos que he seleccionado desde el sitio web de Royale Panama:\n\n`;
  
    productDetails.forEach((item) => {
      message += `Producto: ${item.brand_name} ${item.title}\n`;
      message += `Versión: ${item.version_name} - ${item.ml}ml\n`;
      message += `Precio de Promoción: $${Number(item.price).toFixed(2)}\n`;
      if (item?.price_flash && item?.type_of_sale == 'Flash'){
        message += `Descuento Flash: -$${((Number(item.price_flash).toFixed(2)-Number(item.price).toFixed(2))*-1).toFixed(2)}\n`;
      }
      message += `Precio Regular: $${Number(item.old_price).toFixed(2)}\n`;
      message += `Cantidad: ${item.quantity}\n`;
      message += `Enlace: ${URLFrontend}/parfum?id=${item.parfum_id}\n\n`;
    });
  
    let total = productDetails.reduce((sum, item) => sum + item.subTotal, 0);
    if (dataCupon.valido){
      message += `Cupón: ${dataCupon.code}, -$${totalSavingsCoupon.toFixed(2)} (-${dataCupon.texto})\n\n`;
      total = (total-totalSavingsCoupon.toFixed(2)).toFixed(2)
    }
    message += `Total: $${total}\n\n`;
    message += `Me puedes contactar de la siguiente manera:\n`;
    message += `Número de Teléfono: +507 ${data.phone}\n`;
    message += `Correo: ${data.email}`;
    
    try {
      const response = await postPagarRequest(message, name);
      if (response) {
        handleResponse(response);
      } else {
        handleResponse({ res: false });
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      handleResponse({ res: false });
    }
  
    handleCloseModal();
    // Construir el enlace a WhatsApp con un mensaje dinámico
    const phoneNumber = "50765623382"; // Reemplaza con el número de WhatsApp
    const whatsappMessage = encodeURIComponent(message); // Codificar mensaje
    let whatsappURL = ''

    // Redirigir al enlace de WhatsApp
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
      whatsappURL = `whatsapp://send?phone=${phoneNumber}&text=${whatsappMessage}`;
    } else {
      whatsappURL = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`
    }

    window.open(whatsappURL, "_blank");
  };

  const searchCupon = async () => {
    const cupon = document.getElementById('cupon').value.toUpperCase()
    try{
      const response = await getCuponRequest(cupon)
      setDataCupon(response.data)
      setPercentage(response.data.percentage)
    } catch (error) {
      setDataCupon({
        _id: '',
        valido: false,
        texto: 'Cupón no Válido'
      })     
    }
  }


  return (
    <div className='cardResume'>
      <h2>Resumen del Pedido</h2>
      <div>
        {productDetails.map((item, index) => (
          <div className='liResumen' key={index}>
            <p>{item.brand_name} {item.title} X {item.quantity}</p>
            <p>${item.old_price.toFixed(2)}</p>
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
        {
          (flashSavings > 0) && (
            <div className='liResumen'>
              <p>Descuentos Flash</p>
              <p style={{ 'color': 'red' }}>-${flashSavings.toFixed(2)}</p>
            </div>
          )
        }
        <div className='liResumen' style={{display: dataCupon.valido ? 'flex' : 'none'}}>
          <p>Cupón</p>
          <p style={{ 'color': 'red' }}>-${totalSavingsCoupon.toFixed(2)} (-{dataCupon.percentage}%)</p>
        </div>
        <input type="hidden" name="codeId" id="codeId" value={dataCupon._id}/>
        <p style={{fontSize: '14px', color: dataCupon.valido ? 'var(--color-rojo)' : 'black', margin: '0px'}}>{dataCupon.texto}</p>
        <div className='liResumen' style={{marginTop: '4px'}}>
          <input type="text" className='cuponRoyale' name='cupon' id='cupon' placeholder='CUPONROYALE' readOnly={dataCupon.valido}
            style={{color: dataCupon.valido ? 'grey' : 'black'}} />
          <button onClick={(e) => {e.preventDefault(); searchCupon()}} className='anadirCupon' disabled={dataCupon.valido}>Añadir</button>
        </div>
        <hr />
        <div className='liResumen'>
          <p>Total</p>
          <p>${(totalPrice.toFixed(2)-totalSavingsCoupon.toFixed(2)).toFixed(2)}</p>
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
