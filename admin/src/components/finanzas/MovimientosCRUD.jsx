import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    getAllBrandsRequest,
    getAllParfumsRequest,
    getTypeByParfumId,
    getAllUsersRequest,
    getAllCouponsRequest,
    getAllProvidersRequest,
} from '../../api/Admin.api.js';
import { getOpCostTypesRequest } from '../../api/Cortes.api.js';

const LABELS = {
    ingreso: ['Venta Directa', 'Devolución recibida'],
    salida:  ['Costo del Producto', 'Gastos Operativos', 'Merma', 'Publicidad y Marketing', 'Envíos y Logística', 'Devolución emitida', 'Pago de Corte', 'Otro gasto'],
};

const CHANNELS = ['Instagram', 'WhatsApp', 'Sitio Web', 'QR', 'Vendedor', 'Facebook'];

const PROVINCES = ['Bocas del Toro','Chiriquí','Coclé','Colón','Darién','Herrera','Los Santos','Panamá','Panamá Oeste','Veraguas','Guna Yala','Emberá-Wounaan','Ngäbe-Buglé'];
const DISTRICTS = {
    'Bocas del Toro': ['Almirante','Bocas del Toro','Changuinola','Chiriquí Grande'],
    'Chiriquí': ['Alanje','Barú','Boquerón','Bugaba','David','Dolega','Gualaca','Remedios','Renacimiento','San Félix','San Lorenzo','Tierras Altas','Tolé'],
    'Coclé': ['Aguadulce','Antón','La Pintada','Natá','Olá','Penonomé'],
    'Colón': ['Chagres','Colón','Donoso','Portobelo','Santa Isabel'],
    'Darién': ['Chepigana','Pinogana'],
    'Herrera': ['Chitré','Las Minas','Los Pozos','Ocú','Parita','Pesé','Santa María'],
    'Los Santos': ['Guararé','Las Tablas','Los Santos','Macaracas','Pedasi','Pocrí','Tonosí'],
    'Panamá': ['Balboa','Chepo','Chimán','Panamá','San Miguelito','Taboga'],
    'Panamá Oeste': ['Arraiján','Capira','Chame','La Chorrera','San Carlos'],
    'Veraguas': ['Atalaya','Calobre','Cañazas','La Mesa','Las Palmas','Montijo','Río de Jesús','San Francisco','Santa Fe','Santiago','Soná'],
    'Guna Yala': ['Guna Yala'],
    'Emberá-Wounaan': ['Cémaco','Sambú'],
    'Ngäbe-Buglé': ['Besiko','Kankintú','Kusapín','Mironó','Müna','Nole Duima','Ñürüm'],
};
const CORREGIMIENTOS = {
    'Panamá': {
        'Panamá': ['Alcalde Díaz','Ancón','Bella Vista','Betania','Calidonia','Chilibre','Curundú','Don Bosco','El Chorrillo','Juan Díaz','Josefina de Caballero','La Exposición','La Locería','La Puebla','Las Cumbres','Las Mañanitas','Llano Bonito','Parque Lefevre','Pedregal','Río Abajo','San Felipe','San Francisco','San Martín','Santa Ana','Tocumen'],
        'San Miguelito': ['Amelia Denis de Icaza','Belisario Frías','Belisario Porras','José Domingo Espinar','Mateo Iturralde','Mañanitas','Omar Torrijos Herrera','Rufina Alfaro','Victoriano Lorenzo'],
        'Chepo': ['Chepo','Chepillo','El Llano','La Jagua','Madungandí','Tortí','Ügarigandí'],
    },
    'Panamá Oeste': {
        'Arraiján': ['Arraiján','Burunga','Juan Demóstenes Arosemena','Nuevo Emperador','Veracruz','Vista Alegre'],
        'La Chorrera': ['Amador','Barrio Balboa','Barrio Colón','El Arado','El Coco','Guadalupe','Herrera','Hurtado','Iturralde','La Mitra','Las Ollas Arriba','Mendoza','Playa Leona','Puerto Caimito','Trinchera','Zunía'],
        'Capira': ['Capira','Caimito','El Higo','La Laguna','Las Ollas','Lídice','Pinogana','Saguala','San Carlos','San Juan','Santa Rosa'],
        'Chame': ['Chame','Bejuco','Cherrerazo','El Líbano','Nueva Gorgona','Punta Chame','San Carlos'],
    },
    'Chiriquí': {
        'David': ['Alameda','Dolega','David','Guabalá','Las Lomas','Pedregal','San Carlos','San Cristóbal','San Pablo Nuevo','San Pablo Viejo','Bijagual','Chiriquí','Los Anastacios','Potrerillos Abajo','Potrerillos Arriba'],
        'Barú': ['Puerto Armuelles','Limones','Nueva California','Progreso','Puerto Remedios','Rodolfo Aguilar Delgado'],
        'Bugaba': ['Bugaba','Algarrobos','Cerro Punta','Concepción','El Clavel','Guadalupe','Gómez','Ja Dié','La Concepción','Palmira','Santa Clara','Santa Marta','Santo Domingo','Volcán'],
    },
};

const METRO_LINES = ['Línea 1', 'Línea 2'];
const METRO_STATIONS = {
    'Línea 1': ['Albrook','5 de Mayo','Santo Tomás','Lotería','Iglesia del Carmen','Vía Argentina','Fernández de Córdoba','El Ingenio','12 de Octubre','San Miguelito','Pan de Azúcar','Los Andes','San Isidro','Villa Zaíta'],
    'Línea 2': ['San Miguelito','Paraíso','Cincuentenario','Villa Lucre','El Crisol','Brisas del Golf','Cerro Viento','San Antonio','Pedregal','Don Bosco','Corredor Sur','Las Mañanitas','Hospital del Este','Altos de Tocumen','24 de Diciembre','Nuevo Tocumen'],
};

const todayISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Panama' });

const EMPTY_TX = {
    status: '1', fin_type: 'ingreso', label: LABELS.ingreso[0],
    userName: '', phone: '', direction: '', email: '',
    payment_method: '', delivery_method: '',
    channel: '', seller_id_fk: '', total: '', subTotal: '', description: '',
    created_at: todayISO(),
};

const EMPTY_PRODUCT = {
    brandId: '', parfumId: '', typeId: '', typeMl: '',
    typePrice: 0, typeCost: 0,
    priceOverride: null, costOverride: null,
    priceEditable: false, costEditable: false,
    qty: 1,
};

const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('es-PA') : '—';
const fmtAmt   = (n)   => n != null && n !== '' ? `$${Number(n).toFixed(2)}` : '—';
const fmtProducts = (products) =>
    (products || []).map(p => p.split('=')[1] || p).filter(Boolean).join(', ') || '—';

const canalCell = (t, isPending = false) => {
    if (t.channel !== 'Vendedor') return t.channel || '—';
    const name = t.seller && t.seller !== 'Sitio Web' ? t.seller : null;
    if (name) return `Vendedor — ${name}`;
    return isPending ? 'Vendedor — Por seleccionar' : 'Vendedor';
};

const getOpCost = (t) => {
    if (t.operational_costs?.length)
        return t.operational_costs.reduce((s, i) => s + (i.amount || 0), 0);
    return t.operational_cost ?? 0;
};

const getSalida = (t) => {
    const pc    = t.products_cost ?? null;
    const hasOc = t.operational_costs?.length || t.operational_cost != null;
    if (pc === null && !hasOc) return null;
    return (pc || 0) + getOpCost(t);
};

