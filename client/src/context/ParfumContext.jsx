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
    const [alertMessage, setAlertMessage] = useState();
    const [color, setColor] = useState();
    const [color2, setColor2] = useState();

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
    
      const clearCart = (alertMessage, color, color2) => {
        setAlertMessage(alertMessage)
        setColor(color)
        setColor2(color2)
        if (color === '--color-dorado'){
          setCart([]);
        }
      }
    
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
                      ? `1. Introducción
<br/>En Royale Panama, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información.
<br/>
<br/>2. Información que Recopilamos
<br/>Datos personales: Nombre, correo electrónico, número de teléfono y dirección proporcionados al realizar un pedido o registrarte.
<br/>Información de navegación: Cookies y datos sobre tu interacción con nuestro sitio web.
<br/>
<br/>3. Uso de la Información
<br/>La información que recopilamos se utiliza para:
<br/>
<br/> * Procesar tus pedidos y entregarte los productos.
<br/> * Enviarte notificaciones relacionadas con tus compras.
<br/> * Mejorar nuestros servicios y personalizar tu experiencia.
<br/>
<br/>4. Protección de Datos
<br/>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra accesos no autorizados.
<br/>Nunca compartiremos tu información personal con terceros sin tu consentimiento, salvo cuando sea necesario para procesar tus pedidos (por ejemplo, empresas de envío).
<br/>
<br/>5. Uso de Cookies
<br/>Nuestro sitio utiliza cookies para mejorar la experiencia del usuario. Puedes gestionar tus preferencias de cookies en la configuración de tu navegador.
<br/>
<br/>6. Tus Derechos
<br/>Tienes derecho a:
<br/> * Acceder a los datos personales que tenemos sobre ti.
<br/> * Solicitar la corrección o eliminación de tu información.
<br/> * Retirar tu consentimiento para el uso de tus datos en cualquier momento.
<br/>
<br/>7. Cambios a la Política de Privacidad
<br/>Podemos actualizar esta política en cualquier momento. Notificaremos los cambios relevantes en esta página.
<br/>
<br/>8. Contacto
<br/>Si tienes preguntas sobre nuestra Política de Privacidad, contáctanos en: royalepanama1@gmail.com o escríbenos al +507 6838-9280<p/>`
                      : `1. Introducción
<br/>Bienvenido a Royale Panama. Al utilizar nuestra página web y nuestros servicios, aceptas cumplir con los términos y condiciones establecidos en este documento. Por favor, léelos cuidadosamente antes de realizar una compra.
<br/>
<br/>2. Registro y Cuenta de Usuario
<br/>Al registrarte o realizar una compra, debes proporcionar información verdadera, completa y actualizada.
<br/>Eres responsable de mantener la confidencialidad de tus datos personales y de cualquier actividad realizada bajo tu cuenta.
<br/>
<br/>3. Proceso de Compra
<br/>Los precios de los productos están expresados en Dólares. Nos reservamos el derecho de modificar los precios sin previo aviso.
<br/>El pago debe realizarse utilizando los métodos disponibles en nuestro sitio web.
<br/>La confirmación de tu pedido se enviará por correo electrónico una vez completada la transacción.
<br/>
<br/>4. Políticas de Envío y Devoluciones
<br/>Realizamos envíos a Panamá, en la ciudad de Panamá, dentro de un plazo de 3 días.
<br/>Si el producto llega dañado o no coincide con tu pedido, tienes derecho a solicitar un cambio o reembolso dentro del primer día posterior a la recepción del paquete.
<br/>Los costos de envío no son reembolsables, salvo en caso de error nuestro.
<br/>
<br/>5. Uso Aceptable del Sitio Web
<br/>No está permitido usar el sitio web para actividades ilegales, fraudulentas o que puedan dañar nuestra plataforma.
<br/>
<br/>6. Propiedad Intelectual
<br/>Todos los contenidos, imágenes, textos y diseños en Royale Panama son propiedad de nuestra empresa. Está prohibida su reproducción, distribución o uso sin autorización previa.
<br/>
<br/>7. Modificaciones a los Términos
<br/>Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán notificadas en esta página y entrarán en vigor inmediatamente después de su publicación.
<br/>
<br/>8. Contacto
<br/>Si tienes dudas o inquietudes, puedes contactarnos en: royalepanama1@gmail.com o escríbenos al +507 6838-9280`,
          };
          setModalContent(content);
          setIsModalOpen(true);
      };

      const closeModal = () => {
          setIsModalOpen(false);
      };
        

    return <ParfumContext.Provider value={{ cart, addToCart, removeFromCart, decreaseQuantity, clearCart, getTotalQuantity, isModalOpen, modalContent, openModal, closeModal, alertMessage, setAlertMessage, color, color2 }}>
        {children}
    </ParfumContext.Provider>

}