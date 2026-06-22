import { useState } from 'react';

const LABELS = {
    ingreso: ['Venta Directa', 'Abono', 'Devolución recibida', 'Otro ingreso'],
    salida: ['Costo del Producto', 'Gastos Operativos', 'Merma', 'Publicidad y Marketing', 'Envíos y Logística', 'Devolución emitida', 'Otro gasto'],
};

const EMPTY_MANUAL = {
    fin_type: 'ingreso',
    label: LABELS.ingreso[0],
    userName: '',
    phone: '',
    direction: '',
    email: '',
    payment_method: '',
    delivery_method: '',
    channel: '',
    total: '',
    subTotal: '',
    description: '',
};

const EMPTY_PRODUCT = { name: '', qty: 1 };

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-PA') : '—';
const fmtAmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const fmtProducts = (products) =>
    (products || []).map(p => p.split('=')[1] || p).filter(Boolean).join(', ') || '—';

// ─── Cabecera de tabla unificada ──────────────────────────────────────────────
const THead = () => (
    <thead>
        <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Etiqueta</th>
            <th>Pago</th>
            <th>Entrega</th>
            <th>Canal</th>
            <th>Descripción</th>
            <th></th>
        </tr>
    </thead>
);

// ─── Badge de tipo ────────────────────────────────────────────────────────────
const TipoBadge = ({ type }) => {
    const map = {
        pendiente:  { label: 'Venta',     cls: 'tipo-venta' },
        procesada:  { label: 'Procesada', cls: 'tipo-procesada' },
        ingreso:    { label: 'Ingreso',   cls: 'ingreso' },
        salida:     { label: 'Salida',    cls: 'salida' },
    };
    const { label, cls } = map[type] || { label: type, cls: '' };
    return <span className={`mov-badge ${cls}`}>{label}</span>;
};

// ─── Celda descripción con ellipsis + expand al hacer clic en la fila ─────────
const DescCell = ({ text, expanded }) => (
    <td className={`mov-cell-desc${expanded ? ' expanded' : ''}`}>
        {text || <span style={{ opacity: 0.35 }}>—</span>}
    </td>
);

