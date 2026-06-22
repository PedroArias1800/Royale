import { useState, useEffect, useContext } from "react";
import { ParfumContext } from "../context/ParfumContext";
import { getDeliveryOptionsRequest, postYappyCheckoutRequest } from "../api/Cart.api";

export const PaymentModal = ({ isOpen, onClose, onSubmit, cartData }) => {
  const { openModal } = useContext(ParfumContext);

  const [isVisible, setIsVisible]           = useState(isOpen);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingDelivery, setLoadingDelivery]   = useState(false);
  const [yappyLoading, setYappyLoading]     = useState(false);
  const [yappyError, setYappyError]         = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setYappyError('');
      setLoadingDelivery(true);
      getDeliveryOptionsRequest()
        .then(res => {
          const opts = res.data || [];
          setDeliveryOptions(opts);
          const freeOpt = opts.find(d => d.is_free);
          setSelectedDelivery(freeOpt || opts[0] || null);
        })
        .catch(() => setDeliveryOptions([]))
        .finally(() => setLoadingDelivery(false));
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const deliveryFee = selectedDelivery
    ? (selectedDelivery.is_free ? 0 : Number(selectedDelivery.price))
    : 0;

  const subTotal       = cartData?.subTotal || 0;
  const couponDiscount = cartData?.couponDiscount || 0;
  const finalTotal     = (subTotal - couponDiscount + deliveryFee).toFixed(2);

  const handleWhatsApp = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data, selectedDelivery);
  };

  const handleYappy = async (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!selectedDelivery) { setYappyError('Selecciona una opción de delivery primero.'); return; }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setYappyLoading(true);
    setYappyError('');
    try {
      const payload = {
        userName:      data.name,
        phone:         data.phone,
        direction:     data.address || '',
        email:         data.email || '',
        subTotal,
        deliveryFee,
        couponDiscount,
        couponId:      cartData?.couponId || null,
        deliveryLabel: selectedDelivery.label,
        deliveryId:    selectedDelivery._id,
        products:      cartData?.productsId || [],
        productsTypes: cartData?.typesId || [],
        quantities:    cartData?.quantities || [],
      };
      const res = await postYappyCheckoutRequest(payload);
      if (res.data?.yappyUrl) {
        window.location.href = res.data.yappyUrl;
      }
    } catch (err) {
      setYappyError(
        err.response?.data?.message || 'Error al conectar con Yappy. Usa el método por WhatsApp.'
      );
    } finally {
      setYappyLoading(false);
    }
  };

  return (
    <div className={`modal-overlay2 ${isOpen ? 'open' : 'close'}`}>
      <div className={`modal-content2 pm-scrollable ${isOpen ? 'open' : 'close'}`}>
        <div className="modalPaymentTitle">
          <h2>Completa tus datos</h2>
          <button className="close-btn2" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={handleWhatsApp} className="payment-form2">

          {/* ── Datos personales ── */}
          <div className="form-group3">
            <div className="form-group2">
              <label htmlFor="name">Nombre y Apellido</label>
              <input type="text" id="name" name="name" placeholder="Omar Sánchez" required autoComplete="name" />
            </div>
            <div className="form-group2">
              <label htmlFor="phone">Teléfono</label>
              <input type="tel" id="phone" name="phone" placeholder="6212-6212" required autoComplete="tel" />
            </div>
          </div>
          <div className="form-group2">
            <label htmlFor="email">Correo</label>
            <input type="email" id="email" name="email" placeholder="correo@gmail.com" autoComplete="email" />
          </div>
          <div className="form-group2">
            <label htmlFor="address">Dirección</label>
            <input type="text" id="address" name="address" placeholder="Panamá Norte, Las Cumbres, Calle El Bosque" autoComplete="address-line1" />
          </div>

          {/* ── Delivery ── */}
          <div className="pm-delivery-section">
            <p className="pm-section-label">Opción de Delivery</p>
            {loadingDelivery ? (
              <p className="pm-delivery-loading">Cargando opciones…</p>
            ) : deliveryOptions.length === 0 ? (
              <p className="pm-delivery-loading">No hay opciones configuradas aún.</p>
            ) : (
              <div className="pm-delivery-options">
                {deliveryOptions.map(opt => (
                  <label
                    key={opt._id}
                    className={`pm-delivery-opt ${selectedDelivery?._id === opt._id ? 'pm-delivery-opt--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={opt._id}
                      checked={selectedDelivery?._id === opt._id}
                      onChange={() => setSelectedDelivery(opt)}
                      className="pm-delivery-radio"
                    />
                    <span className="pm-delivery-opt__label">{opt.label}</span>
                    <span className={`pm-delivery-opt__price ${opt.is_free ? 'pm-delivery-opt__price--free' : ''}`}>
                      {opt.is_free ? 'Gratis' : `$${Number(opt.price).toFixed(2)}`}
                    </span>
                    {opt.notes && <span className="pm-delivery-opt__note">{opt.notes}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Resumen de total con delivery ── */}
          {selectedDelivery && (
            <div className="pm-total-preview">
              <span>Subtotal</span><span>${subTotal.toFixed(2)}</span>
              {couponDiscount > 0 && (
                <><span>Cupón</span><span className="pm-saving">−${couponDiscount.toFixed(2)}</span></>
              )}
              <span>Delivery</span>
              <span>{selectedDelivery.is_free ? <em className="pm-free">Gratis</em> : `$${deliveryFee.toFixed(2)}`}</span>
              <span className="pm-total-label">Total</span>
              <span className="pm-total-amount">${finalTotal}</span>
            </div>
          )}

          {/* ── Términos ── */}
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="terms" name="terms" required />
            <label htmlFor="terms">
              Acepto los <button type="button" onClick={(e) => { e.preventDefault(); openModal('terms'); }}>
                Términos y Condiciones
              </button>
            </label>
          </div>
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="privacy" name="privacy" required />
            <label htmlFor="privacy">
              Acepto los <button type="button" onClick={(e) => { e.preventDefault(); openModal('privacy'); }}>
                Privacidad de Datos
              </button>
            </label>
          </div>

          {/* ── Métodos de pago ── */}
          {yappyError && <p className="pm-yappy-error">{yappyError}</p>}
          <div className="pm-payment-methods">
            <p className="pm-section-label">Método de Pago</p>
            <div className="pm-methods-row">
              <button
                type="button"
                className="pm-yappy-btn"
                onClick={handleYappy}
                disabled={yappyLoading}
                title="Pagar con Yappy"
              >
                {yappyLoading ? 'Procesando…' : ''}
                <span className="pm-yappy-logo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:'middle',marginRight:'6px'}}>
                    <circle cx="12" cy="12" r="12" fill="#00C853"/>
                    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Y</text>
                  </svg>
                  {yappyLoading ? 'Conectando con Yappy…' : 'Pagar con Yappy'}
                </span>
              </button>

              <button type="submit" className="pagar">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:'middle',marginRight:'6px'}}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
