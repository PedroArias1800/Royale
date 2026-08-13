import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDiscountsPublicRequest } from '../api/Discounts.api.js';


export const ParfumContext = createContext();

export const useParfum = () => {
    const context = useContext(ParfumContext)
    if(!context){
        throw new Error('useParfum está fuera de ParfumContextProvider')
    }
    return context;
}

function detectChannel() {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') || params.get('utm_source') || '').toLowerCase().trim();
    const MAP = {
        instagram: 'Instagram', facebook: 'Facebook', fb: 'Facebook',
        qr: 'QR', whatsapp: 'WhatsApp', google: 'Google',
    };
    if (ref && MAP[ref]) return MAP[ref];

    const referrer = (document.referrer || '').toLowerCase();
    if (!referrer) return 'Directo';
    if (referrer.includes('instagram.com')) return 'Instagram';
    if (referrer.includes('facebook.com') || referrer.includes('fb.com')) return 'Facebook';
    if (referrer.includes('google.')) return 'Google';
    if (referrer.includes('royalepanama.com') || referrer.includes('localhost')) return 'Sitio Web';
    return 'Directo';
}

export const ParfumContextProvider = ({ children }) => {

    const [channelSource] = useState(() => {
        const saved = sessionStorage.getItem('royale_channel');
        if (saved) return saved;
        const detected = detectChannel();
        sessionStorage.setItem('royale_channel', detected);
        return detected;
    });

    const [discountRules, setDiscountRules] = useState([]);

    useEffect(() => {
        getDiscountsPublicRequest()
            .then(res => setDiscountRules(res.data || []))
            .catch(() => {});
    }, []);

    const getDiscount = useCallback((product) => {
        if (!product || !discountRules.length) return null;
        const now = Date.now();
        for (const rule of discountRules) {
            if (rule.status !== 1) continue;
            if (rule.schedule_enabled) {
                const start = rule.schedule_start ? new Date(rule.schedule_start).getTime() : null;
                const end   = rule.schedule_end   ? new Date(rule.schedule_end).getTime()   : null;
                if (start && now < start) continue;
                if (end   && now > end)   continue;
            }
            if (rule.filter_gender != null && rule.filter_gender !== '') {
                if (product.gender !== rule.filter_gender) continue;
            }
            if (rule.filter_brand_ids?.length > 0) {
                const brandId = product.brand?._id || product.brand?.id
                    || product.brand_id_fk?._id || product.brand_id_fk?.id || '';
                if (!rule.filter_brand_ids.includes(brandId)) continue;
            }
            if (rule.filter_price_min != null || rule.filter_price_max != null) {
                const types = product.types?.length ? product.types : [];
                const hasMatch = types.some(t => {
                    const p = parseFloat(t.price || 0);
                    if (rule.filter_price_min != null && p < rule.filter_price_min) return false;
                    if (rule.filter_price_max != null && p > rule.filter_price_max) return false;
                    return true;
                });
                if (!hasMatch) continue;
            }
            if (rule.filter_created_after || rule.filter_created_before) {
                const pCreated = product.createdAt ? new Date(product.createdAt).getTime() : null;
                if (pCreated) {
                    if (rule.filter_created_after && pCreated < new Date(rule.filter_created_after).getTime()) continue;
                    if (rule.filter_created_before && pCreated > new Date(rule.filter_created_before).getTime()) continue;
                }
            }
            return rule.discount_pct;
        }
        return null;
    }, [discountRules]);

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [alertMessage, setAlertMessage] = useState();
    const [color, setColor] = useState();
    const [color2, setColor2] = useState();
    const URLServer = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';
    const URLFrontend = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:4173'
    const imgSrc = (path) => {
        if (!path) return path;
        const url = path.startsWith('http') ? path : `${URLServer}${path}`;
        return url.replace(/ /g, '%20');
    };

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);


    const addToCart = (productId, typesId, quantity, maxQuantity) => {
        setCart((prevCart) => {
          const existingProduct = prevCart.find(
            (item) => item.id === productId && item.types_id === typesId
          );
          if (existingProduct) {
            return prevCart.map((item) =>
              item.id === productId && item.types_id === typesId && item.quantity < maxQuantity
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
<br/>Si tienes preguntas sobre nuestra Política de Privacidad, contáctanos en: royalepanama1@gmail.com o escríbenos al +507 6562-3382<p/>`
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
<br/>En caso de que aplique una devolución aprobada por Royale Panama, el costo del envío de retorno correrá por cuenta del cliente.
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
<br/>Si tienes dudas o inquietudes, puedes contactarnos en: royalepanama1@gmail.com o escríbenos al +507 6562-3382`,
          };
          setModalContent(content);
          setIsModalOpen(true);
      };

      const closeModal = () => {
          setIsModalOpen(false);
      };
        

    return <ParfumContext.Provider value={{ cart, setCart, addToCart, removeFromCart, decreaseQuantity, clearCart, getTotalQuantity, isModalOpen, modalContent, openModal, closeModal, alertMessage, setAlertMessage, color, color2, URLServer, URLFrontend, imgSrc, channelSource, getDiscount }}>
        {children}
    </ParfumContext.Provider>

}