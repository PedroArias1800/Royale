import { useState, useEffect, useContext, useCallback } from "react";
import { ParfumContext } from "../context/ParfumContext";
import { getDeliveryOptionsRequest, postResolveDeliveryRequest, postYappyCheckoutRequest } from "../api/Cart.api";

const PROVINCES = [
    'Bocas del Toro','Chiriquí','Coclé','Colón','Darién',
    'Herrera','Los Santos','Panamá','Panamá Oeste','Veraguas',
    'Guna Yala','Emberá-Wounaan','Ngäbe-Buglé',
];
const DISTRICTS = {
    'Bocas del Toro':['Almirante','Bocas del Toro','Changuinola','Chiriquí Grande'],
    'Chiriquí':['Alanje','Barú','Boquete','Boquerón','Bugaba','David','Dolega','Gualaca','Remedios','Renacimiento','San Félix','San Lorenzo','Tolé'],
    'Coclé':['Aguadulce','Antón','La Pintada','Natá','Olá','Penonomé'],
    'Colón':['Chagres','Colón','Donoso','Omar Torrijos','Portobelo','Santa Isabel'],
    'Darién':['Chepigana','Pinogana'],
    'Herrera':['Chitré','Las Minas','Los Pozos','Ocú','Parita','Pesé','Santa María'],
    'Los Santos':['Guararé','Las Tablas','Los Santos','Macaracas','Pedasí','Pocrí','Tonosí'],
    'Panamá':['Balboa','Chepo','Chimán','Panamá','San Miguelito','Taboga'],
    'Panamá Oeste':['Arraiján','Bejuco','Capira','Chame','La Chorrera','San Carlos'],
    'Veraguas':['Atalaya','Calobre','Cañazas','La Mesa','Las Palmas','Mariato','Montijo','Río de Jesús','San Francisco','Santa Fe','Santiago','Soná'],
    'Guna Yala':['Guna Yala'],'Emberá-Wounaan':['Cémaco','Sambú'],
    'Ngäbe-Buglé':['Besiko','Kankintú','Kusapín','Mironó','Müna','Nole Duima','Ñürüm'],
};
const CORREGIMIENTOS = {
    'Panamá':{'Panamá':['Alcalde Díaz','Ancón','Bella Vista','Betania','Calidonia','Chilibre','Curundú','El Chorrillo','Juan Díaz','Las Cumbres','Las Mañanitas','Pacora','Pedregal','Pueblo Nuevo','San Felipe','San Francisco','Santa Ana','Tocumen'],'San Miguelito':['Amelia Denis de Icaza','Belisario Frías','Belisario Porras','José Domingo Espinar','Mateo Iturralde','Rufina Alfaro','Victoriano Lorenzo','Villa del Rey'],'Chepo':['Chepo','El Llano','Las Margaritas','Tortí'],'Balboa':['Balboa','Miraflores'],'Taboga':['Taboga','Otoque Occidente','Otoque Oriente']},
    'Panamá Oeste':{'Arraiján':['Arraiján','Cerro Silvestre','Juan Demóstenes Arosemena','Nuevo Arraiján','Santa Clara','Veracruz','Vista Alegre'],'La Chorrera':['La Chorrera','Barrio Balboa','Barrio Colón','Barrio Las Minas','Barrio Santa Rosa','El Coco','Herrera','Hurtado','Iturralde','Los Díaz','Mendoza','Playa Leona','Puerto Caimito'],'Capira':['Capira','Campana','Chicá','La Trinidad','Lídice','Sorá'],'Chame':['Chame','Bejuco','El Líbano','Nueva Gorgona','Punta Chame'],'San Carlos':['San Carlos','El Valle','Gorgona','La Laguna','Las Uvas'],'Bejuco':['Bejuco','Santa Rita']},
    'Colón':{'Colón':['Barrio Norte','Barrio Sur','Buena Vista','Cativá','Cristóbal','Escobal','Frijoles','Gatún','Limón','Nueva Providencia','Paraíso','Puerto Pilón','Salamanca']},
    'Chiriquí':{'David':['David','Guácimo','Las Lomas','Pedregal','San Carlos','San Cristóbal','San Pablo Nuevo','San Pablo Viejo'],'Boquete':['Bajo Boquete','Alto Boquete','Caldera','Cochea','Jaramillo','Palmira']},
};
const METRO_LINES = {
    'Línea 1': ['Albrook','5 de Mayo','Santo Tomás','Lotería','Iglesia del Carmen','Vía Argentina','Fernández de Córdoba','El Ingenio','12 de Octubre','San Miguelito','Pan de Azúcar','Los Andes','San Isidro','Villa Zaíta'],
    'Línea 2': ['San Miguelito','Paraíso','Cincuentenario','Villa Lucre','El Crisol','Brisas del Golf','Cerro Viento','San Antonio','Pedregal','Don Bosco','Corredor Sur','Las Mañanitas','Hospital del Este','Altos de Tocumen','24 de Diciembre','Nuevo Tocumen'],
};

