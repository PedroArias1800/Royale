import React, { useEffect, useState } from 'react';
import { useParfum } from '../context/ParfumContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';

export const CartSummary = ({ product }) => {
    const [cart, setCart] = useState([]);
    const { products } = useParfum();

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        setCart(storedCart);
      }, []);
    
      const updateCart = (updatedCart) => {
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      };
    
      const incrementQuantity = (idVersion) => {
        const updatedCart = cart.map((item) =>
          item.idVersion === idVersion ? { ...item, quantity: item.quantity + 1 } : item
        );
        updateCart(updatedCart);
      };
    
      const decrementQuantity = (idVersion) => {
        const updatedCart = cart
          .map((item) =>
            item.idVersion === idVersion && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0);
        updateCart(updatedCart);
      };

    // // Efecto para encontrar el producto actual
    // useEffect(() => {
    //     if (!productIn) return;

    //     const productData = products.Parfum.find((item) => item.id === productIn.id);

    //     if (productData) {
    //         const filteredType = productData.types.find((type) => type.idVersion === productIn.idVersion);

    //         if (filteredType) {
    //             const updatedProductData = {
    //                 ...productData,
    //                 types: filteredType,
    //             };

    //             setProductActual(updatedProductData);
    //         } else {
    //             setProductActual(null);
    //         }
    //     } else {
    //         setProductActual(null);
    //     }
    // }, [productIn, products]);

    // // Efecto para actualizar el carrito y localStorage
    // useEffect(() => {
    //     if (!productIn || !productActual) return;

    //     setCart((prevCart) => {
    //         const updatedCart = prevCart.map((item) => {
    //             if (item.id === productIn.id && item.idVersion === productIn.idVersion) {
    //                 return { ...item, cantidad: productIn.cantidad };
    //             }
    //             return item;
    //         });

    //         localStorage.setItem('cart', JSON.stringify(updatedCart));
    //         return updatedCart;
    //     });
    // }, [productIn, productActual, setCart]);

    // const handleMoreCantidad = () => {
    //     if (!productIn) return;
    //     const updatedProductIn = {
    //         ...productIn,
    //         cantidad: Math.min(productIn.cantidad + 1, 10),
    //     };
    //     setProductIn(updatedProductIn);
    // };

    // const handleSubCantidad = () => {
    //     if (!productIn) return;
    //     const updatedProductIn = {
    //         ...productIn,
    //         cantidad: Math.max(productIn.cantidad - 1, 1),
    //     };
    //     setProductIn(updatedProductIn);
    // };


    const removeFromCart = (idVersion) => {
        const updatedCart = cart.filter((item) => item.idVersion !== idVersion);
        updateCart(updatedCart);
      };

    return (
        <div className='productCart'>
            <div className='divImgProductCart'>
                <img
                    src={`/parfum/${product.types.img}`}
                    alt={`Imagen de ${product.marca} ${product.title}`}
                />
            </div>
            <div className='divInfoProductCart'>
                <h3>
                    {product.marca} {product.title} - {product.genero}
                </h3>
                <h5>
                    Versión {product.types.version} - {product.types.ml}ml
                </h5>
                <div className='productCardInfo2'>
                    <div className='cardInfo1'>
                        <p>${product.types.price}</p>
                        <p>${product.types.oldPrice}</p>
                        <p>
                            {Math.ceil(
                                -100 + (100 / product.types.oldPrice) * product.types.price
                            )}
                            %
                        </p>
                    </div>
                    <div className='cardInfo2'>
                        <p>Cantidad:</p>
                        <div className='editCantidad'>
                            <button onClick={() => incrementQuantity(product.idVersion)}>+</button>
                            <p>{productIn.cantidad}</p>
                            <button onClick={() => decrementQuantity(product.idVersion)}>-</button>
                        </div>
                        <button onClick={() => removeFromCart(product.idVersion)}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
