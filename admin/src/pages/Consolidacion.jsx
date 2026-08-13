import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import {
    getConsolidacionRequest,
    getConsolidacionRangeRequest,
    putDeliveryStatusRequest,
    postClientDeliveryEmail,
} from '../api/Consolidacion.api.js';

const STATUS = {
    pending:   { label: 'Pendiente',  color: '#fdd05e', bg: 'rgba(253,208,94,0.07)',  border: 'rgba(253,208,94,0.18)' },
    delivered: { label: 'Entregado',  color: '#25D366', bg: 'rgba(37,211,102,0.07)',  border: 'rgba(37,211,102,0.18)' },
    cancelled: { label: 'Cancelado',  color: '#d60a5f', bg: 'rgba(214,10,95,0.07)',   border: 'rgba(214,10,95,0.18)'  },
};

const todayPanama = () =>
    new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Panama' });

const fmtDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString('es-PA', {
        timeZone: 'America/Panama', hour12: false,
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }) : '';

// ── Sub-componente: tarjeta de pedido ────────────────────────────────────────
const OrderCard = ({ order, isAdmin, onStatusUpdate }) => {
    const status   = order.delivery_status || 'pending';
    const si       = STATUS[status] || STATUS.pending;
    const isDone   = status === 'delivered' || status === 'cancelled';
    const editable = isAdmin || status === 'pending';

    const [proc, setProc]   = useState(null); // null | { step:'form'|'confirm', status:'', note:'' }
    const [busy, setBusy]   = useState(false);

    const statusOptions = [];
    if (isAdmin && status !== 'pending')   statusOptions.push({ val: 'pending',   label: 'Pendiente'  });
    if (status !== 'delivered')             statusOptions.push({ val: 'delivered', label: 'Entregado'  });
    if (status !== 'cancelled')             statusOptions.push({ val: 'cancelled', label: 'Cancelado'  });

    const goConfirm = () => {
        if (!proc?.status) return;
        if (proc.status === 'cancelled' && !proc.note?.trim()) {
            alert('La nota / motivo es obligatoria al cancelar un pedido.');
            return;
        }
        setProc(p => ({ ...p, step: 'confirm' }));
    };

    const confirmUpdate = async () => {
        setBusy(true);
        try {
            await putDeliveryStatusRequest(order._id, proc.status, order.delivery_assigned_name || '', proc.note || '');
            if (proc.status === 'delivered' && order.email) {
                postClientDeliveryEmail({
                    to_email: order.email, to_name: order.userName,
                    order_number: order.order_number || order._id.slice(-8).toUpperCase(),
                    delivered_by: order.delivery_assigned_name || '',
                    delivery_note: proc.note || '',
                });
            }
            onStatusUpdate(order._id, proc.status, proc.note);
            setProc(null);
        } catch {
            alert('Error al actualizar el estado.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <article style={{
            background: '#0e0b0d',
            border: `1px solid ${si.border}`,
            borderRadius: '3px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{ height: '3px', background: si.color, opacity: 0.85 }} />

            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Top: number + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fdd05e', fontFamily: '"Cinzel", monospace', fontSize: '0.90rem', letterSpacing: '0.08em', fontWeight: 700 }}>
                        {order.order_number || '—'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {order.express_delivery && (
                            <span style={{ background: '#d60a5f', color: '#fff', fontSize: '0.60rem', padding: '2px 6px', borderRadius: '2px', letterSpacing: '0.1em', fontWeight: 700 }}>
                                🚀 EXPRESS
                            </span>
                        )}
                        <span style={{
                            background: si.bg, color: si.color, border: `1px solid ${si.border}`,
                            fontSize: '0.65rem', padding: '2px 9px', borderRadius: '2px',
                            letterSpacing: '0.1em', fontWeight: 700,
                        }}>
                            {si.label.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Customer */}
                <div>
                    <p style={{ margin: '0 0 3px', color: '#ede8eb', fontWeight: 600, fontSize: '0.95rem' }}>
                        {order.userName}
                    </p>
                    <p style={{ margin: '0 0 2px', color: 'rgba(237,232,235,0.42)', fontSize: '0.76rem' }}>
                        +507 {order.phone}{order.email ? ` · ${order.email}` : ''}
                    </p>
                    {order.direction && (
                        <p style={{ margin: 0, color: 'rgba(237,232,235,0.38)', fontSize: '0.76rem' }}>
                            📍 {order.delivery_label || order.direction}
                        </p>
                    )}
                </div>

                {/* Products */}
                {order.products_resolved?.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(253,208,94,0.07)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.products_resolved.map((p, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                                <span style={{ color: '#fdd05e', fontSize: '0.72rem', fontWeight: 700, minWidth: '22px' }}>
                                    ×{order.quantities?.[i] || 1}
                                </span>
                                <span style={{ color: 'rgba(237,232,235,0.78)', fontSize: '0.80rem', lineHeight: 1.35 }}>
                                    {p}
                                    {order.types_resolved?.[i] ? (
                                        <span style={{ color: 'rgba(237,232,235,0.38)', marginLeft: '5px', fontSize: '0.72rem' }}>
                                            {order.types_resolved[i]}ml
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Encargado (admin only) — etiqueta con buen contraste */}
                {isAdmin && order.delivery_assigned_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            fontSize: '0.60rem', color: 'rgba(237,232,235,0.45)',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '1px 6px', borderRadius: '2px',
                        }}>
                            Encargado
                        </span>
                        <span style={{ color: '#fdd05e', fontSize: '0.78rem', fontWeight: 600 }}>
                            {order.delivery_assigned_name}
                        </span>
                    </div>
                )}

                {/* Terminal status info */}
                {isDone && (
                    <div style={{
                        background: si.bg, border: `1px solid ${si.border}`,
                        borderRadius: '2px', padding: '7px 10px', fontSize: '0.73rem', color: 'rgba(237,232,235,0.5)',
                    }}>
                        {order.delivered_at && <p style={{ margin: '0 0 2px' }}>🕐 {fmtDateTime(order.delivered_at)}</p>}
                        {order.delivered_by && <p style={{ margin: '0 0 2px' }}>Por: <strong style={{ color: '#ede8eb' }}>{order.delivered_by}</strong></p>}
                        {order.delivery_note && <p style={{ margin: 0 }}>Nota: {order.delivery_note}</p>}
                    </div>
                )}
            </div>

            {/* Footer: total + action */}
            <div style={{
                padding: '12px 18px', borderTop: '1px solid rgba(253,208,94,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                background: 'rgba(0,0,0,0.15)',
            }}>
                <div>
                    <p style={{ margin: 0, color: '#fdd05e', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                        ${Number(order.total || 0).toFixed(2)}
                    </p>
                    {order.payment_method && (
                        <p style={{ margin: '2px 0 0', color: 'rgba(237,232,235,0.3)', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                            {order.payment_method}
                        </p>
                    )}
                </div>
                {!proc && editable && (
                    <button
                        onClick={() => setProc({ step: 'form', status: '', note: '' })}
                        style={{
                            padding: '7px 20px', background: 'transparent',
                            border: '1px solid rgba(253,208,94,0.35)', color: '#fdd05e',
                            borderRadius: '2px', cursor: 'pointer',
                            fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 700,
                        }}
                    >PROCESAR</button>
                )}
                {!proc && !editable && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(237,232,235,0.22)', letterSpacing: '0.06em' }}>
                        Solo admin puede cambiar
                    </span>
                )}
            </div>

            {/* Inline form */}
            {proc?.step === 'form' && (
                <div style={{
                    padding: '14px 18px', borderTop: `1px solid ${si.border}`,
                    background: 'rgba(253,208,94,0.025)',
                    display: 'flex', flexDirection: 'column', gap: '9px',
                }}>
                    <select
                        value={proc.status}
                        onChange={e => setProc(p => ({ ...p, status: e.target.value }))}
                        style={{
                            background: '#130c11', border: '1px solid rgba(253,208,94,0.22)',
                            color: '#ede8eb', padding: '8px 10px',
                            borderRadius: '2px', fontSize: '0.80rem', outline: 'none', width: '100%',
                        }}
                    >
                        <option value="" disabled style={{ color: 'rgba(237,232,235,0.4)' }}>Seleccionar nuevo estado…</option>
                        {statusOptions.map(o => (
                            <option key={o.val} value={o.val} style={{ color: STATUS[o.val]?.color || '#ede8eb' }}>{o.label}</option>
                        ))}
                    </select>
                    {proc.status && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 10px', borderRadius: '2px',
                            background: STATUS[proc.status]?.bg,
                            border: `1px solid ${STATUS[proc.status]?.border}`,
                        }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS[proc.status]?.color, flexShrink: 0 }} />
                            <span style={{ color: STATUS[proc.status]?.color, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
                                {STATUS[proc.status]?.label.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder={proc.status === 'cancelled' ? 'Motivo de cancelación (obligatorio)' : 'Nota de entrega (opcional)'}
                        value={proc.note}
                        onChange={e => setProc(p => ({ ...p, note: e.target.value }))}
                        style={{
                            background: '#130c11',
                            border: `1px solid ${
                                proc.status === 'cancelled' && !proc.note?.trim() ? 'rgba(214,10,95,0.5)'
                                : proc.status === 'delivered' ? 'rgba(37,211,102,0.3)'
                                : 'rgba(253,208,94,0.18)'
                            }`,
                            color: '#ede8eb', padding: '8px 10px',
                            borderRadius: '2px', fontSize: '0.78rem', outline: 'none',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={goConfirm} disabled={!proc.status}
                            style={{
                                flex: 1, padding: '8px',
                                background: proc.status ? 'rgba(253,208,94,0.10)' : 'transparent',
                                border: `1px solid ${proc.status ? '#fdd05e' : 'rgba(253,208,94,0.18)'}`,
                                color: proc.status ? '#fdd05e' : 'rgba(253,208,94,0.3)',
                                borderRadius: '2px', cursor: proc.status ? 'pointer' : 'not-allowed',
                                fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 700,
                            }}
                        >CONTINUAR →</button>
                        <button
                            onClick={() => setProc(null)}
                            style={{
                                padding: '8px 14px', background: 'transparent',
                                border: '1px solid rgba(237,232,235,0.12)',
                                color: 'rgba(237,232,235,0.35)',
                                borderRadius: '2px', cursor: 'pointer', fontSize: '0.72rem',
                            }}
                        >✕</button>
                    </div>
                </div>
            )}

            {/* Confirm step */}
            {proc?.step === 'confirm' && (
                <div style={{
                    padding: '14px 18px', borderTop: '1px solid rgba(214,10,95,0.25)',
                    background: 'rgba(214,10,95,0.04)',
                    display: 'flex', flexDirection: 'column', gap: '9px',
                }}>
                    <p style={{ margin: 0, color: '#ede8eb', fontSize: '0.82rem', fontWeight: 600 }}>
                        ¿Confirmar cambio a{' '}
                        <span style={{ color: STATUS[proc.status]?.color }}>{STATUS[proc.status]?.label}</span>?
                    </p>
                    <p style={{ margin: 0, color: 'rgba(237,232,235,0.38)', fontSize: '0.72rem' }}>
                        Esta acción no podrá revertirse sin permisos de administrador.
                    </p>
                    {proc.note && <p style={{ margin: 0, color: 'rgba(237,232,235,0.5)', fontSize: '0.73rem' }}>Nota: {proc.note}</p>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={confirmUpdate} disabled={busy}
                            style={{
                                flex: 1, padding: '8px',
                                background: 'rgba(214,10,95,0.15)',
                                border: '1px solid #d60a5f', color: '#d60a5f',
                                borderRadius: '2px', cursor: busy ? 'wait' : 'pointer',
                                fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 700,
                            }}
                        >{busy ? 'GUARDANDO…' : 'SÍ, CONFIRMAR'}</button>
                        <button
                            onClick={() => setProc(p => ({ ...p, step: 'form' }))} disabled={busy}
                            style={{
                                padding: '8px 18px', background: 'rgba(237,232,235,0.07)',
                                border: '1px solid rgba(237,232,235,0.28)', color: '#ede8eb',
                                borderRadius: '2px', cursor: 'pointer',
                                fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 600,
                            }}
                        >← VOLVER</button>
                    </div>
                </div>
            )}
        </article>
    );
};

// ── Sección de historial por rango (admin) ───────────────────────────────────
const RangeSection = ({ isAdmin }) => {
    if (!isAdmin) return null;

    const today = todayPanama();
    const [from, setFrom]         = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toLocaleDateString('sv-SE', { timeZone: 'America/Panama' });
    });
    const [to, setTo]             = useState(today);
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [queried, setQueried]   = useState(false);
    const [openGroups, setOpenGroups] = useState({ pending: true, delivered: true, cancelled: true });
    const [filterStatus, setFilterStatus] = useState(''); // '' = todos
    const [searchOrder, setSearchOrder]   = useState('');

    const doFetch = async () => {
        setLoading(true);
        try {
            const res = await getConsolidacionRangeRequest(from, to);
            setOrders(res.data.orders || []);
            setQueried(true);
            setFilterStatus('');
            setSearchOrder('');
        } catch {
            alert('Error al cargar el historial.');
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (key) => setOpenGroups(g => ({ ...g, [key]: !g[key] }));

    const handleStatusUpdate = (id, newStatus, note) => {
        setOrders(prev => prev.map(o =>
            o._id === id ? { ...o, delivery_status: newStatus, delivery_note: note, delivered_at: new Date().toISOString() } : o
        ));
    };

    // Aplicar filtros cliente
    const visibleOrders = orders.filter(o => {
        if (filterStatus && (o.delivery_status || 'pending') !== filterStatus) return false;
        if (searchOrder.trim()) {
            const q = searchOrder.trim().toLowerCase();
            const num = (o.order_number || '').toLowerCase();
            if (!num.includes(q)) return false;
        }
        return true;
    });

    const groups = {
        pending:   visibleOrders.filter(o => (o.delivery_status || 'pending') === 'pending'),
        delivered: visibleOrders.filter(o => o.delivery_status === 'delivered'),
        cancelled: visibleOrders.filter(o => o.delivery_status === 'cancelled'),
    };

    const inputStyle = {
        background: '#1c1119', border: '1px solid rgba(253,208,94,0.22)',
        color: '#ede8eb', padding: '6px 12px', borderRadius: '2px',
        fontSize: '0.82rem', outline: 'none',
    };

    return (
        <div style={{ marginTop: '32px', borderTop: '1px solid rgba(253,208,94,0.12)', paddingTop: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#ede8eb', fontWeight: 700, letterSpacing: '0.04em' }}>
                Historial por Período
            </h2>

            {/* Fila 1: Fechas + Consultar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: 'rgba(237,232,235,0.45)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Desde</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: 'rgba(237,232,235,0.45)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hasta</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={doFetch} disabled={loading}
                    style={{
                        padding: '6px 20px', background: 'rgba(253,208,94,0.07)',
                        border: '1px solid rgba(253,208,94,0.28)', color: '#fdd05e',
                        borderRadius: '2px', cursor: 'pointer',
                        fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 600,
                    }}>
                    {loading ? 'CARGANDO…' : 'CONSULTAR'}
                </button>
                {queried && (
                    <span style={{ color: 'rgba(237,232,235,0.35)', fontSize: '0.72rem' }}>
                        {visibleOrders.length} de {orders.length} pedido{orders.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Fila 2: Filtros — siempre visibles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ ...inputStyle, minWidth: '140px' }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Buscar N° de pedido…"
                        value={searchOrder}
                        onChange={e => setSearchOrder(e.target.value)}
                        style={{ ...inputStyle, minWidth: '200px' }}
                    />
                    {(filterStatus || searchOrder) && (
                        <button
                            onClick={() => { setFilterStatus(''); setSearchOrder(''); }}
                            style={{
                                padding: '5px 12px', background: 'transparent',
                                border: '1px solid rgba(237,232,235,0.15)',
                                color: 'rgba(237,232,235,0.45)',
                                borderRadius: '2px', cursor: 'pointer', fontSize: '0.70rem',
                            }}
                        >✕ Limpiar filtros</button>
                    )}
            </div>

            {/* Grupos de resultados */}
            {queried && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(groups).map(([key, grp]) => {
                        // Si hay filtro de status activo y no coincide con este grupo, ocultarlo
                        if (filterStatus && filterStatus !== key) return null;
                        const si = STATUS[key];
                        return (
                            <div key={key} style={{ border: `1px solid ${si.border}`, borderRadius: '3px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => toggleGroup(key)}
                                    style={{
                                        width: '100%', padding: '10px 16px',
                                        background: si.bg, border: 'none',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: si.color, flexShrink: 0 }} />
                                        <span style={{ color: si.color, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                                            {si.label.toUpperCase()}
                                        </span>
                                        <span style={{
                                            background: si.color, color: '#080409',
                                            fontSize: '0.68rem', fontWeight: 700,
                                            padding: '1px 8px', borderRadius: '10px',
                                        }}>{grp.length}</span>
                                    </div>
                                    <span style={{ color: si.color, fontSize: '0.72rem' }}>
                                        {openGroups[key] ? '▲' : '▼'}
                                    </span>
                                </button>

                                {openGroups[key] && grp.length > 0 && (
                                    <div style={{
                                        padding: '12px', background: '#0e0b0d',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))',
                                        gap: '10px',
                                    }}>
                                        {grp.map(order => (
                                            <OrderCard
                                                key={order._id}
                                                order={order}
                                                isAdmin={isAdmin}
                                                onStatusUpdate={handleStatusUpdate}
                                            />
                                        ))}
                                    </div>
                                )}
                                {openGroups[key] && grp.length === 0 && (
                                    <p style={{ padding: '16px', color: 'rgba(237,232,235,0.3)', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>
                                        Sin pedidos{searchOrder ? ` con N° "${searchOrder}"` : ''} en este período
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Página principal ─────────────────────────────────────────────────────────
export const Consolidacion = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [date, setDate]         = useState(todayPanama());
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [filterUser, setFilterUser] = useState(''); // admin: filter by assignee

    const isAdmin = user?.rol == 1 || user?.roles?.includes(1);

    const loadOrders = async (d) => {
        setLoading(true); setError('');
        try {
            const res = await getConsolidacionRequest(d);
            setOrders(res.data.orders || []);
        } catch {
            setError('Error al cargar los pedidos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrders(date); }, [date]);

    // Unique assignees from current orders (for admin filter)
    const assignees = useMemo(() => {
        const seen = new Map();
        for (const o of orders) {
            if (o.delivery_assigned_to && o.delivery_assigned_name && !seen.has(o.delivery_assigned_to)) {
                seen.set(o.delivery_assigned_to, o.delivery_assigned_name);
            }
        }
        return [...seen.entries()].map(([id, name]) => ({ id, name }));
    }, [orders]);

    // Apply client-side user filter
    const filteredOrders = filterUser
        ? orders.filter(o => o.delivery_assigned_to === filterUser)
        : orders;

    const handleStatusUpdate = (id, newStatus, note) => {
        setOrders(prev => prev.map(o =>
            o._id === id
                ? { ...o, delivery_status: newStatus, delivery_note: note, delivered_at: new Date().toISOString() }
                : o
        ));
    };

    const nPending   = filteredOrders.filter(o => (o.delivery_status || 'pending') === 'pending').length;
    const nDelivered = filteredOrders.filter(o => o.delivery_status === 'delivered').length;
    const nCancelled = filteredOrders.filter(o => o.delivery_status === 'cancelled').length;
    const total      = filteredOrders.length;

    return (
        <div className='dataContent'>
            <div className='pageHeader'>
                <div className='pageHeader1'>
                    <div className='volverAnadir'>
                        <button className='btn-volver' onClick={() => navigate('/admin')}>← Volver</button>
                    </div>
                </div>
                <div className='pageHeader-title-row'>
                    <h1>Consolidación de Pedidos</h1>
                    <span className='pageHeader-count'>
                        {total} pedido{total !== 1 ? 's' : ''}
                        {nPending   > 0 && ` · ${nPending} pendiente${nPending !== 1 ? 's' : ''}`}
                        {nDelivered > 0 && ` · ${nDelivered} entregado${nDelivered !== 1 ? 's' : ''}`}
                        {nCancelled > 0 && ` · ${nCancelled} cancelado${nCancelled !== 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            {/* Controls bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                {/* Date picker */}
                <label style={{ color: 'rgba(237,232,235,0.45)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fecha</label>
                <input
                    type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ background: '#1c1119', border: '1px solid rgba(253,208,94,0.22)', color: '#ede8eb', padding: '6px 12px', borderRadius: '2px', fontSize: '0.85rem', outline: 'none' }}
                />
                <button onClick={() => loadOrders(date)}
                    style={{
                        padding: '6px 16px', background: 'rgba(253,208,94,0.07)',
                        border: '1px solid rgba(253,208,94,0.28)', color: '#fdd05e',
                        borderRadius: '2px', cursor: 'pointer',
                        fontSize: '0.72rem', letterSpacing: '0.1em', fontWeight: 600,
                    }}>ACTUALIZAR</button>

                {/* Admin: filter by assignee */}
                {isAdmin && assignees.length > 0 && (
                    <>
                        <span style={{ color: 'rgba(237,232,235,0.2)', margin: '0 4px' }}>|</span>
                        <label style={{ color: 'rgba(237,232,235,0.45)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Encargado</label>
                        <select
                            value={filterUser}
                            onChange={e => setFilterUser(e.target.value)}
                            style={{
                                background: '#1c1119', border: '1px solid rgba(253,208,94,0.22)',
                                color: '#ede8eb', padding: '6px 10px', borderRadius: '2px',
                                fontSize: '0.80rem', outline: 'none',
                            }}
                        >
                            <option value="">Todos</option>
                            {assignees.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        {filterUser && (
                            <button onClick={() => setFilterUser('')}
                                style={{
                                    padding: '4px 10px', background: 'transparent',
                                    border: '1px solid rgba(237,232,235,0.15)',
                                    color: 'rgba(237,232,235,0.45)',
                                    borderRadius: '2px', cursor: 'pointer', fontSize: '0.70rem',
                                }}>✕ Limpiar</button>
                        )}
                    </>
                )}
            </div>

            {loading && (
                <p style={{ color: 'rgba(237,232,235,0.35)', textAlign: 'center', padding: '60px', letterSpacing: '0.12em', fontSize: '0.78rem' }}>
                    CARGANDO…
                </p>
            )}
            {error && <p style={{ color: '#d60a5f', textAlign: 'center' }}>{error}</p>}
            {!loading && !error && filteredOrders.length === 0 && (
                <div className='sinDatosParaMostrar'>
                    <h1>No hay pedidos para esta fecha</h1>
                </div>
            )}

            {/* Daily order grid */}
            {!loading && filteredOrders.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(420px, 100%), 1fr))',
                    gap: '14px', alignItems: 'start', width: '100%',
                }}>
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            isAdmin={isAdmin}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}

            {/* Admin-only: historial por rango */}
            <RangeSection isAdmin={isAdmin} />
        </div>
    );
};