export const PaymentModal = ({ isOpen, onClose, onSubmit, cartData }) => {
  const { openModal } = useContext(ParfumContext);

  const [isVisible, setIsVisible]   = useState(isOpen);
  const [deliveryConfig, setDeliveryConfig] = useState(null);
  const [loadingConfig, setLoadingConfig]   = useState(false);

  // Delivery method: 'zona' | 'metro'
  const [method, setMethod]         = useState('zona');

  // Zona state
  const [province, setProvince]     = useState('');
  const [district, setDistrict]     = useState('');
  const [corregimiento, setCorregimiento] = useState('');
  const [resolvedZona, setResolvedZona]   = useState(null);  // { price, label } | null | 'notfound'
  const [resolving, setResolving]         = useState(false);

  // Metro state
  const [metroLine, setMetroLine]       = useState('Línea 1');
  const [metroStation, setMetroStation] = useState('');
  const [yappyLoading, setYappyLoading] = useState(false);
  const [yappyError, setYappyError]     = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setYappyError('');
      setLoadingConfig(true);
      getDeliveryOptionsRequest()
        .then(res => setDeliveryConfig(res.data || null))
        .catch(() => setDeliveryConfig(null))
        .finally(() => setLoadingConfig(false));
    } else {
      const t = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Resolve zona price when location is complete
  useEffect(() => {
    if (method !== 'zona' || !province) { setResolvedZona(null); return; }
    const timer = setTimeout(async () => {
      setResolving(true);
      try {
        const res = await postResolveDeliveryRequest(province, district || null, corregimiento || null);
        setResolvedZona(res.data);
      } catch {
        setResolvedZona('notfound');
      } finally { setResolving(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [method, province, district, corregimiento]);

  if (!isVisible) return null;

  const subTotal       = cartData?.subTotal || 0;
  const couponDiscount = cartData?.couponDiscount || 0;
  const cartNet        = subTotal - couponDiscount;

  // Free delivery threshold
  const gratisThreshold = deliveryConfig?.gratis?.price ?? null;
  const isFreeOrder     = gratisThreshold !== null && cartNet >= gratisThreshold;

  // Compute delivery fee for selected method
  const getDeliveryFee = () => {
    if (isFreeOrder) return 0;
    if (method === 'zona') {
      if (!resolvedZona || resolvedZona === 'notfound') return null;
      return Number(resolvedZona.price);
    }
    if (method === 'metro') {
      if (!metroStation) return null;
      const mp = deliveryConfig?.metro?.price;
      return mp != null ? Number(mp) : null;
    }
    return null;
  };

  const deliveryFee    = getDeliveryFee();
  const finalTotal     = deliveryFee !== null ? (cartNet + deliveryFee).toFixed(2) : null;

  const getDeliveryLabel = () => {
    if (isFreeOrder) return 'Delivery Gratuito';
    if (method === 'zona' && resolvedZona && resolvedZona !== 'notfound') return resolvedZona.label;
    if (method === 'metro' && metroStation) return `Metro ${metroLine} — ${metroStation}`;
    return '';
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data._deliveryLabel = getDeliveryLabel();
    data._deliveryFee   = deliveryFee ?? 0;
    onSubmit(data, {
      label: getDeliveryLabel(),
      price: deliveryFee ?? 0,
      is_free: isFreeOrder || deliveryFee === 0,
    });
  };

  const handleYappy = async (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (deliveryFee === null) { setYappyError('Selecciona una opción de delivery válida primero.'); return; }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setYappyLoading(true);
    setYappyError('');
    try {
      const payload = {
        userName: data.name, phone: data.phone,
        direction: data.address || getDeliveryLabel(),
        email: data.email || '',
        subTotal, couponDiscount,
        deliveryFee: deliveryFee ?? 0,
        couponId:    cartData?.couponId || null,
        deliveryLabel: getDeliveryLabel(),
        products:      cartData?.productsId || [],
        productsTypes: cartData?.typesId    || [],
        quantities:    cartData?.quantities  || [],
      };
      const res = await postYappyCheckoutRequest(payload);
      if (res.data?.yappyUrl) window.location.href = res.data.yappyUrl;
    } catch (err) {
      setYappyError(err.response?.data?.message || 'Error al conectar con Yappy. Usa el método por WhatsApp.');
    } finally { setYappyLoading(false); }
  };

  const districts      = province ? (DISTRICTS[province] || []) : [];
  const corregimientoOpts = (province && district) ? ((CORREGIMIENTOS[province] || {})[district] || []) : [];
  const metroStations  = METRO_LINES[metroLine] || [];
  const metroAvailable = deliveryConfig?.metro != null;
  const zonaAvailable  = deliveryConfig?.zona_available !== false;

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

          {/* ── Delivery ── */}
          {loadingConfig ? (
            <p className="pm-delivery-loading">Cargando opciones de delivery…</p>
          ) : (
            <div className="pm-delivery-section">
              <p className="pm-section-label">Método de Entrega</p>

              {/* Aviso horario de corte */}
              <div className="pm-cutoff-banner">
                🕙 Pedidos realizados después de las <strong>10:00 am</strong> serán entregados al <strong>día siguiente</strong>.
              </div>

              {/* Gratis banner */}
              {isFreeOrder && (
                <div className="pm-gratis-banner">
                  ✦ ¡Tu pedido califica para <strong>delivery gratuito</strong>! Indica tu ubicación para la entrega.
                </div>
              )}
              {!isFreeOrder && gratisThreshold !== null && (
                <p className="pm-gratis-hint">
                  Compras mayores a <strong>${gratisThreshold.toFixed(2)}</strong> reciben delivery gratis.
                </p>
              )}

              {/* Method tabs */}
              {(zonaAvailable || metroAvailable) && (
                <div className="pm-method-tabs">
                  {zonaAvailable && (
                    <button type="button"
                      className={`pm-method-tab ${method === 'zona' ? 'pm-method-tab--active' : ''}`}
                      onClick={() => setMethod('zona')}>
                      📍 Por Zona
                    </button>
                  )}
                  {metroAvailable && (
                    <button type="button"
                      className={`pm-method-tab ${method === 'metro' ? 'pm-method-tab--active' : ''}`}
                      onClick={() => setMethod('metro')}>
                      🚇 Estación Metro
                    </button>
                  )}
                </div>
              )}

              {/* Zona selectors */}
              {method === 'zona' && zonaAvailable && (
                <div className="pm-zona-selectors">
                  <div className="form-group3">
                    <div className="form-group2">
                      <label htmlFor="prov">Provincia</label>
                      <select id="prov" value={province}
                        onChange={e => { setProvince(e.target.value); setDistrict(''); setCorregimiento(''); }}>
                        <option value="">Selecciona</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group2">
                      <label htmlFor="dist">Distrito</label>
                      <select id="dist" value={district} disabled={!province}
                        onChange={e => { setDistrict(e.target.value); setCorregimiento(''); }}>
                        <option value="">Selecciona</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {corregimientoOpts.length > 0 && (
                    <div className="form-group2">
                      <label htmlFor="corr">Corregimiento</label>
                      <select id="corr" value={corregimiento} disabled={!district}
                        onChange={e => setCorregimiento(e.target.value)}>
                        <option value="">Selecciona (opcional)</option>
                        {corregimientoOpts.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {/* Resolved price */}
                  {province && (
                    <div className="pm-zona-price">
                      {resolving && <span className="pm-delivery-loading">Calculando precio…</span>}
                      {!resolving && resolvedZona === 'notfound' && (
                        <span className="pm-zona-price--notfound">
                          No hay precio configurado para esta zona. Contáctanos para coordinar.
                        </span>
                      )}
                      {!resolving && resolvedZona && resolvedZona !== 'notfound' && !isFreeOrder && (
                        <span className="pm-zona-price--found">
                          Delivery a <strong>{resolvedZona.label}</strong>: <strong>${Number(resolvedZona.price).toFixed(2)}</strong>
                        </span>
                      )}
                      {isFreeOrder && <span className="pm-zona-price--free">Entrega gratuita ✓</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Metro selectors */}
              {method === 'metro' && metroAvailable && (
                <div className="pm-metro-selectors">
                  <div className="form-group3">
                    <div className="form-group2">
                      <label>Línea</label>
                      <select value={metroLine} onChange={e => { setMetroLine(e.target.value); setMetroStation(''); }}>
                        {Object.keys(METRO_LINES).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group2">
                      <label>Estación</label>
                      <select value={metroStation} onChange={e => setMetroStation(e.target.value)}>
                        <option value="">Selecciona tu estación</option>
                        {metroStations.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!isFreeOrder && (
                    <div className="pm-zona-price">
                      {metroStation
                        ? <span className="pm-zona-price--found">
                            Delivery Metro — <strong>${Number(deliveryConfig.metro.price).toFixed(2)}</strong> (precio único para todas las estaciones)
                          </span>
                        : <span style={{fontSize:'0.80rem',color:'rgba(237,232,235,0.4)'}}>
                            Precio: <strong style={{color:'rgba(253,208,94,0.7)'}}>
                              ${Number(deliveryConfig.metro.price).toFixed(2)}
                            </strong> para cualquier estación
                          </span>
                      }
                    </div>
                  )}
                  {isFreeOrder && <span className="pm-zona-price--free">Entrega gratuita ✓</span>}
                </div>
              )}
            </div>
          )}

          {/* ── Dirección adicional ── */}
          <div className="form-group2">
            <label htmlFor="address">Dirección / Referencia adicional (opcional)</label>
            <input type="text" id="address" name="address" placeholder="Calle, edificio, casa, referencia..." autoComplete="address-line1" />
          </div>

          {/* ── Resumen de total ── */}
          {finalTotal !== null && (
            <div className="pm-total-preview">
              <span>Subtotal</span><span>${subTotal.toFixed(2)}</span>
              {couponDiscount > 0 && (
                <><span>Cupón</span><span className="pm-saving">−${couponDiscount.toFixed(2)}</span></>
              )}
              <span>Delivery</span>
              <span>
                {isFreeOrder || deliveryFee === 0
                  ? <em className="pm-free">Gratis</em>
                  : `$${deliveryFee.toFixed(2)}`}
              </span>
              <span className="pm-total-label">Total</span>
              <span className="pm-total-amount">${finalTotal}</span>
            </div>
          )}

          {/* ── Términos ── */}
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="terms" name="terms" required />
            <label htmlFor="terms">
              Acepto los <button type="button" onClick={e => { e.preventDefault(); openModal('terms'); }}>Términos y Condiciones</button>
            </label>
          </div>
          <div className="form-group2 inputsChecks">
            <input type="checkbox" id="privacy" name="privacy" required />
            <label htmlFor="privacy">
              Acepto la <button type="button" onClick={e => { e.preventDefault(); openModal('privacy'); }}>Política de Privacidad</button>
            </label>
          </div>

          {/* ── Métodos de pago ── */}
          {yappyError && <p className="pm-yappy-error">{yappyError}</p>}
          <div className="pm-payment-methods">
            <p className="pm-section-label">Método de Pago</p>
            <div className="pm-methods-row">
              {/* btn-yappy oculto temporalmente — pendiente activación del comercio con Yappy */}
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
