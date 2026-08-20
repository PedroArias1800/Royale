import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const isObjectId = (s) => typeof s === 'string' && /^[0-9a-f]{24}$/i.test(s);

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PA', {
        timeZone: 'America/Panama', day: '2-digit', month: 'short', year: 'numeric',
    });
};
const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const date = d.toLocaleDateString('es-PA', { timeZone: 'America/Panama', day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('es-PA', { timeZone: 'America/Panama', hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date} ${time}`;
};
const fmtAmt = (n) => (n != null && n !== '') ? `$${Number(n).toFixed(2)}` : '—';

const STATUS_MAP = {
    0: { label: 'Cancelada',  color: '#d60a5f' },
    1: { label: 'Pendiente',  color: '#f59e0b' },
    2: { label: 'Completada', color: '#22c55e' },
};
const DELIVERY_MAP = {
    pending:   { label: 'En Camino',        color: '#3b82f6' },
    delivered: { label: 'Entregada',         color: '#22c55e' },
    cancelled: { label: 'Entrega Cancelada', color: '#f97316' },
};

function resolveStatus(tx) {
    if (tx.status === 2 && tx.delivery_status)
        return DELIVERY_MAP[tx.delivery_status] || STATUS_MAP[2];
    return STATUS_MAP[tx.status] || { label: String(tx.status ?? ''), color: '#888' };
}

function parseProducts(tx) {
    const products = tx.products || [];
    const qtys     = tx.quantities || [];
    const prices   = tx.products_prices || [];
    return products.map((p, i) => {
        const raw = typeof p === 'string' ? p : String(p ?? '');
        const displayName = raw.includes('=') ? raw.split('=').slice(1).join('=') : raw;
        const mlMatch = displayName.match(/\b(\d+\s*ml)\b/i);
        const mlStr   = mlMatch ? mlMatch[0] : '';
        const name    = mlStr
            ? displayName.replace(mlStr, '').trim().replace(/\s*[-·\s]+$/, '')
            : displayName;
        const qty   = Number(qtys[i] ?? 1);
        const price = Number(prices[i] ?? 0);
        return { name: name || displayName || '—', ml: mlStr, qty, price, sub: qty * price };
    });
}

function getOpCosts(tx) {
    if (Array.isArray(tx.operational_costs) && tx.operational_costs.length)
        return tx.operational_costs;
    if (tx.operational_cost != null && tx.operational_cost !== 0)
        return [{ type_label: 'Gasto Operacional', responsible_name: '—', amount: tx.operational_cost }];
    return [];
}

function Field({ label, value, span2 }) {
    return (
        <div className={`txd-field${span2 ? ' txd-field-span2' : ''}`}>
            <span className="txd-field-label">{label}</span>
            <span className="txd-field-value">{value || '—'}</span>
        </div>
    );
}

function SectionTitle({ children }) {
    return <div className="mov-form-section-title">{children}</div>;
}

export function TransactionDetailModal({ tx, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!tx) return null;

    const status   = resolveStatus(tx);
    const products = parseProducts(tx);
    const opCosts  = getOpCosts(tx);
    const opTotal  = opCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
    const createdAt = tx.createdAt || tx.created_at;

    const couponText = (() => {
        const c = tx.coupon_id_fk;
        if (!c || c === 'NoAplica') return null;
        if (typeof c === 'object' && c.code) return c.code;
        if (typeof c === 'string') {
            const parts = c.split('-');
            if (parts.length >= 2 && !isNaN(parts[1])) return `${parts[0]} (–${parts[1]}%)`;
            return isObjectId(c) ? null : c;
        }
        return null;
    })();

    const sellerName = (() => {
        const s = tx.seller_id_fk;
        if (s && typeof s === 'object') return `${s.firstname || ''} ${s.lastname || ''}`.trim() || null;
        return tx.seller && tx.seller !== 'Sitio Web' ? tx.seller : null;
    })();

    const providerName = (() => {
        const p = tx.provider_id_fk;
        if (!p) return null;
        if (typeof p === 'object') return p.provider_name || null;
        if (isObjectId(p)) return null;
        return p;
    })();

    const hasProcess = tx.lot_numbers?.length || tx.products_cost != null ||
        providerName || tx.delivery_assigned_name || tx.delivery_date || tx.description;

    const hasDelivery = tx.delivery_status &&
        (tx.delivered_by || tx.delivered_at || tx.delivery_note ||
         tx.delivery_status === 'delivered' || tx.delivery_status === 'cancelled');

    return createPortal(
        <div className="proc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="proc-modal proc-modal-lg txd-modal">

                {/* HEADER */}
                <div className="proc-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        <span className="txd-order-num">{tx.order_number || `#${tx._id?.slice(-6).toUpperCase()}`}</span>
                        <span className="txd-badge" style={{ background: status.color + '22', color: status.color, border: `1px solid ${status.color}55` }}>
                            {status.label}
                        </span>
                        <span className="txd-badge" style={{
                            background: tx.fin_type === 'salida' ? 'rgba(214,10,95,0.15)' : 'rgba(34,197,94,0.12)',
                            color: tx.fin_type === 'salida' ? '#e87fa8' : '#4ade80',
                            border: `1px solid ${tx.fin_type === 'salida' ? '#d60a5f44' : '#22c55e44'}`,
                        }}>
                            {tx.fin_type === 'salida' ? 'Salida' : 'Ingreso'}
                        </span>
                    </div>
                    <button className="proc-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                <div className="txd-meta">
                    {tx.label && <span>{tx.label}</span>}
                    {createdAt && <><span className="txd-meta-dot">·</span><span>{fmtDateTime(createdAt)}</span></>}
                </div>

                {/* ── PASO 1: CREAR ORDEN ── */}
                <SectionTitle>1 — Datos del Pedido</SectionTitle>
                <div className="mov-form-row">
                    <Field label="Cliente"           value={tx.userName} />
                    <Field label="Teléfono"          value={tx.phone} />
                    <Field label="Email"             value={tx.email} />
                </div>
                <div className="mov-form-row">
                    <Field label="Canal"             value={tx.channel} />
                    <Field label="Método de Pago"    value={tx.payment_method} />
                    <Field label="Método de Entrega" value={tx.delivery_method} />
                    {sellerName && <Field label="Vendedor" value={sellerName} />}
                </div>
                {(tx.delivery_label || tx.direction) && (
                    <div className="mov-form-row">
                        {tx.delivery_label && <Field label="Zona de entrega" value={tx.delivery_label} />}
                        {tx.direction      && <Field label="Dirección / Referencia" value={tx.direction} />}
                    </div>
                )}
                {tx.delivery_date && (
                    <div className="mov-form-row">
                        <Field label="Fecha estimada de entrega" value={fmtDate(tx.delivery_date)} />
                        {tx.delivery_express === 'si' && <Field label="Delivery Express" value="Sí" />}
                    </div>
                )}

                {/* Resumen financiero */}
                <div className="mov-form-row">
                    <Field label="Subtotal"      value={fmtAmt(tx.subTotal)} />
                    <Field label="Total"         value={fmtAmt(tx.total)} />
                    {couponText && <Field label="Cupón aplicado" value={couponText} />}
                </div>

                {/* Gastos Operacionales */}
                {opCosts.length > 0 && (
                    <>
                        <SectionTitle>Gastos Operacionales</SectionTitle>
                        {opCosts.map((c, i) => (
                            <div key={i} className="txd-op-row">
                                <span className="txd-op-type">{c.type_label || c.type_key || 'Gasto'}</span>
                                <span className="txd-op-resp">{c.responsible_name || '—'}</span>
                                <span className="txd-op-amt">{fmtAmt(c.amount)}</span>
                            </div>
                        ))}
                        {opCosts.length > 1 && (
                            <div className="txd-op-subtotal">
                                <span>Total gastos operacionales</span>
                                <span>{fmtAmt(opTotal)}</span>
                            </div>
                        )}
                    </>
                )}

                {/* Productos */}
                {products.length > 0 && (
                    <>
                        <SectionTitle>Productos</SectionTitle>
                        <div className="txd-products-wrap">
                            <table className="txd-products-table">
                                <thead>
                                    <tr>
                                        <th>Perfume</th>
                                        <th className="txd-tc">ml</th>
                                        <th className="txd-tc">Cant.</th>
                                        <th className="txd-tr">Precio</th>
                                        <th className="txd-tr">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.name}</td>
                                            <td className="txd-tc">{p.ml || '—'}</td>
                                            <td className="txd-tc">{p.qty}</td>
                                            <td className="txd-tr">{fmtAmt(p.price)}</td>
                                            <td className="txd-tr txd-gold">{fmtAmt(p.sub)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── PASO 2: PROCESAR ── */}
                {hasProcess && (
                    <>
                        <SectionTitle>2 — Proceso</SectionTitle>
                        <div className="mov-form-row">
                            {tx.products_cost != null && <Field label="Costo de Productos" value={fmtAmt(tx.products_cost)} />}
                            {providerName          && <Field label="Proveedor"             value={providerName} />}
                            {tx.delivery_assigned_name && <Field label="Delivery asignado" value={tx.delivery_assigned_name} />}
                        </div>
                        {tx.lot_numbers?.length > 0 && (
                            <div className="mov-form-row">
                                <Field label="Números de Lote" value={tx.lot_numbers.join(', ')} span2 />
                            </div>
                        )}
                        {tx.description && (
                            <div className="mov-form-row">
                                <Field label="Notas" value={tx.description} span2 />
                            </div>
                        )}
                    </>
                )}

                {/* ── PASO 3: ENTREGA ── */}
                {hasDelivery && (
                    <>
                        <SectionTitle>3 — Entrega</SectionTitle>
                        <div className="mov-form-row">
                            <Field label="Estado"         value={DELIVERY_MAP[tx.delivery_status]?.label || tx.delivery_status} />
                            {tx.delivered_by  && <Field label="Entregado por"   value={tx.delivered_by} />}
                            {tx.delivered_at  && <Field label="Fecha de entrega" value={fmtDateTime(tx.delivered_at)} />}
                        </div>
                        {tx.delivery_note && (
                            <div className="mov-form-row">
                                <Field label="Nota de entrega" value={tx.delivery_note} span2 />
                            </div>
                        )}
                    </>
                )}

                {/* FOOTER */}
                <div className="txd-footer">
                    <span className="txd-footer-id">ID: {tx._id}</span>
                    <button className="proc-close txd-btn-cerrar" onClick={onClose}>Cerrar</button>
                </div>

            </div>
        </div>,
        document.body
    );
}