const sortByDate = (arr) =>
    [...(arr || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

// ─── 3-dot menu: portal to escape overflow:auto stacking context ───────────────
const DotsMenu = ({ options }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);
    const dropRef = useRef(null);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }
        setOpen(v => !v);
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            const inDrop = dropRef.current?.contains(e.target);
            const inBtn  = btnRef.current?.contains(e.target);
            if (!inDrop && !inBtn) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="dots-menu" onClick={e => e.stopPropagation()}>
            <button ref={btnRef} className="btn-dots" onClick={handleToggle} title="Acciones">⋯</button>
            {open && pos && createPortal(
                <div ref={dropRef} className="dots-dropdown"
                    style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
                    onClick={e => e.stopPropagation()}>
                    {options.map((opt, i) => (
                        <button key={i} className={`dots-opt${opt.cls ? ' ' + opt.cls : ''}`}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); opt.action(); setOpen(false); }}>
                            {opt.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

// ─── Vendor select ────────────────────────────────────────────────────────────
const VendorSelect = ({ value, onChange, users }) => (
    <label>
        Vendedor *
        <select value={value} onChange={onChange} required>
            <option value="">Selecciona un vendedor</option>
            {users.map(u => (
                <option key={u.id || u._id} value={u.id || u._id}>
                    {u.firstname} {u.lastname} — {u.email}
                </option>
            ))}
        </select>
    </label>
);

// ─── Cascading location selects (Provincia → Distrito → Corregimiento) ────────
const LocationSelects = ({ province, district, corregimiento, setProvince, setDistrict, setCorregimiento }) => {
    const districtOpts = province ? (DISTRICTS[province] || []) : [];
    const corrOpts = (province && district) ? ((CORREGIMIENTOS[province] || {})[district] || []) : [];
    return (
        <>
            <label>Provincia
                <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); setCorregimiento(''); }}>
                    <option value="">Selecciona...</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </label>
            <label>Distrito
                <select value={district} disabled={!province} onChange={e => { setDistrict(e.target.value); setCorregimiento(''); }}>
                    <option value="">Selecciona...</option>
                    {districtOpts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </label>
            <label>Corregimiento (opcional)
                <select value={corregimiento} disabled={!district} onChange={e => setCorregimiento(e.target.value)}>
                    <option value="">Sin especificar</option>
                    {corrOpts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </label>
        </>
    );
};

// ─── Product row with cascading selects (AgregarTransaccionModal) ─────────────
const ProductRow = ({ prod, idx, brands, parfums, onUpdate, onRemove, canRemove }) => {
    const [types, setTypes] = useState([]);

    const filteredParfums = parfums.filter(p => {
        const bid = p.brand_id_fk?._id || p.brand_id_fk?.id || '';
        return bid === prod.brandId;
    });

    useEffect(() => {
        if (!prod.parfumId) { setTypes([]); return; }
        getTypeByParfumId(prod.parfumId)
            .then(res => setTypes(res.data || []))
            .catch(() => setTypes([]));
    }, [prod.parfumId]);

    const setBrand  = (e) => onUpdate(idx, { ...EMPTY_PRODUCT, brandId: e.target.value });
    const setParfum = (e) => onUpdate(idx, { ...prod, parfumId: e.target.value, typeId: '', typeMl: '', typePrice: 0, typeCost: 0, priceOverride: null, costOverride: null, priceEditable: false, costEditable: false });
    const setType   = (e) => {
        const t = types.find(t => (t.id || t._id) === e.target.value);
        onUpdate(idx, { ...prod, typeId: e.target.value, typeMl: t?.ml || '', typePrice: t?.price || 0, typeCost: t?.cost || 0, priceOverride: null, costOverride: null, priceEditable: false, costEditable: false });
    };

    const effectivePrice = prod.priceOverride ?? prod.typePrice;
    const effectiveCost  = prod.costOverride  ?? prod.typeCost;

    return (
        <div className="mov-product-row cascade">
            <div className="mov-product-selects">
                <select value={prod.brandId} onChange={setBrand} className="mov-prod-brand">
                    <option value="">Marca...</option>
                    {brands.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.brand_name}</option>)}
                </select>
                <select value={prod.parfumId} onChange={setParfum} disabled={!prod.brandId} className="mov-prod-parfum">
                    <option value="">Perfume...</option>
                    {filteredParfums.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.title}</option>)}
                </select>
                <select value={prod.typeId} onChange={setType} disabled={!prod.parfumId} className="mov-prod-type">
                    <option value="">Tamaño...</option>
                    {types.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.ml}ml — ${t.price}</option>)}
                </select>
                <input type="number" min="1" value={prod.qty}
                    onChange={e => onUpdate(idx, { ...prod, qty: e.target.value })}
                    className="mov-product-qty" title="Cantidad" />
                {canRemove && (
                    <button type="button" className="btn-remove-product" onClick={() => onRemove(idx)} title="Eliminar">✕</button>
                )}
            </div>
            {prod.typeId && (
                <div className="mov-product-amounts">
                    <div className="proc-cost-control">
                        <span className="proc-cost-label">Precio</span>
                        <label className="cost-switch" title="Editar precio">
                            <input type="checkbox" checked={prod.priceEditable}
                                onChange={e => onUpdate(idx, { ...prod, priceEditable: e.target.checked, priceOverride: e.target.checked ? prod.typePrice : null })} />
                            <span className="cost-switch-slider" />
                        </label>
                        <input type="number" min="0" step="0.01"
                            value={prod.priceEditable ? (prod.priceOverride ?? prod.typePrice) : (prod.typePrice || '')}
                            readOnly={!prod.priceEditable}
                            onChange={e => onUpdate(idx, { ...prod, priceOverride: parseFloat(e.target.value) || 0 })}
                            className={`proc-cost-input${prod.priceEditable ? ' editable' : ''}`} />
                    </div>
                    <div className="proc-cost-control">
                        <span className="proc-cost-label">Costo</span>
                        <label className="cost-switch" title="Editar costo">
                            <input type="checkbox" checked={prod.costEditable}
                                onChange={e => onUpdate(idx, { ...prod, costEditable: e.target.checked, costOverride: e.target.checked ? prod.typeCost : null })} />
                            <span className="cost-switch-slider" />
                        </label>
                        <input type="number" min="0" step="0.01"
                            value={prod.costEditable ? (prod.costOverride ?? prod.typeCost) : (prod.typeCost || '')}
                            readOnly={!prod.costEditable}
                            onChange={e => onUpdate(idx, { ...prod, costOverride: parseFloat(e.target.value) || 0 })}
                            className={`proc-cost-input${prod.costEditable ? ' editable' : ''}`} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Modal Agregar Transacción ────────────────────────────────────────────────
const defaultDeliveryDate = () => {
    const panMs   = Date.now() - 5 * 3600 * 1000;
    const panDate = new Date(panMs);
    if (panDate.getUTCHours() >= 10) panDate.setUTCDate(panDate.getUTCDate() + 1);
    return panDate.toISOString().slice(0, 10);
};

const AgregarTransaccionModal = ({ onClose, onSave }) => {
    const [form, setForm]       = useState(() => ({ ...EMPTY_TX, delivery_date: defaultDeliveryDate() }));
    const [products, setProducts] = useState([{ ...EMPTY_PRODUCT }]);
    const [brands, setBrands]   = useState([]);
    const [parfums, setParfums] = useState([]);
    const [users, setUsers]     = useState([]);
    const [coupons, setCoupons]             = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [expressDelivery, setExpressDelivery] = useState('no');
    const [locationMode, setLocationMode]     = useState('');
    const [province, setProvince]             = useState('');
    const [district, setDistrict]             = useState('');
    const [corregimiento, setCorregimiento]   = useState('');
    const [metroLine, setMetroLine]           = useState('');
    const [metroStation, setMetroStation]     = useState('');

    useEffect(() => {
        getAllBrandsRequest().then(r => setBrands(r.data?.data || r.data || [])).catch(() => {});
        getAllParfumsRequest().then(r => setParfums(r.data?.data || r.data || [])).catch(() => {});
        getAllUsersRequest().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {});
        getAllCouponsRequest().then(r => setCoupons(r.data?.data || r.data || [])).catch(() => {});
    }, []);

    // Sync delivery_date when expressDelivery or created_at changes
    useEffect(() => {
        if (expressDelivery === 'si') setForm(p => ({ ...p, delivery_date: p.created_at }));
    }, [form.created_at, expressDelivery]);

    // Reset express delivery when neither Panama province nor metro mode
    useEffect(() => {
        if (locationMode !== 'metro' && (locationMode !== 'zona' || province !== 'Panamá')) {
            setExpressDelivery('no');
            setForm(p => ({ ...p, delivery_date: defaultDeliveryDate() }));
        }
    }, [province, locationMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'fin_type') next.label = LABELS[value][0];
            return next;
        });
    };

    const updateProduct = (idx, val) => setProducts(prev => prev.map((p, i) => i === idx ? val : p));
    const addProduct    = () => setProducts(prev => [...prev, { ...EMPTY_PRODUCT }]);
    const removeProduct = (idx) => setProducts(prev => prev.filter((_, i) => i !== idx));

    const autoSubTotal = products.reduce((sum, p) => {
        const price = p.priceOverride ?? p.typePrice;
        return sum + (price * (parseInt(p.qty) || 1));
    }, 0);

    const activeCoupons = coupons.filter(c => {
        if (c.status === 0) return false;
        if (c.max_uses > 0 && (c.uses_count || 0) >= c.max_uses) return false;
        return true;
    });

    const expressFee = expressDelivery === 'si' ? 10 : 0;

    const couponDiscount = appliedCoupon
        ? Math.round(autoSubTotal * appliedCoupon.percentage / 100 * 100) / 100
        : 0;

    const autoTotal = autoSubTotal - couponDiscount + expressFee;

    const effectiveTotal = parseFloat(form.total) || autoTotal || 0;
    const yappyFee = form.payment_method === 'Yappy'
        ? Math.round((effectiveTotal * 0.0125 + 0.25) * 100) / 100
        : 0;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const valid = products.filter(p => p.parfumId && p.typeId);
        if (form.fin_type === 'ingreso' && valid.length === 0) { alert('Agrega al menos un producto con perfume y tamaño seleccionado.'); return; }
        if (!form.userName.trim()) { alert('El nombre del cliente es obligatorio.'); return; }
        if (form.fin_type === 'ingreso' && !form.channel) { alert('Selecciona el canal de acceso.'); return; }
        if (!form.payment_method) { alert('Selecciona el método de pago.'); return; }

        const parfumMap = Object.fromEntries(parfums.map(p => [p.id || p._id, p.title]));
        const brandMap  = Object.fromEntries(brands.map(b => [b.id || b._id, b.brand_name]));

        const totalCost  = valid.reduce((sum, p) => {
            const cost = p.costOverride ?? p.typeCost;
            return sum + cost * (parseInt(p.qty) || 1);
        }, 0);

        const finalTotal    = parseFloat(form.total) || autoTotal;
        const finalSubTotal = autoSubTotal || parseFloat(form.subTotal) || finalTotal;

        const statusToSend = 1;

        const deliveryLabel = (() => {
            if (locationMode === 'zona') return [province, district, corregimiento].filter(Boolean).join(' — ');
            if (locationMode === 'metro') return metroLine ? `Metro ${metroLine}${metroStation ? ': ' + metroStation : ''}` : '';
            return '';
        })();

        const payload = {
            status:          statusToSend,
            fin_type:        form.fin_type,
            label:           form.label,
            total:           finalTotal,
            subTotal:        finalSubTotal,
            delivery_fee:    form.payment_method === 'Yappy' ? yappyFee : 0,
            delivery_label:  deliveryLabel || undefined,
            delivery_date:   form.delivery_date || undefined,
            description:     form.description,
            userName:        form.userName,
            phone:           form.phone,
            direction:       form.direction,
            email:           form.email,
            payment_method:  form.payment_method,
            delivery_method: form.delivery_method,
            channel:         form.channel,
            products:        valid.map(p => `${p.parfumId}=${brandMap[p.brandId] || ''} ${parfumMap[p.parfumId] || ''} ${p.typeMl}ml`),
            productsTypes:   valid.map(p => p.typeId),
            quantities:      valid.map(p => parseInt(p.qty) || 1),
            products_prices: valid.map(p => p.priceOverride ?? p.typePrice),
            products_cost:   totalCost,
            created_at:      form.created_at || undefined,
            operational_costs: form.payment_method === 'Yappy' && yappyFee > 0
                ? [{ amount: yappyFee, type_key: 'payment_fee', type_label: 'Cargo de Método de Pago', responsible_id: null, responsible_name: 'Yappy' }]
                : [],
        };

        if (form.seller_id_fk) payload.seller_id_fk = form.seller_id_fk;
        if (expressDelivery === 'si') {
            payload.express_delivery = true;
            payload.express_fee = 10;
        }
        if (appliedCoupon) {
            payload.coupon_id       = appliedCoupon._id || appliedCoupon.id;
            payload.coupon_discount = couponDiscount;
        }
        if (form.payment_method === 'Yappy') payload.yappy_fee = yappyFee;

        await onSave(payload);
        onClose();
    };

    return (
        <div className="proc-overlay">
            <div className="proc-modal agregar-tx-modal">
                <div className="proc-header">
                    <h3>Agregar Transacción</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="mov-form">
                    <div className="mov-form-section-title">Tipo y Fecha</div>
                    <div className="mov-form-row">
                        <label>Fecha de Venta *
                            <input type="date" name="created_at" value={form.created_at} onChange={handleChange}
                                max={todayISO()} required />
                        </label>
                        <label>Tipo
                            <select name="fin_type" value={form.fin_type} onChange={handleChange}>
                                <option value="ingreso">Ingreso</option>
                                <option value="salida">Salida</option>
                            </select>
                        </label>
                        <label>Etiqueta
                            <select name="label" value={form.label} onChange={handleChange}>
                                {LABELS[form.fin_type].map(l => <option key={l}>{l}</option>)}
                            </select>
                        </label>
                        <label>Canal
                            <select name="channel" value={form.channel} onChange={handleChange}>
                                <option value="">Sin especificar</option>
                                {CHANNELS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="mov-form-row">
                        <label>Vendedor (opcional)
                            <select value={form.seller_id_fk || ''}
                                onChange={e => setForm(p => ({ ...p, seller_id_fk: e.target.value }))}>
                                <option value="">Sin vendedor asignado</option>
                                {users.map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>
                                        {u.firstname} {u.lastname} — {u.email}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mov-form-section-title">Datos del Cliente</div>
                    <div className="mov-form-row">
                        <label>Nombre *
                            <input type="text" name="userName" value={form.userName} onChange={handleChange} placeholder="Nombre completo" required />
                        </label>
                        <label>Teléfono
                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="6000-0000" />
                        </label>
                        <label>Correo
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="cliente@correo.com" />
                        </label>
                    </div>
                    <div className="mov-form-row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(237,232,235,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicación</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button"
                                    className={`btn-location-mode${locationMode === 'zona' ? ' active' : ''}`}
                                    onClick={() => { setLocationMode(locationMode === 'zona' ? '' : 'zona'); setMetroLine(''); setMetroStation(''); }}>
                                    Por Zona
                                </button>
                                <button type="button"
                                    className={`btn-location-mode${locationMode === 'metro' ? ' active' : ''}`}
                                    onClick={() => { setLocationMode(locationMode === 'metro' ? '' : 'metro'); setProvince(''); setDistrict(''); setCorregimiento(''); }}>
                                    Estación Metro
                                </button>
                            </div>
                        </div>
                    </div>
                    {locationMode === 'zona' && (
                        <div className="mov-form-row">
                            <LocationSelects province={province} district={district} corregimiento={corregimiento}
                                setProvince={setProvince} setDistrict={setDistrict} setCorregimiento={setCorregimiento} />
                        </div>
                    )}
                    {locationMode === 'metro' && (
                        <div className="mov-form-row">
                            <label>Línea del Metro
                                <select value={metroLine} onChange={e => { setMetroLine(e.target.value); setMetroStation(''); }}>
                                    <option value="">Selecciona línea...</option>
                                    {METRO_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </label>
                            <label>Estación
                                <select value={metroStation} disabled={!metroLine} onChange={e => setMetroStation(e.target.value)}>
                                    <option value="">Selecciona estación</option>
                                    {(METRO_STATIONS[metroLine] || []).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                        </div>
                    )}
                    <div className="mov-form-row">
                        <label>Dirección / Referencia adicional (opcional)
                            <input type="text" name="direction" value={form.direction} onChange={handleChange} placeholder="Calle, edificio, casa, referencia..." />
                        </label>
                    </div>

                    <div className="mov-form-section-title">
                        Productos
                        <button type="button" className="btn-add-product" onClick={addProduct}>+ Agregar</button>
                    </div>
                    {products.map((p, idx) => (
                        <ProductRow key={idx} prod={p} idx={idx}
                            brands={brands} parfums={parfums}
                            onUpdate={updateProduct} onRemove={removeProduct}
                            canRemove={products.length > 1} />
                    ))}
                    {autoSubTotal > 0 && (
                        <p className="mov-auto-total">
                            Subtotal calculado: <strong>{fmtAmt(autoSubTotal)}</strong>
                            {couponDiscount > 0 && (
                                <> — Descuento: <strong style={{ color: '#d60a5f' }}>-{fmtAmt(couponDiscount)}</strong> = <strong>{fmtAmt(autoTotal)}</strong></>
                            )}
                        </p>
                    )}

                    <div className="mov-form-section-title">Pago</div>
                    <div className="mov-form-row">
                        <label>Método de Pago *
                            <select name="payment_method" value={form.payment_method} onChange={handleChange} required>
                                <option value="">Sin especificar</option>
                                <option>Efectivo</option>
                                <option>Transferencia</option>
                                <option>Yappy</option>
                            </select>
                        </label>
                        <label>Cupón (opcional)
                            <select value={appliedCoupon?._id || appliedCoupon?.id || ''}
                                onChange={e => {
                                    const found = activeCoupons.find(c => (c._id || c.id) === e.target.value);
                                    setAppliedCoupon(found || null);
                                }}>
                                <option value="">Sin cupón</option>
                                {activeCoupons.map(c => (
                                    <option key={c._id || c.id} value={c._id || c.id}>
                                        {c.code} — {c.percentage}%
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Delivery Express
                            {locationMode !== 'metro' && (locationMode !== 'zona' || province !== 'Panamá') && (
                                <span style={{ fontSize: '0.7rem', color: 'rgba(237,232,235,0.4)', display: 'block', marginBottom: 2 }}>
                                    Solo para Provincia de Panamá o Metro
                                </span>
                            )}
                            <select value={expressDelivery}
                                disabled={locationMode !== 'metro' && (locationMode !== 'zona' || province !== 'Panamá')}
                                onChange={e => {
                                    const val = e.target.value;
                                    setExpressDelivery(val);
                                    setForm(p => ({ ...p, delivery_date: val === 'si' ? p.created_at : defaultDeliveryDate() }));
                                }}>
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                            </select>
                        </label>
                    </div>
                    {(appliedCoupon || expressFee > 0) && (
                        <p className="mov-auto-total" style={{ color: '#d60a5f' }}>
                            {appliedCoupon && <>Cupón: <strong>{appliedCoupon.code}</strong> — {appliedCoupon.percentage}% (-{fmtAmt(couponDiscount)})</>}
                            {expressFee > 0 && <>{appliedCoupon ? '  +  ' : ''}Express: <strong>+{fmtAmt(expressFee)}</strong></>}
                            {autoTotal > 0 && <> → Total: <strong>{fmtAmt(autoTotal)}</strong></>}
                        </p>
                    )}

                    {/* ── Gastos Operacionales (solo cargo de método de pago, auto-calculado) ── */}
                    <div className="mov-form-section-title">Gastos Operacionales</div>
                    {form.payment_method === 'Yappy' ? (
                        <div className="op-cost-row op-cost-auto">
                            <span className="op-cost-auto-label">Cargo de Método de Pago</span>
                            <span className="op-cost-auto-resp">Yappy</span>
                            <input type="number" value={yappyFee} readOnly
                                className="op-cost-amount" style={{ opacity: 0.7, cursor: 'default' }} />
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.78rem', color: 'rgba(237,232,235,0.4)', margin: '4px 0 8px' }}>
                            Sin cargos — solo Yappy genera cargo de método de pago al crear la orden
                        </p>
                    )}

                    <div className="mov-form-section-title">Totales</div>
                    <div className="mov-form-row">
                        <label>Subtotal ($)
                            <input type="number" name="subTotal" min="0" step="0.01" value={form.subTotal} onChange={handleChange} placeholder={autoSubTotal ? autoSubTotal.toFixed(2) : '0.00'} />
                        </label>
                        <label>Total ($) *
                            <input type="number" name="total" min="0" step="0.01" value={form.total} onChange={handleChange} placeholder={autoTotal ? autoTotal.toFixed(2) : '0.00'} required={autoTotal === 0} />
                        </label>
                    </div>

                    <label>Notas / Descripción
                        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Observaciones, detalles..." />
                    </label>

                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov">Guardar Orden</button>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const isFinalized = (t) => {
    const cutoff15 = new Date(Date.now() - 15 * 24 * 3600 * 1000);
    return (
        t.delivery_status === 'delivered' ||
        t.delivery_status === 'cancelled' ||
        t.fin_type === 'salida' ||
        (t.createdAt && new Date(t.createdAt) < cutoff15)
    );
};

// ─── Modal de procesado con precios y costos editables por producto ───────────
const EMPTY_OP_COST = { amount: '', type_key: '', type_label: '', responsible_id: null, responsible_name: '' };

const ProcesarModal = ({ tx, onClose, onSave }) => {
    const [form, setForm] = useState({
        fin_type:              tx.fin_type || 'ingreso',
        payment_method:        tx.payment_method || '',
        delivery_method:       tx.delivery_method || '',
        channel:               tx.channel || '',
        label:                 tx.label || LABELS.ingreso[0],
        description:           tx.description || '',
        seller_id_fk:          tx.seller_id_fk || '',
        provider_id_fk:        tx.provider_id_fk || '',
        lot_numbers_str:       (tx.lot_numbers || []).join(', '),
        delivery_assigned_to:  tx.delivery_assigned_to || '',
        direction:             tx.direction || '',
        status: 2,
    });
    const [users, setUsers]         = useState([]);
    const [providers, setProviders] = useState([]);
    const [province, district, corregimiento] = (() => {
        const label = tx.delivery_label || '';
        if (!label || label.startsWith('Metro')) return ['', '', ''];
        const p = label.split(' — ');
        return [p[0] || '', p[1] || '', p[2] || ''];
    })();
    const [opCosts, setOpCosts] = useState(
        tx.operational_costs?.length
            ? tx.operational_costs.map(i => ({ ...i, amount: String(i.amount), inherited: i.type_key === 'payment_fee' }))
            : tx.operational_cost != null
                ? [{ ...EMPTY_OP_COST, amount: String(tx.operational_cost), type_key: 'other', type_label: 'Gasto Operativo', responsible_name: 'Sin especificar', inherited: true }]
                : []
    );
    const [opCostConfig, setOpCostConfig] = useState({ types: [], services: [] });
    const [prices, setPrices]           = useState([]);
    const [priceEditable, setPriceEditable] = useState([]);
    const [pricesTouched, setPricesTouched] = useState(false);
    const [costs, setCosts]             = useState([]);
    const [costEditable, setCostEditable]   = useState([]);
    const [dbPrices, setDbPrices]           = useState([]);
    const [txPaidPrices, setTxPaidPrices]   = useState([]);
    const [loadingTypes, setLoadingTypes]   = useState(false);

    const parsedProducts = useMemo(() =>
        (tx.products || []).map((p, i) => ({
            parfumId:    p.split('=')[0],
            displayName: p.split('=')[1] || '—',
            ml:          tx.productsTypes?.[i],
            qty:         tx.quantities?.[i] || 1,
        })),
    [tx._id]);

    useEffect(() => {
        getAllUsersRequest().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {});
        getAllProvidersRequest().then(r => setProviders(r.data || [])).catch(() => {});
        getOpCostTypesRequest().then(r => setOpCostConfig(r.data || { types: [], services: [] })).catch(() => {});
    }, []);

    const yappyFee = form.payment_method === 'Yappy'
        ? Math.round(((tx.subTotal || tx.total || 0) * 0.0125 + 0.25) * 100) / 100
        : 0;

    // Carga precio y costo desde la BD para cada producto
    useEffect(() => {
        if (!parsedProducts.length) {
            setPrices([]); setCosts([]);
            setPriceEditable([]); setCostEditable([]);
            setDbPrices([]); setTxPaidPrices([]);
            return;
        }
        setLoadingTypes(true);
        const initPrices    = parsedProducts.map(() => 0);
        const initCosts     = parsedProducts.map(() => 0);
        const initDbPrices  = parsedProducts.map(() => null);
        const initTxPaid    = parsedProducts.map((_, i) => tx.products_prices?.[i] ?? null);
        let pending = parsedProducts.length;

        parsedProducts.forEach(async ({ parfumId, ml }, i) => {
            if (parfumId && parfumId.length >= 20) {
                try {
                    const res = await getTypeByParfumId(parfumId);
                    const match = (res.data || []).find(t => String(t.ml) === String(ml));
                    if (match?.price != null) {
                        initPrices[i]   = match.price;
                        initDbPrices[i] = match.price;
                    }
                    if (match?.cost != null) initCosts[i] = match.cost;
                } catch {}
            }
            // Pre-cargar precios pagados si existen (compra del cliente o revertida)
            if (tx.products_prices?.[i] != null) initPrices[i] = tx.products_prices[i];
            pending--;
            if (pending === 0) {
                setPrices([...initPrices]);
                setCosts([...initCosts]);
                setDbPrices([...initDbPrices]);
                setTxPaidPrices([...initTxPaid]);
                setPriceEditable(parsedProducts.map(() => false));
                setCostEditable(parsedProducts.map(() => false));
                setLoadingTypes(false);
            }
        });
    }, [tx._id]);

    const totalProductsCost = costs.reduce(
        (sum, c, i) => sum + (parseFloat(c) || 0) * (parsedProducts[i]?.qty || 1), 0);

    const newTotal = prices.reduce(
        (sum, p, i) => sum + (parseFloat(p) || 0) * (parsedProducts[i]?.qty || 1), 0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'channel' && value !== 'Vendedor') next.seller_id_fk = '';
            return next;
        });
    };

    const handleSubmit = async (e, overrideStatus = null) => {
        if (e) e.preventDefault();
        const payload = { ...form };
        if (overrideStatus !== null) payload.status = overrideStatus;
        delete payload.lot_numbers_str;
        payload.lot_numbers = (form.lot_numbers_str || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!payload.seller_id_fk) delete payload.seller_id_fk;
        if (!payload.provider_id_fk) delete payload.provider_id_fk;
        if (!payload.delivery_assigned_to) {
            delete payload.delivery_assigned_to;
        } else {
            const assignedUser = users.find(u => (u.id || u._id) === payload.delivery_assigned_to);
            if (assignedUser) payload.delivery_assigned_name = `${assignedUser.firstname} ${assignedUser.lastname}`;
        }
        // Gastos operacionales estructurados
        const validCosts = opCosts.filter(c => c.type_key && c.responsible_name && parseFloat(c.amount) > 0);
        payload.operational_costs = validCosts.map(c => ({
            amount:           parseFloat(c.amount),
            type_key:         c.type_key,
            type_label:       c.type_label,
            responsible_id:   c.responsible_id || null,
            responsible_name: c.responsible_name,
        }));
        if (totalProductsCost > 0) payload.products_cost = parseFloat(totalProductsCost.toFixed(2));
        if (parsedProducts.length > 0) {
            payload.products_prices = prices.map(p => parseFloat(p) || 0);
            if (pricesTouched && newTotal > 0) payload.total = parseFloat(newTotal.toFixed(2));
        }
        // Yappy
        if (form.payment_method === 'Yappy') {
            payload.yappy_fee    = yappyFee;
            payload.delivery_fee = yappyFee;
        }
        // Dirección
        const composedLabel = [province, district, corregimiento].filter(Boolean).join(' — ');
        if (composedLabel) payload.delivery_label = composedLabel;
        if (form.direction) payload.direction = form.direction;

        await onSave(tx._id, payload);
        onClose();
    };

    // Fila de precio + costo para cada producto
    const ProductCostRow = ({ displayName, ml, qty, i, dbPrice, txPaidPrice }) => {
        const hasDiscount = txPaidPrice != null && dbPrice != null && (dbPrice - txPaidPrice) > 0.01;
        const discountPct = hasDiscount ? ((dbPrice - txPaidPrice) / dbPrice * 100).toFixed(1) : null;
        return (
            <div className="proc-product-row">
                <div className="proc-product-info">
                    <span className="proc-product-name">{displayName}</span>
                    {ml != null && <span className="proc-product-ml">{ml}ml</span>}
                    <span className="proc-product-qty">× {qty}</span>
                </div>
                {hasDiscount && (
                    <div className="proc-discount-info">
                        <span className="proc-discount-label">Comprado con descuento:</span>
                        <span className="proc-discount-original">${Number(dbPrice).toFixed(2)}</span>
                        <span className="proc-discount-badge">−{discountPct}%</span>
                        <span className="proc-discount-paid">${Number(txPaidPrice).toFixed(2)}</span>
                    </div>
                )}
                <div className="proc-dual-controls">
                    {/* Precio */}
                    <div className="proc-cost-control">
                        <span className="proc-cost-label price-label">Precio</span>
                        <input type="number" min="0" step="0.01"
                            value={prices[i] ?? 0}
                            readOnly={!priceEditable[i]}
                            onChange={e => { const a = [...prices]; a[i] = e.target.value; setPrices(a); }}
                            className={`proc-cost-input${priceEditable[i] ? ' editable' : ''}`}
                        />
                        <label className="cost-switch" title={priceEditable[i] ? 'Bloquear precio' : 'Editar precio'}>
                            <input type="checkbox" checked={priceEditable[i] || false}
                                onChange={() => {
                                    setPriceEditable(prev => prev.map((v, idx) => idx === i ? !v : v));
                                    setPricesTouched(true);
                                }} />
                            <span className="cost-switch-slider" />
                        </label>
                    </div>
                    {/* Costo */}
                    <div className="proc-cost-control">
                        <span className="proc-cost-label">Costo</span>
                        <input type="number" min="0" step="0.01"
                            value={costs[i] ?? 0}
                            readOnly={!costEditable[i]}
                            onChange={e => { const a = [...costs]; a[i] = e.target.value; setCosts(a); }}
                            className={`proc-cost-input${costEditable[i] ? ' editable' : ''}`}
                        />
                        <label className="cost-switch" title={costEditable[i] ? 'Bloquear costo' : 'Editar costo'}>
                            <input type="checkbox" checked={costEditable[i] || false}
                                onChange={() => setCostEditable(prev => prev.map((v, idx) => idx === i ? !v : v))} />
                            <span className="cost-switch-slider" />
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="proc-overlay">
            <div className="proc-modal proc-modal-lg">
                <div className="proc-header">
                    <h3>Procesar Transacción</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <div className="proc-info">
                    {tx.order_number && <p className="mov-order-num">Pedido #{tx.order_number}</p>}
                    <p><strong>{tx.userName}</strong> — {fmtAmt(tx.total)}</p>
                    <p className="mov-desc">{fmtDate(tx.createdAt)}</p>
                </div>

                {parsedProducts.length > 0 && (
                    <div className="proc-products-section">
                        <div className="mov-form-section-title">
                            Productos, Precios y Costos
                            {loadingTypes && <span className="proc-loading"> cargando...</span>}
                        </div>
                        {parsedProducts.map((prod, i) => (
                            <ProductCostRow key={i} {...prod} i={i}
                                dbPrice={dbPrices[i]}
                                txPaidPrice={txPaidPrices[i]} />
                        ))}
                        <div className="proc-totals-row">
                            {newTotal > 0 && (
                                <p className="proc-cost-total price-total">
                                    Ingreso Total: <strong>{fmtAmt(newTotal)}</strong>
                                </p>
                            )}
                            <p className="proc-cost-total">
                                Costo total productos: <strong>{fmtAmt(totalProductsCost)}</strong>
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mov-form">
                    {/* ── Datos del Pedido (readonly — del paso anterior) ── */}
                    <div className="proc-products-section">
                        <div className="mov-form-section-title">Datos del Pedido</div>
                        <div className="mov-form-row">
                            <label>Método de Pago
                                <input readOnly value={tx.payment_method || '—'}
                                    style={{ opacity: 0.7, cursor: 'default' }} />
                            </label>
                            <label>Canal
                                <input readOnly value={tx.channel || '—'}
                                    style={{ opacity: 0.7, cursor: 'default' }} />
                            </label>
                            {tx.delivery_label && (
                                <label>Ubicación
                                    <input readOnly value={tx.delivery_label}
                                        style={{ opacity: 0.7, cursor: 'default' }} />
                                </label>
                            )}
                            {tx.direction && (
                                <label>Dirección
                                    <input readOnly value={tx.direction}
                                        style={{ opacity: 0.7, cursor: 'default' }} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="mov-form-row">
                        <label>Método de Entrega
                            <select name="delivery_method" value={form.delivery_method} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option value="Delivery Propio">Delivery Propio</option>
                                <option value="Mensajería">Mensajería</option>
                            </select>
                        </label>
                        <label>Etiqueta
                            <input readOnly value={form.label || tx.label || '—'}
                                style={{ opacity: 0.7, cursor: 'default' }} />
                        </label>
                    </div>
                    {form.channel === 'Vendedor' && (
                        <div className="mov-form-row">
                            <VendorSelect value={form.seller_id_fk}
                                onChange={e => setForm(p => ({ ...p, seller_id_fk: e.target.value }))}
                                users={users} />
                        </div>
                    )}

                    {form.payment_method === 'Yappy' && (
                        <p className="mov-auto-total">
                            Comisión Yappy (auto): <strong>{fmtAmt(yappyFee)}</strong>
                        </p>
                    )}

                    {/* ── Gastos Operacionales ── */}
                    <div className="mov-form-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Gastos Operacionales
                        <button type="button" className="btn-add-product"
                            onClick={() => setOpCosts(prev => [...prev, { ...EMPTY_OP_COST }])}>
                            + Añadir Gasto
                        </button>
                    </div>
                    {opCosts.length === 0 && (
                        <p style={{ fontSize: '0.78rem', color: 'rgba(237,232,235,0.4)', margin: '4px 0 8px' }}>
                            Sin gastos operacionales registrados
                        </p>
                    )}
                    {opCosts.map((item, idx) => {
                        if (item.inherited) {
                            return (
                                <div key={idx} className="op-cost-row op-cost-inherited">
                                    <span className="op-cost-type-ro">{item.type_label || item.type_key}</span>
                                    <span className="op-cost-resp-ro">{item.responsible_name}</span>
                                    <input type="number" value={item.amount} readOnly
                                        className="op-cost-amount" style={{ opacity: 0.7, cursor: 'default' }} />
                                </div>
                            );
                        }
                        const procTypes  = opCostConfig.types.filter(t => t.key === 'product_search' || t.key === 'packaging');
                        const typeInfo   = opCostConfig.types.find(t => t.key === item.type_key);
                        const mode       = typeInfo?.responsible_mode || '';
                        const adminUsers = users.filter(u => (u.roles || [u.rol]).includes(1));

                        const updateItem = (patch) =>
                            setOpCosts(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));

                        const onTypeChange = (e) => {
                            const key  = e.target.value;
                            const info = procTypes.find(t => t.key === key);
                            updateItem({ type_key: key, type_label: info?.label || key, responsible_id: null, responsible_name: '' });
                        };

                        const onResponsibleChange = (e) => {
                            const val = e.target.value;
                            const u = adminUsers.find(u => (u.id || u._id) === val);
                            updateItem({ responsible_id: val, responsible_name: u ? `${u.firstname} ${u.lastname}` : val });
                        };

                        return (
                            <div key={idx} className="op-cost-row">
                                <select value={item.type_key} onChange={onTypeChange} className="op-cost-type">
                                    <option value="">Tipo de Gasto</option>
                                    {procTypes.map(t => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                    ))}
                                </select>
                                {mode === 'admin' && (
                                    <select value={item.responsible_id || ''} onChange={onResponsibleChange} className="op-cost-resp">
                                        <option value="">Responsable</option>
                                        {adminUsers.map(u => (
                                            <option key={u.id || u._id} value={u.id || u._id}>
                                                {u.firstname} {u.lastname}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {!mode && (
                                    <input className="op-cost-resp" placeholder="Responsable" value={item.responsible_name}
                                        onChange={e => updateItem({ responsible_name: e.target.value })} />
                                )}
                                <input type="number" min="0" step="0.01" placeholder="Monto"
                                    value={item.amount}
                                    onChange={e => updateItem({ amount: e.target.value })}
                                    className="op-cost-amount" />
                                <button type="button" className="btn-remove-product"
                                    onClick={() => setOpCosts(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                            </div>
                        );
                    })}
                    {opCosts.length > 0 && (
                        <p className="mov-auto-total" style={{ color: '#d60a5f' }}>
                            Total Gastos Op.: <strong>
                                ${opCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0).toFixed(2)}
                            </strong>
                        </p>
                    )}

                    {/* ── Proveedor ── */}
                    <div className="mov-form-row">
                        <label>Proveedor (opcional)
                            <select value={form.provider_id_fk || ''}
                                onChange={e => setForm(p => ({ ...p, provider_id_fk: e.target.value }))}>
                                <option value="">Sin proveedor asignado</option>
                                {providers.map(p => (
                                    <option key={p.id || p._id} value={p.id || p._id}>
                                        {p.provider_name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* ── Números de Lotes ── */}
                    <div className="mov-form-section-title">Números de Lotes</div>
                    {parsedProducts.length > 0 && (
                        <div className="proc-products-ref">
                            {parsedProducts.map((p, i) => (
                                <span key={i} className="proc-product-ref-item">
                                    {p.displayName}{p.ml ? ` ${p.ml}ml` : ''} × {p.qty}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mov-form-row">
                        <label>N° de Lote (separados por coma)
                            <input
                                type="text"
                                value={form.lot_numbers_str}
                                onChange={e => setForm(p => ({ ...p, lot_numbers_str: e.target.value }))}
                                placeholder="Ej: L2025-01, L2025-02"
                            />
                        </label>
                    </div>

                    {/* ── Asignar a Delivery ── */}
                    <div className="mov-form-row">
                        <label>Asignar a (Delivery)
                            <select
                                value={form.delivery_assigned_to}
                                onChange={e => setForm(p => ({ ...p, delivery_assigned_to: e.target.value }))}
                            >
                                <option value="">Sin asignar</option>
                                {users.filter(u => {
                                    const roles = u.roles || [u.rol];
                                    return roles.includes(1) || roles.includes(3);
                                }).map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>
                                        {u.firstname} {u.lastname}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label>Notas (opcional)
                        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Detalles adicionales..." />
                    </label>
                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov">Promover a En Camino</button>
                        <button type="button" className="btn-secondary-mov" onClick={() => handleSubmit(null, 1)}>Guardar sin Promover</button>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DELIVERY_STATUS_LABELS = {
    pending:   'Pendiente',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
};

// ─── Modal Ver Detalles (read-only) ──────────────────────────────────────────
const VerDetallesModal = ({ tx, onClose }) => {
    const [typeData, setTypeData] = useState([]);
    const [users, setUsers] = useState([]);

    const parsedProducts = useMemo(() =>
        (tx.products || []).map((p, i) => ({
            parfumId:    p.split('=')[0],
            displayName: p.split('=')[1] || '—',
            ml:          tx.productsTypes?.[i],
            qty:         tx.quantities?.[i] || 1,
        })),
    [tx._id]);

    // Carga precio y costo actuales de la BD para mostrar por producto
    useEffect(() => {
        if (!parsedProducts.length) return;
        const data = parsedProducts.map(() => ({ price: null, cost: null }));
        let pending = parsedProducts.length;

        parsedProducts.forEach(async ({ parfumId, ml }, i) => {
            if (parfumId?.length >= 20) {
                try {
                    const res = await getTypeByParfumId(parfumId);
                    const match = (res.data || []).find(t => String(t.ml) === String(ml));
                    if (match) data[i] = { price: match.price ?? null, cost: match.cost ?? null };
                } catch {}
            }
            pending--;
            if (pending === 0) setTypeData([...data]);
        });
    }, [tx._id]);

    useEffect(() => {
        getAllUsersRequest().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {});
    }, []);

    const assignedUser = users.find(u => (u.id || u._id) === tx.delivery_assigned_to);
    const assignedName = assignedUser
        ? `${assignedUser.firstname} ${assignedUser.lastname}`
        : (tx.delivery_assigned_to ? tx.delivery_assigned_to : null);

    const salida = getSalida(tx);

    const RO = ({ label, value, style }) => (
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.78rem', color: 'rgba(237,232,235,0.55)', gap: 4 }}>
            {label}
            <input readOnly value={value ?? '—'}
                style={{
                    background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, color: '#ede8eb', padding: '6px 9px', fontSize: '0.85rem',
                    cursor: 'default', ...style,
                }} />
        </label>
    );

    return (
        <div className="proc-overlay">
            <div className="proc-modal proc-modal-lg">
                <div className="proc-header">
                    <h3>Detalles de Transacción</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <div className="proc-info">
                    <p><strong>{tx.userName}</strong> — <span style={{ color: '#2ecc71' }}>{fmtAmt(tx.total)}</span></p>
                    <p className="mov-desc">{fmtDate(tx.createdAt)} &mdash; Procesada el {fmtDate(tx.updatedAt)}</p>
                </div>

                {/* Cliente */}
                <div className="proc-products-section">
                    <div className="mov-form-section-title">Cliente</div>
                    <div className="mov-form-row">
                        <RO label="Nombre"    value={tx.userName} />
                        <RO label="Teléfono"  value={tx.phone} />
                        <RO label="Correo"    value={tx.email} />
                        <RO label="Dirección" value={tx.direction} />
                    </div>
                </div>

                {/* Productos con precio y costo por unidad */}
                {parsedProducts.length > 0 && (
                    <div className="proc-products-section">
                        <div className="mov-form-section-title">Productos</div>
                        {parsedProducts.map(({ displayName, ml, qty }, i) => {
                            const unitPrice = tx.products_prices?.[i] ?? typeData[i]?.price;
                            const unitCost  = typeData[i]?.cost;
                            return (
                                <div key={i} className="proc-product-row det-product-row">
                                    <div className="proc-product-info">
                                        <span className="proc-product-name">{displayName}</span>
                                        {ml != null && <span className="proc-product-ml">{ml}ml</span>}
                                        <span className="proc-product-qty">× {qty}</span>
                                    </div>
                                    <div className="det-product-amounts">
                                        <span className="det-amount-label">Precio</span>
                                        <span className="det-amount-value price-value">
                                            {unitPrice != null ? fmtAmt(unitPrice) : '—'}
                                            {unitPrice != null && qty > 1 && (
                                                <span className="det-subtotal"> ({fmtAmt(unitPrice * qty)})</span>
                                            )}
                                        </span>
                                        <span className="det-amount-sep">·</span>
                                        <span className="det-amount-label">Costo</span>
                                        <span className="det-amount-value cost-value">
                                            {unitCost != null ? fmtAmt(unitCost) : '—'}
                                            {unitCost != null && qty > 1 && (
                                                <span className="det-subtotal"> ({fmtAmt(unitCost * qty)})</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pago y entrega */}
                <div className="proc-products-section">
                    <div className="mov-form-section-title">Pago y Entrega</div>
                    <div className="mov-form-row">
                        <RO label="Método de Pago"    value={tx.payment_method} />
                        <RO label="Método de Entrega" value={tx.delivery_method} />
                        <RO label="Canal"             value={tx.channel} />
                        <RO label="Etiqueta"          value={tx.label} />
                    </div>
                    {tx.channel === 'Vendedor' && (
                        <div className="mov-form-row">
                            <RO label="Vendedor" value={tx.seller} />
                        </div>
                    )}
                </div>

                {/* Delivery */}
                {(tx.lot_numbers?.length > 0 || tx.delivery_date || tx.delivery_assigned_to || tx.delivery_status || tx.delivered_by || tx.delivery_note) && (
                    <div className="proc-products-section">
                        <div className="mov-form-section-title">Delivery</div>
                        <div className="mov-form-row">
                            {tx.lot_numbers?.length > 0 && <RO label="N° de Lote" value={tx.lot_numbers.join(', ')} />}
                            {tx.delivery_date && <RO label="Fecha de Entrega" value={tx.delivery_date} />}
                            {assignedName && <RO label="Asignado a" value={assignedName} />}
                            {tx.delivery_status && (
                                <RO label="Estado de Entrega"
                                    value={DELIVERY_STATUS_LABELS[tx.delivery_status] || tx.delivery_status}
                                    style={{ color: tx.delivery_status === 'delivered' ? '#25D366' : tx.delivery_status === 'cancelled' ? '#d60a5f' : '#fdd05e' }} />
                            )}
                        </div>
                        {(tx.delivered_by || tx.delivery_note) && (
                            <div className="mov-form-row">
                                {tx.delivered_by && <RO label="Entregado por" value={tx.delivered_by} />}
                                {tx.delivery_note && <RO label="Nota de entrega" value={tx.delivery_note} />}
                            </div>
                        )}
                    </div>
                )}

                {/* Financiero desglosado */}
                <div className="proc-products-section">
                    <div className="mov-form-section-title">Financiero</div>
                    <div className="mov-form-row">
                        <RO label="Total Ingreso ($)" value={tx.total?.toFixed(2)}
                            style={{ color: '#2ecc71', fontWeight: 600 }} />
                        <RO label="Costo Productos ($)"
                            value={tx.products_cost != null ? tx.products_cost.toFixed(2) : null} />
                        <RO label="Total Salida ($)" value={salida != null ? salida.toFixed(2) : null}
                            style={{ color: salida != null ? '#d60a5f' : undefined, fontWeight: salida != null ? 600 : 400 }} />
                    </div>

                    {/* Desglose de Gastos Operacionales */}
                    {tx.operational_costs?.length > 0 ? (
                        <div className="op-cost-desglose">
                            <div className="op-cost-desglose-header">
                                <span>Tipo</span>
                                <span>Responsable</span>
                                <span style={{ textAlign: 'right' }}>Monto</span>
                            </div>
                            {tx.operational_costs.map((item, i) => (
                                <div key={i} className="op-cost-desglose-row">
                                    <span>{item.type_label || item.type_key}</span>
                                    <span>{item.responsible_name}</span>
                                    <span style={{ textAlign: 'right', color: '#d60a5f' }}>
                                        ${Number(item.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="op-cost-desglose-total">
                                <span>Total Gasto Operacional</span>
                                <span />
                                <span style={{ textAlign: 'right', color: '#d60a5f', fontWeight: 700 }}>
                                    ${tx.operational_costs.reduce((s, i) => s + i.amount, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ) : tx.operational_cost != null ? (
                        <div className="op-cost-desglose">
                            <div className="op-cost-desglose-row">
                                <span>Gasto Operativo</span>
                                <span>—</span>
                                <span style={{ textAlign: 'right', color: '#d60a5f' }}>
                                    ${Number(tx.operational_cost).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ) : null}

                    {tx.description && (
                        <div className="mov-form-row">
                            <RO label="Descripción" value={tx.description} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Cabeceras de tabla ───────────────────────────────────────────────────────
const THead = () => (
    <thead>
        <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Productos</th>
            <th className="col-money">Ingreso</th>
            <th className="col-money">Salida</th>
            <th>Etiqueta</th>
            <th>Pago</th>
            <th>Entrega</th>
            <th>Canal</th>
            <th>Descripción</th>
            <th></th>
        </tr>
    </thead>
);

const THeadFinanzas = () => (
    <thead>
        <tr>
            <th>Fecha</th>
            <th>Productos</th>
            <th className="col-money">Ingreso</th>
            <th className="col-money">Salida</th>
            <th>Etiqueta</th>
            <th>Pago</th>
            <th>Entrega</th>
            <th>Canal</th>
            <th></th>
        </tr>
    </thead>
);

// ─── Pestaña Pendientes ───────────────────────────────────────────────────────
const PendientesList = ({ pendientes, onProcess, onRejectPending, onDeletePending, loading }) => {
    const [expandedId, setExpandedId] = useState(null);
    const sorted = useMemo(() => sortByDate(pendientes), [pendientes]);

    if (loading) return <p className="chart-placeholder">Cargando pendientes...</p>;
    if (!sorted.length) return <p className="chart-placeholder">Sin transacciones pendientes — todas están al día</p>;

    return (
        <div className="mov-table-wrap">
            <table className="mov-table">
                <THead />
                <tbody>
                    {sorted.map((t) => {
                        const expanded  = expandedId === t._id;
                        const isSalida  = t.fin_type === 'salida';
                        const ingreso   = isSalida ? null : t.total;
                        const salida    = isSalida ? t.total : null;
                        return (
                            <tr key={t._id} className="mov-row-clickable"
                                onClick={() => setExpandedId(expanded ? null : t._id)}>
                                <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                <td className="mov-cell-client">
                                    <span>{t.userName}</span>
                                    {t.phone && <span className="mov-sub"> {t.phone}</span>}
                                </td>
                                <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>{fmtProducts(t.products)}</td>
                                <td className="mov-cell-amount" style={{ color: '#2ecc71' }}>
                                    {ingreso != null ? fmtAmt(ingreso) : <span className="dimmed">—</span>}
                                </td>
                                <td className="mov-cell-amount" style={{ color: salida != null ? '#d60a5f' : undefined }}>
                                    {salida != null ? fmtAmt(salida) : <span className="dimmed">—</span>}
                                </td>
                                <td className="mov-cell-tag">{t.label || '—'}</td>
                                <td className="mov-cell-tag">{t.payment_method || '—'}</td>
                                <td className="mov-cell-tag">{t.delivery_method || '—'}</td>
                                <td className="mov-cell-tag canal-cell">{canalCell(t, true)}</td>
                                <td className={`mov-cell-desc${expanded ? ' expanded' : ''}`}>
                                    {t.description || <span style={{ opacity: 0.35 }}>—</span>}
                                </td>
                                <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                    <DotsMenu options={[
                                        { label: 'Procesar', action: () => onProcess(t) },
                                        { label: 'Rechazar', cls: 'danger', action: () => onRejectPending(t._id) },
                                        { label: 'Eliminar', cls: 'danger', action: () => onDeletePending(t._id) },
                                    ]} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─── Pestaña Procesadas (En Camino + Finalizadas) ────────────────────────────
const ProcesadasList = ({ procesadas, mode, onEntregar, onDemote, onDelete, loading }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [detalles, setDetalles] = useState(null);
    const sorted = useMemo(() => sortByDate(procesadas), [procesadas]);

    const emptyMsg = mode === 'en-camino'
        ? 'Sin transacciones en camino'
        : 'Sin transacciones finalizadas en el período';

    if (loading) return <p className="chart-placeholder">Cargando...</p>;
    if (!sorted.length) return <p className="chart-placeholder">{emptyMsg}</p>;

    return (
        <>
        {detalles && <VerDetallesModal tx={detalles} onClose={() => setDetalles(null)} />}
        <div className="mov-table-wrap">
            <table className="mov-table">
                <THead />
                <tbody>
                    {sorted.map((t) => {
                        const expanded  = expandedId === t._id;
                        const isSalida  = t.fin_type === 'salida';
                        const ingreso   = isSalida ? null : t.total;
                        const salida    = isSalida ? t.total : getSalida(t);

                        const dotsOptions = [
                            { label: 'Ver detalles', action: () => setDetalles(t) },
                        ];
                        if (mode === 'en-camino') {
                            dotsOptions.push({ label: 'Entregar', action: () => onEntregar(t) });
                            dotsOptions.push({ label: 'Mover a No Procesadas', action: () => onDemote(t._id) });
                        } else {
                            dotsOptions.push({ label: 'Mover a En Camino', action: () => onDemote(t._id) });
                        }
                        dotsOptions.push({ label: 'Eliminar', cls: 'danger', action: () => onDelete(t._id) });

                        return (
                            <tr key={t._id}
                                className={`mov-row-clickable${t.omitted ? ' tx-omitted' : ''}`}
                                onClick={() => setExpandedId(expanded ? null : t._id)}>
                                <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                <td className="mov-cell-client">
                                    <span>{t.userName}</span>
                                    {t.phone && <span className="mov-sub"> {t.phone}</span>}
                                </td>
                                <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>{fmtProducts(t.products)}</td>
                                <td className="mov-cell-amount" style={{ color: '#2ecc71' }}>
                                    {ingreso != null ? fmtAmt(ingreso) : <span className="dimmed">—</span>}
                                </td>
                                <td className="mov-cell-amount" style={{ color: salida != null ? '#d60a5f' : undefined }}>
                                    {salida != null ? fmtAmt(salida) : <span className="dimmed">—</span>}
                                </td>
                                <td className="mov-cell-tag">{t.label || '—'}</td>
                                <td className="mov-cell-tag">{t.payment_method || '—'}</td>
                                <td className="mov-cell-tag">{t.delivery_method || '—'}</td>
                                <td className="mov-cell-tag canal-cell">{canalCell(t, false)}</td>
                                <td className={`mov-cell-desc${expanded ? ' expanded' : ''}`}>
                                    {t.description || <span style={{ opacity: 0.35 }}>—</span>}
                                </td>
                                <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                    <DotsMenu options={dotsOptions} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        </>
    );
};

// ─── Modal Entregar (En Camino → Finalizado) ─────────────────────────────────
const EntregarModal = ({ tx, onClose, onSave }) => {
    const panNow = () => {
        const d = new Date(Date.now() - 5 * 3600 * 1000);
        return d.toISOString().slice(0, 16);
    };
    const [form, setForm] = useState({
        delivery_status: tx.delivery_status === 'cancelled' ? 'cancelled' : 'delivered',
        delivered_by:    tx.delivered_by || tx.delivery_assigned_name || '',
        delivery_note:   tx.delivery_note || '',
        delivered_at:    tx.delivered_at ? tx.delivered_at.slice(0, 16) : panNow(),
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e, overrideStatus = null) => {
        if (e) e.preventDefault();
        const status = overrideStatus || form.delivery_status;
        if (status === 'cancelled' && !form.delivery_note.trim()) return;
        setSaving(true);
        await onSave(tx._id, status, form.delivered_by, form.delivery_note, form.delivered_at, overrideStatus !== null);
        setSaving(false);
        onClose();
    };

    const noteRequired = form.delivery_status === 'cancelled';

    return (
        <div className="proc-overlay">
            <div className="proc-modal proc-modal-lg">
                <div className="proc-header">
                    <h3>Registrar Entrega</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <div className="proc-info">
                    {tx.order_number && <p className="mov-order-num">Pedido #{tx.order_number}</p>}
                    <p><strong>{tx.userName}</strong></p>
                    <p className="mov-desc">{fmtProducts(tx.products)}</p>
                    {(tx.delivery_label || tx.direction) && (
                        <p className="mov-desc">
                            {[tx.delivery_label, tx.direction].filter(Boolean).join(' — ')}
                        </p>
                    )}
                    {tx.delivery_assigned_name && (
                        <p className="mov-desc">Asignado a: {tx.delivery_assigned_name}</p>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="mov-form">
                    <div className="mov-form-row">
                        <label>Estado *
                            <select value={form.delivery_status}
                                onChange={e => setForm(p => ({ ...p, delivery_status: e.target.value }))}>
                                <option value="delivered">Completado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </label>
                        <label>Fecha y Hora de Entrega *
                            <input type="datetime-local" value={form.delivered_at}
                                onChange={e => setForm(p => ({ ...p, delivered_at: e.target.value }))} required />
                        </label>
                    </div>
                    <div className="mov-form-row">
                        <label>Entregado por
                            <input type="text" value={form.delivered_by} readOnly
                                style={{ opacity: 0.7, cursor: 'default' }} />
                        </label>
                    </div>
                    <label>Nota{noteRequired ? ' (obligatoria al cancelar)' : ' (opcional)'}
                        <input type="text" value={form.delivery_note}
                            onChange={e => setForm(p => ({ ...p, delivery_note: e.target.value }))}
                            placeholder="Motivo de cancelación, observaciones..."
                            required={noteRequired} />
                    </label>
                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov" disabled={saving}>
                            Promover a Finalizado
                        </button>
                        <button type="button" className="btn-secondary-mov" disabled={saving}
                            onClick={() => handleSubmit(null, 'no-promote')}>
                            Guardar sin Promover
                        </button>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Modal Agregar Cuenta ────────────────────────────────────────────────────
const EMPTY_CUENTA = {
    fin_type: 'ingreso',
    entity_name: '',
    description: '',
    total: '',
    next_payment_date: '',
    created_at: todayISO(),
};

const AgregarCuentaModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState({ ...EMPTY_CUENTA });
    const [saving, setSaving] = useState(false);

    const labelFor = (ft) => ft === 'ingreso' ? 'Cuenta por Cobrar' : 'Cuenta por Pagar';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.entity_name.trim()) { alert('El nombre de la entidad/persona es obligatorio.'); return; }
        if (!parseFloat(form.total) > 0) { alert('El monto total debe ser mayor a 0.'); return; }
        setSaving(true);
        try {
            await onSave({
                fin_type:          form.fin_type,
                label:             labelFor(form.fin_type),
                entity_name:       form.entity_name.trim(),
                description:       form.description.trim(),
                total:             parseFloat(form.total),
                next_payment_date: form.next_payment_date || null,
                created_at:        form.created_at || undefined,
            });
            onClose();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="proc-overlay">
            <div className="proc-modal">
                <div className="proc-header">
                    <h3>Nueva Cuenta</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="mov-form">
                    <div className="mov-form-section-title">Tipo de Cuenta</div>
                    <div className="mov-form-row">
                        <label>Tipo
                            <select name="fin_type" value={form.fin_type} onChange={handleChange}>
                                <option value="ingreso">Cuenta por Cobrar (Ingreso)</option>
                                <option value="salida">Cuenta por Pagar (Salida)</option>
                            </select>
                        </label>
                        <label>Fecha
                            <input type="date" name="created_at" value={form.created_at}
                                onChange={handleChange} max={todayISO()} />
                        </label>
                    </div>
                    <div className="mov-form-row">
                        <label>Etiqueta (generada)
                            <input readOnly value={labelFor(form.fin_type)}
                                style={{ opacity: 0.7, cursor: 'default' }} />
                        </label>
                    </div>

                    <div className="mov-form-section-title">Entidad / Persona</div>
                    <div className="mov-form-row">
                        <label>Nombre *
                            <input type="text" name="entity_name" value={form.entity_name}
                                onChange={handleChange} placeholder="Nombre de la persona o empresa" required />
                        </label>
                    </div>

                    <div className="mov-form-section-title">Monto y Descripción</div>
                    <div className="mov-form-row">
                        <label>Monto Total ($) *
                            <input type="number" name="total" min="0.01" step="0.01" value={form.total}
                                onChange={handleChange} placeholder="0.00" required />
                        </label>
                        <label className="cta-next-label">
                            Próximo Abono (estimado)
                            <input type="date" name="next_payment_date" value={form.next_payment_date}
                                onChange={handleChange} />
                        </label>
                    </div>
                    <label>Descripción (opcional)
                        <input type="text" name="description" value={form.description}
                            onChange={handleChange} placeholder="Motivo, concepto, detalles..." />
                    </label>

                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov" disabled={saving}>
                            {saving ? 'Guardando...' : 'Crear Cuenta'}
                        </button>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Modal Abonar a Cuenta ───────────────────────────────────────────────────
const AbonarModal = ({ cuenta, onClose, onSave, readOnly = false }) => {
    const [amount, setAmount]         = useState('');
    const [note, setNote]             = useState('');
    const [nextDate, setNextDate]     = useState(cuenta.next_payment_date?.slice(0,10) || '');
    const [saving, setSaving]         = useState(false);

    const paid      = cuenta.amount_paid || 0;
    const total     = cuenta.total || 0;
    const remaining = Math.max(0, total - paid);
    const pct       = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { alert('El monto debe ser mayor a 0.'); return; }
        if (amt > remaining + 0.001) { alert(`El abono supera el saldo pendiente ($${remaining.toFixed(2)}).`); return; }
        setSaving(true);
        try {
            await onSave(cuenta._id, { amount: amt, note: note.trim(), next_payment_date: nextDate || null });
            onClose();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="proc-overlay">
            <div className="proc-modal">
                <div className="proc-header">
                    <h3>Registrar Abono</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>

                <div className="proc-info">
                    <p><strong>{cuenta.entity_name || cuenta.entity_display}</strong></p>
                    <p className="mov-desc">{cuenta.description || cuenta.label}</p>
                </div>

                {/* Progreso */}
                <div className="cta-progress-wrap">
                    <div className="cta-progress-labels">
                        <span>Abonado: <strong style={{ color: '#2ecc71' }}>{fmtAmt(paid)}</strong></span>
                        <span>Total: <strong>{fmtAmt(total)}</strong></span>
                    </div>
                    <div className="cta-progress-bar">
                        <div className="cta-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="cta-progress-remaining">Pendiente: <strong>{fmtAmt(remaining)}</strong></p>
                </div>

                {/* Historial */}
                {cuenta.payment_history?.length > 0 && (
                    <div className="cta-history">
                        <div className="mov-form-section-title">Historial de Abonos</div>
                        {[...(cuenta.payment_history)].reverse().map((p, i) => (
                            <div key={i} className="cta-history-row">
                                <span className="cta-history-date">{fmtDate(p.date)}</span>
                                <span className="cta-history-note">{p.note || '—'}</span>
                                <span className="cta-history-amt" style={{ color: '#2ecc71' }}>{fmtAmt(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Formulario nuevo abono */}
                {!readOnly && (
                    <form onSubmit={handleSubmit} className="mov-form">
                        <div className="mov-form-section-title">Nuevo Abono</div>
                        <div className="mov-form-row">
                            <label>Monto ($) *
                                <input type="number" min="0.01" step="0.01" max={remaining.toFixed(2)}
                                    value={amount} onChange={e => setAmount(e.target.value)}
                                    placeholder={`Máx. ${fmtAmt(remaining)}`} required />
                            </label>
                            <label className="cta-next-label">
                                Próximo Abono (estimado)
                                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
                            </label>
                        </div>
                        <label>Nota (opcional)
                            <input type="text" value={note} onChange={e => setNote(e.target.value)}
                                placeholder="Descripción del abono..." />
                        </label>
                        <div className="mov-form-actions">
                            <button type="submit" className="btn-save-mov" disabled={saving}>
                                {saving ? 'Guardando...' : 'Registrar Abono'}
                            </button>
                            <button type="button" className="btn-cancel-mov" onClick={onClose}>Cerrar</button>
                        </div>
                    </form>
                )}
                {readOnly && (
                    <div className="mov-form-actions" style={{ padding: '12px 0 0' }}>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Lista de Cuentas por Cobrar / Pagar ─────────────────────────────────────
const CuentasList = ({ cuentas, loading, onAbonar, onDelete, onToggleOmit, readOnly = false }) => {
    if (loading) return <p className="chart-placeholder">Cargando cuentas...</p>;

    const pendientes = (cuentas || []).filter(c => c.status === 3);
    const cerradas   = (cuentas || []).filter(c => c.status !== 3);

    const isOverdue = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr + 'T00:00:00') < new Date();
    };

    const renderRow = (c) => {
        const paid    = c.amount_paid || 0;
        const total   = c.total || 0;
        const pct     = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
        const isCobrar = c.fin_type === 'ingreso';
        const closed  = c.status !== 3;
        const nextDate = c.next_payment_date?.slice(0, 10) || null;
        const overdue  = !closed && isOverdue(nextDate);

        const dotsOptions = [
            { label: 'Ver detalles', action: () => onAbonar?.(c) },
        ];
        if (!readOnly && !closed && onAbonar) dotsOptions.push({ label: 'Abonar', action: () => onAbonar(c) });
        if (!readOnly && onDelete) dotsOptions.push({ label: 'Eliminar', cls: 'danger', action: () => onDelete(c._id) });
        if (onToggleOmit) dotsOptions.push({
            label: c.omitted ? 'Incluir en estadísticas' : 'Omitir de estadísticas',
            action: () => onToggleOmit(c._id, !c.omitted),
        });

        return (
            <tr key={c._id} className={`mov-row-clickable${closed ? ' tx-omitted' : ''}`}>
                <td className="mov-cell-date">{fmtDate(c.createdAt)}</td>
                <td className="mov-cell-client">
                    <span>{c.entity_name || c.entity_display || '—'}</span>
                </td>
                <td>
                    <span className={`cta-badge cta-badge-${isCobrar ? 'cobrar' : 'pagar'}`}>
                        {isCobrar ? 'Cobrar' : 'Pagar'}
                    </span>
                </td>
                <td className="mov-cell-ellipsis">{c.description || c.label || '—'}</td>
                <td className="mov-cell-amount" style={{ color: isCobrar ? '#2ecc71' : '#d60a5f' }}>
                    {fmtAmt(total)}
                </td>
                <td style={{ minWidth: 140 }}>
                    <div className="cta-progress-bar cta-table-bar">
                        <div className="cta-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="cta-table-bar-labels">
                        <span style={{ color: '#2ecc71' }}>{fmtAmt(paid)}</span>
                        <span style={{ opacity: 0.5 }}>{pct.toFixed(0)}%</span>
                    </div>
                </td>
                {/* Próximo Abono — columna destacada */}
                <td className={`cta-next-col${overdue ? ' cta-next-overdue' : ''}${!closed && nextDate && !overdue ? ' cta-next-upcoming' : ''}`}>
                    {closed ? (
                        <span style={{ opacity: 0.35, fontSize: '0.72rem' }}>Cerrada</span>
                    ) : nextDate ? (
                        <>
                            <span className="cta-next-icon">{overdue ? '⚠' : '📅'}</span>
                            <span className="cta-next-date">{fmtDate(nextDate)}</span>
                        </>
                    ) : (
                        <span style={{ opacity: 0.3, fontSize: '0.72rem' }}>—</span>
                    )}
                </td>
                <td className="mov-actions" onClick={e => e.stopPropagation()}>
                    <DotsMenu options={dotsOptions} />
                </td>
            </tr>
        );
    };

    return (
        <div className="mov-table-wrap">
            {pendientes.length === 0 && cerradas.length === 0 && (
                <p className="chart-placeholder">Sin cuentas registradas — usa "+ Añadir" para crear una</p>
            )}
            {(pendientes.length > 0 || cerradas.length > 0) && (
                <table className="mov-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th className="col-money">Total</th>
                            <th>Progreso</th>
                            <th className="cta-next-th">Próximo Abono</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendientes.map(renderRow)}
                        {cerradas.length > 0 && pendientes.length > 0 && (
                            <tr><td colSpan={8} className="cta-section-sep">Cerradas</td></tr>
                        )}
                        {cerradas.map(renderRow)}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const MovimientosCRUD = ({
    pendientes, procesadas, cuentas = [],
    onProcess, onAddTransaction, onRejectPending, onDeletePending, onDelete,
    onEntregar, onSaveDelivery,
    onDemoteToNoProcesadas, onDemoteToEnCamino,
    onAddCuenta, onAbonar, onDeleteCuenta,
    loadingPendientes, loadingProcesadas, loadingCuentas = false,
    openExternal = false, onCloseExternal,
}) => {
    const [tab, setTab] = useState('pendientes');
    const [procesando, setProcesando] = useState(null);
    const [entregando, setEntregando] = useState(null);
    const [showAgregar, setShowAgregar] = useState(false);
    const [abonando, setAbonando]       = useState(null);
    const [showAgregarCuenta, setShowAgregarCuenta] = useState(false);

    const finalizadas = useMemo(() => (procesadas || []).filter(isFinalized), [procesadas]);
    const enCamino    = useMemo(() => (procesadas || []).filter(t => !isFinalized(t)), [procesadas]);
    const completadas = useMemo(() => finalizadas.filter(t => t.delivery_status === 'delivered'), [finalizadas]);
    const canceladas  = useMemo(() => finalizadas.filter(t => t.delivery_status === 'cancelled'), [finalizadas]);
    const cuentasPendientes = useMemo(() => (cuentas || []).filter(c => c.status === 3), [cuentas]);
    const cuentasCerradas   = useMemo(() => (cuentas || []).filter(c => c.status !== 3), [cuentas]);

    useEffect(() => {
        if (openExternal) {
            if (tab === 'cuentas') setShowAgregarCuenta(true);
            else setShowAgregar(true);
        }
    }, [openExternal]);

    return (
        <div className="mov-crud">
            <div className="mov-header">
                <div className="dim-tabs">
                    <button className={`dim-tab${tab === 'pendientes' ? ' active' : ''}`}
                        onClick={() => setTab('pendientes')} type="button">
                        No Procesadas
                        {pendientes?.length ? <span className="pending-badge">{pendientes.length}</span> : null}
                    </button>
                    <button className={`dim-tab${tab === 'procesadas' ? ' active' : ''}`}
                        onClick={() => setTab('procesadas')} type="button">
                        En Camino
                        {enCamino.length ? <span className="pending-badge" style={{ background: '#fdd05e', color: '#080409' }}>{enCamino.length}</span> : null}
                    </button>
                    <button className={`dim-tab${tab === 'finalizadas' ? ' active' : ''}`}
                        onClick={() => setTab('finalizadas')} type="button">
                        Finalizadas
                        {finalizadas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#25D366', color: '#080409' }}>{finalizadas.length}</span>
                        )}
                        {canceladas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#d60a5f', color: '#fff', marginLeft: 3 }} title="Canceladas">{canceladas.length}</span>
                        )}
                    </button>
                    <button className={`dim-tab${tab === 'cuentas' ? ' active' : ''}`}
                        onClick={() => setTab('cuentas')} type="button">
                        Cuentas
                        {cuentasPendientes.length > 0 && (
                            <span className="pending-badge" style={{ background: '#fdd05e', color: '#080409' }} title="Pendientes">{cuentasPendientes.length}</span>
                        )}
                        {cuentasCerradas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#25D366', color: '#080409', marginLeft: 3 }} title="Cerradas">{cuentasCerradas.length}</span>
                        )}
                    </button>
                </div>
            </div>

            {tab === 'pendientes' && (
                <PendientesList
                    pendientes={pendientes}
                    onProcess={setProcesando}
                    onRejectPending={onRejectPending}
                    onDeletePending={onDeletePending}
                    loading={loadingPendientes}
                />
            )}
            {tab === 'procesadas' && (
                <ProcesadasList procesadas={enCamino} mode="en-camino"
                    onEntregar={setEntregando} onDemote={onDemoteToNoProcesadas}
                    onDelete={onDelete} loading={loadingProcesadas} />
            )}
            {tab === 'finalizadas' && (
                <ProcesadasList procesadas={finalizadas} mode="finalizadas"
                    onEntregar={null} onDemote={onDemoteToEnCamino}
                    onDelete={onDelete} loading={loadingProcesadas} />
            )}
            {tab === 'cuentas' && (
                <CuentasList
                    cuentas={cuentas}
                    loading={loadingCuentas}
                    onAbonar={setAbonando}
                    onDelete={onDeleteCuenta}
                />
            )}

            {procesando && (
                <ProcesarModal tx={procesando} onClose={() => setProcesando(null)} onSave={onProcess} />
            )}
            {entregando && (
                <EntregarModal tx={entregando} onClose={() => setEntregando(null)}
                    onSave={onEntregar} />
            )}
            {showAgregar && (
                <AgregarTransaccionModal
                    onClose={() => { setShowAgregar(false); onCloseExternal?.(); }}
                    onSave={onAddTransaction}
                />
            )}
            {showAgregarCuenta && (
                <AgregarCuentaModal
                    onClose={() => { setShowAgregarCuenta(false); onCloseExternal?.(); }}
                    onSave={onAddCuenta}
                />
            )}
            {abonando && (
                <AbonarModal
                    cuenta={abonando}
                    onClose={() => setAbonando(null)}
                    onSave={onAbonar}
                />
            )}
        </div>
    );
};

// ─── Lista simplificada para Finanzas (sin Cliente ni Descripción) ────────────
const FinanzasProcesadasList = ({ procesadas, loading, emptyMsg, onToggleOmit }) => {
    const [detalles, setDetalles] = useState(null);
    const sorted = useMemo(() => sortByDate(procesadas), [procesadas]);

    if (loading) return <p className="chart-placeholder">Cargando...</p>;
    if (!sorted.length) return <p className="chart-placeholder">{emptyMsg}</p>;

    return (
        <>
            {detalles && <VerDetallesModal tx={detalles} onClose={() => setDetalles(null)} />}
            <div className="mov-table-wrap">
                <table className="mov-table">
                    <THeadFinanzas />
                    <tbody>
                        {sorted.map((t) => {
                            const isSalida = t.fin_type === 'salida';
                            const ingreso  = isSalida ? null : t.total;
                            const salida   = isSalida ? t.total : getSalida(t);
                            const dotsOpts = [
                                { label: 'Ver detalles', action: () => setDetalles(t) },
                            ];
                            if (onToggleOmit) {
                                dotsOpts.push({
                                    label: t.omitted ? 'Incluir en estadísticas' : 'Omitir de estadísticas',
                                    action: () => onToggleOmit(t._id, !t.omitted),
                                });
                            }
                            return (
                                <tr key={t._id}
                                    className={`mov-row-clickable${t.omitted ? ' tx-omitted' : ''}`}
                                    onClick={() => setDetalles(t)}>
                                    <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                    <td className="mov-cell-ellipsis">{fmtProducts(t.products)}</td>
                                    <td className="mov-cell-amount"
                                        style={{ color: '#2ecc71', textDecoration: t.omitted ? 'line-through' : 'none' }}>
                                        {ingreso != null ? fmtAmt(ingreso) : <span className="dimmed">—</span>}
                                    </td>
                                    <td className="mov-cell-amount" style={{ color: salida != null ? '#d60a5f' : undefined }}>
                                        {salida != null ? fmtAmt(salida) : <span className="dimmed">—</span>}
                                    </td>
                                    <td className="mov-cell-tag">{t.label || '—'}</td>
                                    <td className="mov-cell-tag">{t.payment_method || '—'}</td>
                                    <td className="mov-cell-tag">{t.delivery_method || '—'}</td>
                                    <td className="mov-cell-tag canal-cell">{canalCell(t)}</td>
                                    <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                        <DotsMenu options={dotsOpts} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export const FinanzasMovimientos = ({ procesadas, loading, onToggleOmit, cuentas = [], loadingCuentas = false }) => {
    const [tab, setTab] = useState('en-camino');
    const [verDetalle, setVerDetalle] = useState(null);

    const finalizadas       = useMemo(() => (procesadas || []).filter(isFinalized), [procesadas]);
    const enCamino          = useMemo(() => (procesadas || []).filter(t => !isFinalized(t)), [procesadas]);
    const completadas       = useMemo(() => finalizadas.filter(t => t.delivery_status === 'delivered'), [finalizadas]);
    const canceladas        = useMemo(() => finalizadas.filter(t => t.delivery_status === 'cancelled'), [finalizadas]);
    const cuentasPendientes = useMemo(() => (cuentas || []).filter(c => c.status === 3), [cuentas]);
    const cuentasCerradas   = useMemo(() => (cuentas || []).filter(c => c.status !== 3), [cuentas]);

    return (
        <>
        {verDetalle && (
            <AbonarModal cuenta={verDetalle} onClose={() => setVerDetalle(null)} onSave={null} readOnly />
        )}
        <div className="mov-crud">
            <div className="mov-header">
                <div className="dim-tabs">
                    <button className={`dim-tab${tab === 'en-camino' ? ' active' : ''}`}
                        onClick={() => setTab('en-camino')} type="button">
                        En Camino
                        {enCamino.length > 0 && (
                            <span className="pending-badge" style={{ background: '#fdd05e', color: '#080409' }}>{enCamino.length}</span>
                        )}
                    </button>
                    <button className={`dim-tab${tab === 'finalizadas' ? ' active' : ''}`}
                        onClick={() => setTab('finalizadas')} type="button">
                        Finalizadas
                        {finalizadas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#25D366', color: '#080409' }}>{finalizadas.length}</span>
                        )}
                        {canceladas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#d60a5f', color: '#fff', marginLeft: 3 }} title="Canceladas">{canceladas.length}</span>
                        )}
                    </button>
                    <button className={`dim-tab${tab === 'cuentas' ? ' active' : ''}`}
                        onClick={() => setTab('cuentas')} type="button">
                        Cuentas
                        {cuentasPendientes.length > 0 && (
                            <span className="pending-badge" style={{ background: '#fdd05e', color: '#080409' }} title="Pendientes">{cuentasPendientes.length}</span>
                        )}
                        {cuentasCerradas.length > 0 && (
                            <span className="pending-badge" style={{ background: '#25D366', color: '#080409', marginLeft: 3 }} title="Cerradas">{cuentasCerradas.length}</span>
                        )}
                    </button>
                </div>
            </div>
            {tab === 'en-camino' && (
                <FinanzasProcesadasList
                    procesadas={enCamino} loading={loading}
                    emptyMsg="Sin transacciones en camino en el período"
                    onToggleOmit={onToggleOmit} />
            )}
            {tab === 'finalizadas' && (
                <FinanzasProcesadasList
                    procesadas={finalizadas} loading={loading}
                    emptyMsg="Sin transacciones finalizadas en el período"
                    onToggleOmit={onToggleOmit} />
            )}
            {tab === 'cuentas' && (
                <CuentasList
                    cuentas={cuentas}
                    loading={loadingCuentas}
                    onAbonar={setVerDetalle}
                    onToggleOmit={onToggleOmit}
                    readOnly
                />
            )}
        </div>
        </>
    );
};
