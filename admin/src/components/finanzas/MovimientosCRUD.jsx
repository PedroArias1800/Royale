import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    getAllBrandsRequest,
    getAllParfumsRequest,
    getTypeByParfumId,
    getAllUsersRequest,
} from '../../api/Admin.api.js';
import { getOpCostTypesRequest } from '../../api/Cortes.api.js';

const LABELS = {
    ingreso: ['Venta Directa', 'Abono', 'Devolución recibida', 'Otro ingreso'],
    salida:  ['Costo del Producto', 'Gastos Operativos', 'Merma', 'Publicidad y Marketing', 'Envíos y Logística', 'Devolución emitida', 'Pago de Corte', 'Otro gasto'],
};

const CHANNELS = ['Sitio Web', 'WhatsApp', 'Instagram', 'Facebook', 'QR', 'Google', 'Directo', 'Vendedor', 'Presencial', 'Wompi', 'Yappy', 'Otro'];

const todayISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Panama' });

const EMPTY_TX = {
    status: '1', fin_type: 'ingreso', label: LABELS.ingreso[0],
    userName: '', phone: '', direction: '', email: '',
    payment_method: '', delivery_method: '', delivery_fee: '', delivery_label: '',
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
const AgregarTransaccionModal = ({ onClose, onSave }) => {
    const [form, setForm] = useState(EMPTY_TX);
    const [products, setProducts] = useState([{ ...EMPTY_PRODUCT }]);
    const [brands, setBrands] = useState([]);
    const [parfums, setParfums] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getAllBrandsRequest().then(r => setBrands(r.data?.data || r.data || [])).catch(() => {});
        getAllParfumsRequest().then(r => setParfums(r.data?.data || r.data || [])).catch(() => {});
        getAllUsersRequest().then(r => setUsers(r.data?.data || r.data || [])).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'fin_type') next.label = LABELS[value][0];
            if (name === 'channel' && value !== 'Vendedor') next.seller_id_fk = '';
            return next;
        });
    };

    const updateProduct = (idx, val) => setProducts(prev => prev.map((p, i) => i === idx ? val : p));
    const addProduct    = () => setProducts(prev => [...prev, { ...EMPTY_PRODUCT }]);
    const removeProduct = (idx) => setProducts(prev => prev.filter((_, i) => i !== idx));

    const autoTotal = products.reduce((sum, p) => {
        const price = p.priceOverride ?? p.typePrice;
        return sum + (price * (parseInt(p.qty) || 1));
    }, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valid = products.filter(p => p.parfumId && p.typeId);
        const parfumMap = Object.fromEntries(parfums.map(p => [p.id || p._id, p.title]));
        const brandMap  = Object.fromEntries(brands.map(b => [b.id || b._id, b.brand_name]));

        const totalCost = valid.reduce((sum, p) => {
            const cost = p.costOverride ?? p.typeCost;
            return sum + cost * (parseInt(p.qty) || 1);
        }, 0);

        const payload = {
            status:          parseInt(form.status),
            fin_type:        form.fin_type,
            label:           form.label,
            total:           parseFloat(form.total) || autoTotal,
            subTotal:        parseFloat(form.subTotal) || parseFloat(form.total) || autoTotal,
            delivery_fee:    parseFloat(form.delivery_fee) || 0,
            delivery_label:  form.delivery_label,
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
        };
        if (form.seller_id_fk) payload.seller_id_fk = form.seller_id_fk;

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
                    <div className="mov-form-section-title">Estado y Tipo</div>
                    <div className="mov-form-row">
                        <label>Fecha de Venta *
                            <input type="date" name="created_at" value={form.created_at} onChange={handleChange}
                                max={todayISO()} required />
                        </label>
                        <label>Estado *
                            <select name="status" value={form.status} onChange={handleChange} required>
                                <option value="1">Pendiente</option>
                                <option value="2">Procesada</option>
                            </select>
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
                    {form.channel === 'Vendedor' && (
                        <div className="mov-form-row">
                            <VendorSelect value={form.seller_id_fk}
                                onChange={e => setForm(p => ({ ...p, seller_id_fk: e.target.value }))}
                                users={users} />
                        </div>
                    )}

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
                        <label>Dirección / Zona
                            <input type="text" name="direction" value={form.direction} onChange={handleChange} placeholder="Zona, corregimiento..." />
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
                    {autoTotal > 0 && (
                        <p className="mov-auto-total">Total calculado: <strong>{fmtAmt(autoTotal)}</strong></p>
                    )}

                    <div className="mov-form-section-title">Pago y Entrega</div>
                    <div className="mov-form-row">
                        <label>Método de Pago
                            <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                                <option value="">Sin especificar</option>
                                <option>Efectivo</option><option>Transferencia</option>
                                <option>Yappy</option><option>Tarjeta</option><option>Otro</option>
                            </select>
                        </label>
                        <label>Método de Entrega
                            <select name="delivery_method" value={form.delivery_method} onChange={handleChange}>
                                <option value="">Sin especificar</option>
                                <option>Pickup</option>
                                <option value="Delivery propio">Delivery propio</option>
                                <option value="Mensajería">Mensajería</option>
                                <option>Digital</option>
                            </select>
                        </label>
                        <label>Costo de Envío ($)
                            <input type="number" name="delivery_fee" min="0" step="0.01" value={form.delivery_fee} onChange={handleChange} placeholder="0.00" />
                        </label>
                        <label>Zona de Entrega
                            <input type="text" name="delivery_label" value={form.delivery_label} onChange={handleChange} placeholder="Ej: Milla 8..." />
                        </label>
                    </div>

                    <div className="mov-form-section-title">Totales</div>
                    <div className="mov-form-row">
                        <label>Subtotal ($)
                            <input type="number" name="subTotal" min="0" step="0.01" value={form.subTotal} onChange={handleChange} placeholder={autoTotal ? autoTotal.toFixed(2) : '0.00'} />
                        </label>
                        <label>Total ($) *
                            <input type="number" name="total" min="0" step="0.01" value={form.total} onChange={handleChange} placeholder={autoTotal ? autoTotal.toFixed(2) : '0.00'} required={autoTotal === 0} />
                        </label>
                    </div>

                    <label>Notas / Descripción
                        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Observaciones, cupones, detalles..." />
                    </label>

                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov">Guardar Transacción</button>
                        <button type="button" className="btn-cancel-mov" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Cutoff: transacciones antes de esta fecha van directo a Finalizadas
const FINALIZADAS_CUTOFF = new Date('2025-08-10T00:00:00-05:00');
const isFinalized = (t) =>
    t.delivery_status === 'delivered' ||
    t.fin_type === 'salida' ||
    (t.createdAt && new Date(t.createdAt) < FINALIZADAS_CUTOFF);

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
        lot_numbers_str:       (tx.lot_numbers || []).join(', '),
        delivery_assigned_to:  tx.delivery_assigned_to || '',
        status: 2,
    });
    const [users, setUsers] = useState([]);
    const [opCosts, setOpCosts] = useState(
        tx.operational_costs?.length
            ? tx.operational_costs.map(i => ({ ...i, amount: String(i.amount) }))
            : tx.operational_cost != null
                ? [{ ...EMPTY_OP_COST, amount: String(tx.operational_cost), type_key: 'other', type_label: 'Gasto Operativo', responsible_name: 'Sin especificar' }]
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
        getOpCostTypesRequest().then(r => setOpCostConfig(r.data || { types: [], services: [] })).catch(() => {});
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form };
        delete payload.lot_numbers_str;
        payload.lot_numbers = (form.lot_numbers_str || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!payload.seller_id_fk) delete payload.seller_id_fk;
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
                    <div className="mov-form-row">
                        <label>Método de Pago
                            <select name="payment_method" value={form.payment_method} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option>Efectivo</option><option>Transferencia</option>
                                <option>Yappy</option><option>Tarjeta</option><option>Otro</option>
                            </select>
                        </label>
                        <label>Método de Entrega
                            <select name="delivery_method" value={form.delivery_method} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option>Pickup</option>
                                <option value="Delivery propio">Delivery propio</option>
                                <option value="Mensajería">Mensajería</option>
                                <option>Digital</option>
                            </select>
                        </label>
                        <label>Canal de Acceso
                            <select name="channel" value={form.channel} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                {CHANNELS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                        <label>Etiqueta
                            <select name="label" value={form.label} onChange={handleChange}>
                                {LABELS.ingreso.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </label>
                    </div>
                    {form.channel === 'Vendedor' && (
                        <div className="mov-form-row">
                            <VendorSelect value={form.seller_id_fk}
                                onChange={e => setForm(p => ({ ...p, seller_id_fk: e.target.value }))}
                                users={users} />
                        </div>
                    )}
                    {/* ── Gastos Operacionales estructurados ── */}
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
                        const typeInfo  = opCostConfig.types.find(t => t.key === item.type_key);
                        const mode      = typeInfo?.responsible_mode || '';
                        const adminUsers      = users.filter(u => (u.roles || [u.rol]).includes(1));
                        const deliveryUsers   = users.filter(u => {
                            const r = u.roles || [u.rol];
                            return r.includes(1) || r.includes(3);
                        });

                        const updateItem = (patch) =>
                            setOpCosts(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));

                        const onTypeChange = (e) => {
                            const key  = e.target.value;
                            const info = opCostConfig.types.find(t => t.key === key);
                            updateItem({ type_key: key, type_label: info?.label || key, responsible_id: null, responsible_name: '' });
                        };

                        const onResponsibleChange = (e) => {
                            const val = e.target.value;
                            if (mode === 'external') {
                                updateItem({ responsible_id: null, responsible_name: val });
                            } else {
                                const u = (mode === 'admin' ? adminUsers : deliveryUsers)
                                    .find(u => (u.id || u._id) === val);
                                updateItem({
                                    responsible_id:   val,
                                    responsible_name: u ? `${u.firstname} ${u.lastname}` : val,
                                });
                            }
                        };

                        return (
                            <div key={idx} className="op-cost-row">
                                <select value={item.type_key} onChange={onTypeChange} className="op-cost-type">
                                    <option value="">Tipo de Gasto</option>
                                    {opCostConfig.types.map(t => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                    ))}
                                </select>

                                {mode === 'external' && (
                                    <select value={item.responsible_name} onChange={onResponsibleChange} className="op-cost-resp">
                                        <option value="">Servicio</option>
                                        {opCostConfig.services.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                )}
                                {(mode === 'admin' || mode === 'admin_delivery') && (
                                    <select value={item.responsible_id || ''} onChange={onResponsibleChange} className="op-cost-resp">
                                        <option value="">Responsable</option>
                                        {(mode === 'admin' ? adminUsers : deliveryUsers).map(u => (
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
                    <div className="mov-form-row">
                        <label>N° de Lote (separados por coma)
                            <input
                                type="text"
                                value={form.lot_numbers_str}
                                onChange={e => setForm(p => ({ ...p, lot_numbers_str: e.target.value }))}
                                placeholder="Ej: L2025-01, L2025-02"
                            />
                        </label>
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
                        <button type="submit" className="btn-save-mov">Marcar como procesada</button>
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

// ─── Cabecera de tabla (sin C.Op.) ────────────────────────────────────────────
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
                        const expanded = expandedId === t._id;
                        return (
                            <tr key={t._id} className="mov-row-clickable"
                                onClick={() => setExpandedId(expanded ? null : t._id)}>
                                <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                <td className="mov-cell-client">
                                    <span>{t.userName}</span>
                                    {t.phone && <span className="mov-sub"> {t.phone}</span>}
                                </td>
                                <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>{fmtProducts(t.products)}</td>
                                <td className="mov-cell-amount" style={{ color: '#2ecc71' }}>{fmtAmt(t.total)}</td>
                                <td className="mov-cell-amount dimmed">—</td>
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

// ─── Pestaña Procesadas ───────────────────────────────────────────────────────
const ProcesadasList = ({ procesadas, onRevert, onToggleOmit, onDelete, loading }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [detalles, setDetalles] = useState(null);
    const sorted = useMemo(() => sortByDate(procesadas), [procesadas]);

    if (loading) return <p className="chart-placeholder">Cargando procesadas...</p>;
    if (!sorted.length) return <p className="chart-placeholder">Sin transacciones procesadas en el período</p>;

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
                                <td className="mov-cell-tag canal-cell">{canalCell(t, false)}</td>
                                <td className={`mov-cell-desc${expanded ? ' expanded' : ''}`}>
                                    {t.description || <span style={{ opacity: 0.35 }}>—</span>}
                                </td>
                                <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                    <DotsMenu options={[
                                        { label: 'Ver detalles', action: () => setDetalles(t) },
                                        {
                                            label: t.omitted ? 'Incluir en estadísticas' : 'Omitir de estadísticas',
                                            action: () => onToggleOmit(t._id, !t.omitted),
                                        },
                                        { label: 'Revertir a pendiente', action: () => onRevert(t._id) },
                                        { label: 'Eliminar', cls: 'danger', action: () => onDelete(t._id) },
                                    ]} />
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

// ─── Componente principal ─────────────────────────────────────────────────────
export const MovimientosCRUD = ({
    pendientes, procesadas,
    onProcess, onAddTransaction, onRejectPending, onDeletePending, onRevert, onToggleOmit, onDelete,
    loadingPendientes, loadingProcesadas,
    openExternal = false, onCloseExternal,
}) => {
    const [tab, setTab] = useState('pendientes');
    const [procesando, setProcesando] = useState(null);
    const [showAgregar, setShowAgregar] = useState(false);

    const finalizadas = useMemo(() => (procesadas || []).filter(isFinalized), [procesadas]);
    const enCamino    = useMemo(() => (procesadas || []).filter(t => !isFinalized(t)), [procesadas]);

    useEffect(() => {
        if (openExternal) setShowAgregar(true);
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
                        {finalizadas.length ? <span className="pending-badge" style={{ background: '#25D366', color: '#080409' }}>{finalizadas.length}</span> : null}
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
                <ProcesadasList procesadas={enCamino} onRevert={onRevert}
                    onToggleOmit={onToggleOmit} onDelete={onDelete} loading={loadingProcesadas} />
            )}
            {tab === 'finalizadas' && (
                <ProcesadasList procesadas={finalizadas} onRevert={onRevert}
                    onToggleOmit={onToggleOmit} onDelete={onDelete} loading={loadingProcesadas} />
            )}

            {procesando && (
                <ProcesarModal tx={procesando} onClose={() => setProcesando(null)} onSave={onProcess} />
            )}
            {showAgregar && (
                <AgregarTransaccionModal
                    onClose={() => { setShowAgregar(false); onCloseExternal?.(); }}
                    onSave={onAddTransaction}
                />
            )}
        </div>
    );
};