// ─── Pestaña Pendientes ───────────────────────────────────────────────────────
const PendientesList = ({ pendientes, onProcess, loading }) => {
    const [expandedId, setExpandedId] = useState(null);

    if (loading) return <p className="chart-placeholder">Cargando pendientes...</p>;
    if (!pendientes?.length) return <p className="chart-placeholder">Sin transacciones pendientes — todas están al día</p>;

    return (
        <div className="mov-table-wrap">
            <table className="mov-table">
                <THead />
                <tbody>
                    {pendientes.map((t) => {
                        const expanded = expandedId === t._id;
                        return (
                            <tr
                                key={t._id}
                                className="mov-row-clickable"
                                onClick={() => setExpandedId(expanded ? null : t._id)}
                            >
                                <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                <td><TipoBadge type="pendiente" /></td>
                                <td className="mov-cell-client">
                                    <span>{t.userName}</span>
                                    {t.phone && <span className="mov-sub"> {t.phone}</span>}
                                </td>
                                <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>{fmtProducts(t.products)}</td>
                                <td className="mov-cell-amount green">{fmtAmt(t.total)}</td>
                                <td className="mov-cell-tag">{t.label || '—'}</td>
                                <td className="mov-cell-tag">{t.payment_method || '—'}</td>
                                <td className="mov-cell-tag">{t.delivery_method || '—'}</td>
                                <td className="mov-cell-tag">{t.channel || '—'}</td>
                                <DescCell text={t.description} expanded={expanded} />
                                <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => onProcess(t)}
                                        type="button"
                                        className="btn-procesar"
                                    >
                                        Procesar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─── Modal de procesado ───────────────────────────────────────────────────────
const ProcesarModal = ({ tx, onClose, onSave }) => {
    const [form, setForm] = useState({
        payment_method: tx.payment_method || '',
        delivery_method: tx.delivery_method || '',
        channel: tx.channel || '',
        label: tx.label || LABELS.ingreso[0],
        description: tx.description || '',
        status: 2,
    });

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(tx._id, form);
        onClose();
    };

    return (
        <div className="proc-overlay">
            <div className="proc-modal">
                <div className="proc-header">
                    <h3>Procesar Transacción</h3>
                    <button onClick={onClose} className="proc-close">✕</button>
                </div>
                <div className="proc-info">
                    <p><strong>{tx.userName}</strong> — {fmtAmt(tx.total)}</p>
                    <p className="mov-desc">{fmtDate(tx.createdAt)}</p>
                </div>
                <form onSubmit={handleSubmit} className="mov-form">
                    <div className="mov-form-row">
                        <label>
                            Método de Pago
                            <select name="payment_method" value={form.payment_method} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option>Efectivo</option>
                                <option>Transferencia</option>
                                <option>Yappy</option>
                                <option>Tarjeta</option>
                                <option>Otro</option>
                            </select>
                        </label>
                        <label>
                            Método de Entrega
                            <select name="delivery_method" value={form.delivery_method} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option>Pickup</option>
                                <option value="Delivery propio">Delivery propio</option>
                                <option value="Mensajería">Mensajería</option>
                                <option>Digital</option>
                            </select>
                        </label>
                        <label>
                            Canal de Acceso
                            <select name="channel" value={form.channel} onChange={handleChange} required>
                                <option value="">Selecciona</option>
                                <option value="Sitio Web">Sitio Web</option>
                                <option>WhatsApp</option>
                                <option>Instagram</option>
                                <option>Vendedor</option>
                                <option>Otro</option>
                            </select>
                        </label>
                        <label>
                            Etiqueta
                            <select name="label" value={form.label} onChange={handleChange}>
                                {LABELS.ingreso.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </label>
                    </div>
                    <label>
                        Notas (opcional)
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

// ─── Pestaña Procesadas ───────────────────────────────────────────────────────
const ProcesadasList = ({ procesadas, onRevert, onToggleOmit, loading }) => {
    const [expandedId, setExpandedId] = useState(null);

    if (loading) return <p className="chart-placeholder">Cargando procesadas...</p>;
    if (!procesadas?.length) return <p className="chart-placeholder">Sin transacciones procesadas en el período</p>;

    return (
        <div className="mov-table-wrap">
            <table className="mov-table">
                <THead />
                <tbody>
                    {procesadas.map((t) => {
                        const expanded = expandedId === t._id;
                        return (
                            <tr
                                key={t._id}
                                className="mov-row-clickable"
                                style={t.omitted ? { opacity: 0.45 } : {}}
                                onClick={() => setExpandedId(expanded ? null : t._id)}
                            >
                                <td className="mov-cell-date">{fmtDate(t.createdAt)}</td>
                                <td><TipoBadge type="procesada" /></td>
                                <td className="mov-cell-client">
                                    <span>{t.userName}</span>
                                    {t.phone && <span className="mov-sub"> {t.phone}</span>}
                                </td>
                                <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>{fmtProducts(t.products)}</td>
                                <td
                                    className="mov-cell-amount"
                                    style={{
                                        color: t.omitted ? '#888' : '#2ecc71',
                                        textDecoration: t.omitted ? 'line-through' : 'none',
                                    }}
                                >
                                    {fmtAmt(t.total)}
                                </td>
                                <td className="mov-cell-tag">{t.label || '—'}</td>
                                <td className="mov-cell-tag">{t.payment_method || '—'}</td>
                                <td className="mov-cell-tag">{t.delivery_method || '—'}</td>
                                <td className="mov-cell-tag">{t.channel || '—'}</td>
                                <DescCell text={t.description} expanded={expanded} />
                                <td className="mov-actions proc-actions" onClick={e => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className={`btn-omitir${t.omitted ? ' omitida' : ''}`}
                                        onClick={() => onToggleOmit(t._id, !t.omitted)}
                                        title={t.omitted ? 'Incluir en estadísticas' : 'Omitir de estadísticas'}
                                    >
                                        {t.omitted ? 'Incluir' : 'Omitir'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-revertir"
                                        onClick={() => onRevert(t._id)}
                                        title="Revertir a pendiente"
                                    >
                                        Revertir
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ─── Pestaña Manuales ─────────────────────────────────────────────────────────
const ManualesList = ({ manuales, onSaveManual, onDeleteManual, loading }) => {
    const [form, setForm] = useState(EMPTY_MANUAL);
    const [products, setProducts] = useState([{ ...EMPTY_PRODUCT }]);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'fin_type') updated.label = LABELS[value][0];
            return updated;
        });
    };

    const handleProductChange = (idx, field, value) =>
        setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

    const addProduct = () => setProducts(prev => [...prev, { ...EMPTY_PRODUCT }]);
    const removeProduct = (idx) => setProducts(prev => prev.filter((_, i) => i !== idx));

    const resetForm = () => {
        setForm(EMPTY_MANUAL);
        setProducts([{ ...EMPTY_PRODUCT }]);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validProducts = products.filter(p => p.name.trim());
        await onSaveManual({
            fin_type: form.fin_type,
            label: form.label,
            total: parseFloat(form.total),
            subTotal: parseFloat(form.subTotal) || parseFloat(form.total) || 0,
            description: form.description,
            userName: form.userName,
            phone: form.phone,
            direction: form.direction,
            email: form.email,
            payment_method: form.payment_method,
            delivery_method: form.delivery_method,
            channel: form.channel,
            products: validProducts.map(p => p.name.trim()),
            quantities: validProducts.map(p => parseInt(p.qty) || 1),
        });
        resetForm();
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este registro manual?')) return;
        await onDeleteManual(id);
    };

    return (
        <div>
            <div className="mov-header" style={{ marginBottom: 12 }}>
                <span className="mov-desc" style={{ fontSize: '0.82rem' }}>
                    Ventas, gastos y ajustes registrados manualmente por el admin
                </span>
                <button className="btn-new-mov" onClick={() => setShowForm(v => !v)} type="button">
                    {showForm ? '— Cerrar' : '+ Nueva entrada'}
                </button>
            </div>

            {showForm && (
                <form className="mov-form manual-full-form" onSubmit={handleSubmit}>
                    <div className="mov-form-section-title">Tipo de Movimiento</div>
                    <div className="mov-form-row">
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
                                <option value="Sitio Web">Sitio Web</option>
                                <option>WhatsApp</option>
                                <option>Instagram</option>
                                <option>Vendedor</option>
                                <option>Presencial</option>
                                <option>Otro</option>
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
                        <label>Dirección / Zona
                            <input type="text" name="direction" value={form.direction} onChange={handleChange} placeholder="Zona, corregimiento..." />
                        </label>
                    </div>

                    <div className="mov-form-section-title">
                        Productos
                        <button type="button" className="btn-add-product" onClick={addProduct}>+ Agregar</button>
                    </div>
                    {products.map((p, idx) => (
                        <div key={idx} className="mov-product-row">
                            <input
                                type="text"
                                value={p.name}
                                onChange={e => handleProductChange(idx, 'name', e.target.value)}
                                placeholder={`Producto ${idx + 1} (ej: Dior Sauvage 100ml)`}
                                className="mov-product-name"
                            />
                            <input
                                type="number"
                                min="1"
                                value={p.qty}
                                onChange={e => handleProductChange(idx, 'qty', e.target.value)}
                                className="mov-product-qty"
                                title="Cantidad"
                            />
                            {products.length > 1 && (
                                <button type="button" className="btn-remove-product" onClick={() => removeProduct(idx)} title="Eliminar">✕</button>
                            )}
                        </div>
                    ))}

                    <div className="mov-form-section-title">Pago y Totales</div>
                    <div className="mov-form-row">
                        <label>Método de Pago
                            <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                                <option value="">Sin especificar</option>
                                <option>Efectivo</option>
                                <option>Transferencia</option>
                                <option>Yappy</option>
                                <option>Tarjeta</option>
                                <option>Otro</option>
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
                        <label>Subtotal ($)
                            <input type="number" name="subTotal" min="0" step="0.01" value={form.subTotal} onChange={handleChange} placeholder="0.00" />
                        </label>
                        <label>Total a cobrar ($) *
                            <input type="number" name="total" min="0" step="0.01" value={form.total} onChange={handleChange} placeholder="0.00" required />
                        </label>
                    </div>

                    <label>Notas / Descripción
                        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Observaciones, cupones aplicados, detalles..." />
                    </label>

                    <div className="mov-form-actions">
                        <button type="submit" className="btn-save-mov">Guardar Entrada</button>
                        <button type="button" className="btn-cancel-mov" onClick={resetForm}>Cancelar</button>
                    </div>
                </form>
            )}

            <div className="mov-table-wrap">
                {loading ? (
                    <p className="chart-placeholder">Cargando...</p>
                ) : !manuales?.length ? (
                    <p className="chart-placeholder">Sin registros manuales en el período</p>
                ) : (
                    <table className="mov-table">
                        <THead />
                        <tbody>
                            {manuales.map(m => {
                                const expanded = expandedId === m._id;
                                return (
                                    <tr
                                        key={m._id}
                                        className="mov-row-clickable"
                                        onClick={() => setExpandedId(expanded ? null : m._id)}
                                    >
                                        <td className="mov-cell-date">{fmtDate(m.createdAt)}</td>
                                        <td><TipoBadge type={m.fin_type} /></td>
                                        <td className="mov-cell-client">
                                            <span>{m.userName || '—'}</span>
                                            {m.phone && <span className="mov-sub"> {m.phone}</span>}
                                        </td>
                                        <td className={`mov-cell-ellipsis${expanded ? ' expanded' : ''}`}>
                                            {(m.products || []).join(', ') || '—'}
                                        </td>
                                        <td
                                            className="mov-cell-amount"
                                            style={{ color: m.fin_type === 'ingreso' ? '#2ecc71' : '#d60a5f' }}
                                        >
                                            {m.fin_type === 'salida' ? '-' : '+'}{fmtAmt(m.total)}
                                        </td>
                                        <td className="mov-cell-tag">{m.label}</td>
                                        <td className="mov-cell-tag">{m.payment_method || '—'}</td>
                                        <td className="mov-cell-tag">{m.delivery_method || '—'}</td>
                                        <td className="mov-cell-tag">{m.channel || '—'}</td>
                                        <DescCell text={m.description} expanded={expanded} />
                                        <td className="mov-actions" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleDelete(m._id)} type="button" title="Eliminar">🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const MovimientosCRUD = ({
    pendientes, manuales, procesadas,
    onProcess, onSaveManual, onDeleteManual, onRevert, onToggleOmit,
    loadingPendientes, loadingManuales, loadingProcesadas,
}) => {
    const [tab, setTab] = useState('pendientes');
    const [procesando, setProcesando] = useState(null);

    return (
        <div className="mov-crud">
            <div className="mov-header">
                <h3 className="chart-title">Transacciones</h3>
                <div className="dim-tabs">
                    <button
                        className={`dim-tab${tab === 'pendientes' ? ' active' : ''}`}
                        onClick={() => setTab('pendientes')}
                        type="button"
                    >
                        Pendientes
                        {pendientes?.length ? <span className="pending-badge">{pendientes.length}</span> : null}
                    </button>
                    <button
                        className={`dim-tab${tab === 'procesadas' ? ' active' : ''}`}
                        onClick={() => setTab('procesadas')}
                        type="button"
                    >
                        Procesadas
                    </button>
                    <button
                        className={`dim-tab${tab === 'manuales' ? ' active' : ''}`}
                        onClick={() => setTab('manuales')}
                        type="button"
                    >
                        Manuales
                    </button>
                </div>
            </div>

            {tab === 'pendientes' && (
                <PendientesList pendientes={pendientes} onProcess={setProcesando} loading={loadingPendientes} />
            )}
            {tab === 'procesadas' && (
                <ProcesadasList
                    procesadas={procesadas}
                    onRevert={onRevert}
                    onToggleOmit={onToggleOmit}
                    loading={loadingProcesadas}
                />
            )}
            {tab === 'manuales' && (
                <ManualesList
                    manuales={manuales}
                    onSaveManual={onSaveManual}
                    onDeleteManual={onDeleteManual}
                    loading={loadingManuales}
                />
            )}

            {procesando && (
                <ProcesarModal
                    tx={procesando}
                    onClose={() => setProcesando(null)}
                    onSave={onProcess}
                />
            )}
        </div>
    );
};
