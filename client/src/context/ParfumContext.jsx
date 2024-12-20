import { createContext, useContext, useEffect, useState } from "react";


export const ParfumContext = createContext();

export const useParfum = () => {
    const context = useContext(ParfumContext)
    if(!context){
        throw new Error('useParfum está fuera de ParfumContextProvider')
    }
    return context;
}

export const ParfumContextProvider = ({ children }) => {

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);


    const addToCart = (productId, typesId, quantity = 1) => {
        setCart((prevCart) => {
          const existingProduct = prevCart.find(
            (item) => item.id === productId && item.types_id === typesId
          );
          if (existingProduct) {
            return prevCart.map((item) =>
              item.id === productId && item.types_id === typesId && item.quantity < 10
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }
          return [...prevCart, { id: productId, types_id: typesId, quantity }];
        });
      };

      const decreaseQuantity = (productId, typesId) => {
        setCart((prevCart) => {
          const existingProduct = prevCart.find(
            (item) => item.id === productId && item.types_id === typesId
          );
          if (existingProduct && existingProduct.quantity > 1) {
            return prevCart.map((item) =>
              item.id === productId && item.types_id === typesId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            );
          }
          return prevCart;
        });
      };
      
    
      const removeFromCart = (productId, typesId) => {
        setCart((prevCart) =>
          prevCart.filter(
            (item) => !(item.id === productId && item.types_id === typesId)
          )
        );
      };
    
      const clearCart = () => setCart([]);
    
      const getTotalQuantity = () => 
        cart.reduce((total, item) => total + item.quantity, 0)


      // Modal
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [modalContent, setModalContent] = useState({ title: '', text: '' });

      const openModal = (type) => {
          const content = {
              title: type === 'privacy' ? 'Privacidad de Datos' : 'Términos y Condiciones',
              text:
                  type === 'privacy'
                      ? 'Esta es la política de privacidad, donde explicamos cómo manejamos tus datos personales.'
                      : 'Estos son los términos y condiciones, donde detallamos las reglas para usar nuestro sitio web.',
          };
          setModalContent(content);
          setIsModalOpen(true);
      };

      const closeModal = () => {
          setIsModalOpen(false);
      };
        

    return <ParfumContext.Provider value={{ cart, addToCart, removeFromCart, decreaseQuantity, clearCart, getTotalQuantity, isModalOpen, modalContent, openModal, closeModal }}>
        {children}
    </ParfumContext.Provider>

}