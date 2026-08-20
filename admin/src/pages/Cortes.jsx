import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import {
    getCortesConfigRequest,
    putCortesConfigRequest,
    getCortesPreviewRequest,
    getCortesRequest,
    postCorteRequest,
    deleteCorteRequest,
    markPaidRequest,
    markUnpaidRequest,
    getSellerSummaryRequest,
    getDeliveryConfigRequest,
    putDeliveryConfigRequest,
    getSellerUncutRequest,
} from '../api/Cortes.api.js';
import '../css/Cortes.css';

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate  = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
};
const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};
// Panama = UTC-5, sin DST
const firstDayOfMonth = () => {
    const d = new Date(Date.now() - 5 * 3600 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
};
const lastDayOfMonth = () => {
    const d     = new Date(Date.now() - 5 * 3600 * 1000);
    const year  = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const last  = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

// ─── Tabla unificada por usuario ──────────────────────────────────────────
const UnifiedUserTable = ({ sellers, royale_pct, seller_pct, isAdmin, corteId, onTogglePaid }) => {
    const [expandedId, setExpandedId] = useState(null);

    if (!sellers?.length) {
        return <div className="corte-preview-empty">No hay actividad en este período.</div>;
    }

    const totPay    = sellers.reduce((s, r) => s + (r.total_pay ?? r.seller_cut), 0);
    const totRoyale = sellers.reduce((s, r) => s + r.royale_cut, 0);
    const colSpan   = isAdmin ? (corteId ? 5 : 4) : 3;

    return (
        <div className="corte-preview-table-wrap">
            <table className="corte-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Desglose</th>
                        <th style={{ textAlign: 'right' }}>Total a Cobrar</th>
                        {isAdmin && <th style={{ textAlign: 'right' }}>Royale</th>}
                        {isAdmin && corteId && <th style={{ textAlign: 'center' }}>Estado</th>}
                    </tr>
                </thead>
                <tbody>
                    {sellers.map((s, i) => {
                        const userId   = s.seller_id;
                        const totalPay = s.total_pay ?? s.seller_cut;
                        const expanded = expandedId === userId;

                        const pills = [];
                        if (s.seller_cut > 0)   pills.push({ label: 'Ventas',    amount: s.seller_cut,    color: '#fdd05e' });
                        if (s.delivery_pay > 0) pills.push({ label: 'Deliverys', amount: s.delivery_pay, color: '#2ecc71' });
                        Object.values(s.op_reimbursements || {}).forEach(item => {
                            if (item.amount > 0)
                                pills.push({ label: item.label, amount: item.amount, color: '#a78bfa' });
                        });

                        return (
                            <Fragment key={i}>
                                <tr
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setExpandedId(expanded ? null : userId)}
                                >
                                    <td className="td-name">
                                        {s.seller_name}
                                        {s.tx_count > 0 && (
                                            <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'rgba(237,232,235,0.35)' }}>
                                                {s.tx_count} tx
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="corte-breakdown-pills">
                                            {pills.map((p, j) => (
                                                <span key={j} className="corte-breakdown-pill" style={{ color: p.color }}>
                                                    {p.label}: {fmtMoney(p.amount)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="td-money td-seller-cut">{fmtMoney(totalPay)}</td>
                                    {isAdmin && (
                                        <td className="td-money td-royale-cut">
                                            {s.royale_cut > 0 ? fmtMoney(s.royale_cut) : '—'}
                                        </td>
                                    )}
                                    {isAdmin && corteId && (
                                        <td style={{ textAlign: 'center' }}>
                                            {s.paid
                                                ? <span className="badge-paid">✓ Pagado</span>
                                                : <span className="badge-pending">◉ Pendiente</span>}
                                            <button
                                                className={s.paid ? 'btn-corte-ghost' : 'btn-corte-secondary'}
                                                style={{ marginLeft: 6, padding: '3px 10px', fontSize: '0.72rem' }}
                                                onClick={(e) => { e.stopPropagation(); onTogglePaid(s.seller_id, s.paid); }}
                                            >
                                                {s.paid ? 'Revertir' : 'Marcar Pagado'}
                                            </button>
                                        </td>
                                    )}
                                </tr>

                                {expanded && (
                                    <tr>
                                        <td colSpan={colSpan} style={{ padding: 0 }}>
                                            <div className="corte-user-detail">
                                                {s.seller_cut > 0 && (
                                                    <div className="corte-detail-section">
                                                        <span className="detail-section-label" style={{ color: '#fdd05e' }}>Ventas</span>
                                                        <div className="detail-section-body">
                                                            <span>Ingresos: <strong>{fmtMoney(s.total_ingresos)}</strong></span>
                                                            <span className="detail-sep">—</span>
                                                            <span>COGS: <strong>{fmtMoney(s.total_cogs)}</strong></span>
                                                            <span className="detail-sep">—</span>
                                                            <span>Utilidad: <strong style={{ color: '#38bdf8' }}>{fmtMoney(s.utilidad)}</strong></span>
                                                            <span className="detail-sep">—</span>
                                                            <span style={{ color: '#fdd05e' }}>
                                                                Corte ({seller_pct}%): <strong>{fmtMoney(s.seller_cut)}</strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {s.delivery_pay > 0 && (
                                                    <div className="corte-detail-section">
                                                        <span className="detail-section-label" style={{ color: '#2ecc71' }}>Deliverys</span>
                                                        <div className="detail-section-body">
                                                            <span style={{ color: '#2ecc71' }}>Total: <strong>{fmtMoney(s.delivery_pay)}</strong></span>
                                                        </div>
                                                    </div>
                                                )}
                                                {Object.entries(s.op_reimbursements || {}).map(([key, val]) =>
                                                    val.amount > 0 ? (
                                                        <div key={key} className="corte-detail-section">
                                                            <span className="detail-section-label" style={{ color: '#a78bfa' }}>{val.label}</span>
                                                            <div className="detail-section-body">
                                                                <span style={{ color: '#a78bfa' }}><strong>{fmtMoney(val.amount)}</strong></span>
                                                            </div>
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="td-name">Total</td>
                        <td />
                        <td className="td-money td-seller-cut">{fmtMoney(totPay)}</td>
                        {isAdmin && <td className="td-money td-royale-cut">{fmtMoney(totRoyale)}</td>}
                        {isAdmin && corteId && <td />}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// ─── Card de un corte en el historial ────────────────────────────────────
const CorteCard = ({ corte, isAdmin, onDelete, onTogglePaid }) => {
    const [open, setOpen] = useState(false);

    const allPaid    = corte.sellers.every(s => s.paid);
    const totalPay   = corte.total_pay ?? corte.total_seller_cuts;
    const userCount  = corte.sellers.length;

    return (
        <div className="corte-item">
            <div className="corte-item-header" onClick={() => setOpen(v => !v)}>
                <div className="corte-item-meta">
                    <span className="corte-item-label">{corte.label}</span>
                    <span className="corte-item-period">
                        {fmtDate(corte.period_start)} — {fmtDate(corte.period_end)}
                    </span>
                </div>

                <div className="corte-item-stats">
                    <div className="corte-stat">
                        <span className="stat-label">Utilidad</span>
                        <span className="stat-value utilidad">{fmtMoney(corte.total_utilidad)}</span>
                    </div>
                    <div className="corte-stat">
                        <span className="stat-label">A Pagar</span>
                        <span className="stat-value vendedor">{fmtMoney(totalPay)}</span>
                    </div>
                    {isAdmin && (
                        <div className="corte-stat">
                            <span className="stat-label">Royale</span>
                            <span className="stat-value royale">{fmtMoney(corte.total_royale_cuts)}</span>
                        </div>
                    )}
                    <span className="corte-sellers-count">
                        {userCount} usuario{userCount !== 1 ? 's' : ''}
                    </span>
                    {allPaid && <span className="badge-paid">✓ Todo pagado</span>}
                </div>

                <div className="corte-item-right">
                    <span className={`corte-expand-icon${open ? ' open' : ''}`}>▼</span>
                </div>
            </div>

            {open && (
                <div className="corte-item-detail">
                    <div style={{ fontSize: '0.75rem', color: 'rgba(237,232,235,0.3)' }}>
                        Creado el {fmtDate(corte.createdAt)}
                        {' · '}Distribución: Royale {corte.royale_pct}% / Vendedor {corte.seller_pct}%
                    </div>
                    <div className="corte-sep" />
                    <UnifiedUserTable
                        sellers={corte.sellers}
                        royale_pct={corte.royale_pct}
                        seller_pct={corte.seller_pct}
                        isAdmin={isAdmin}
                        corteId={corte._id}
                        onTogglePaid={(sellerId, isPaid) => onTogglePaid(corte._id, sellerId, isPaid)}
                    />
                    {isAdmin && (
                        <div className="corte-detail-actions">
                            <button
                                className="btn-corte-danger"
                                onClick={() => onDelete(corte._id, corte.label)}
                            >
                                🗑 Eliminar corte
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Panel de configuración — Distribución de Utilidad ───────────────────
const ConfigPanel = ({ config, onSave }) => {
    const [edit, setEdit] = useState(false);
    const [royale, setRoyale] = useState(String(config.royale_pct));
    const [seller, setSeller] = useState(String(config.seller_pct));
    const [error, setError]   = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setRoyale(String(config.royale_pct));
        setSeller(String(config.seller_pct));
    }, [config]);

    const handleRoyaleChange = (val) => {
        setRoyale(val);
        const r = parseFloat(val) || 0;
        setSeller(String(parseFloat((100 - r).toFixed(4))));
        setError('');
    };

    const handleSellerChange = (val) => {
        setSeller(val);
        const s = parseFloat(val) || 0;
        setRoyale(String(parseFloat((100 - s).toFixed(4))));
        setError('');
    };

    const handleSave = async () => {
        const r = parseFloat(royale) || 0;
        const s = parseFloat(seller) || 0;
        if (Math.abs(r + s - 100) > 0.01) {
            setError('Los porcentajes deben sumar 100%');
            return;
        }
        setSaving(true);
        try {
            await onSave({ royale_pct: r, seller_pct: s });
            setEdit(false);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Error al guardar');
        }
        setSaving(false);
    };

    return (
        <div className="corte-card">
            <p className="corte-card-title">⚙ Distribución de Utilidad</p>
            {!edit ? (
                <div className="corte-config-panel">
                    <div className="corte-config-pcts">
                        <div className="corte-pct-badge royale">
                            <span className="pct-value">{config.royale_pct}%</span>
                            <span className="pct-label">Royale</span>
                        </div>
                        <div className="corte-pct-badge">
                            <span className="pct-value">{config.seller_pct}%</span>
                            <span className="pct-label">Vendedor</span>
                        </div>
                    </div>
                    <button className="btn-corte-ghost" onClick={() => setEdit(true)}>
                        ✏ Editar porcentajes
                    </button>
                    <span className="corte-config-note">
                        Solo aplica a nuevos cortes; los históricos mantienen sus valores originales.
                    </span>
                </div>
            ) : (
                <div className="corte-config-panel" style={{ flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div className="corte-config-field">
                            <label>Royale (%)</label>
                            <input
                                type="number" min="0" max="100" step="0.5"
                                value={royale}
                                onChange={e => handleRoyaleChange(e.target.value)}
                                className="corte-config-input"
                            />
                        </div>
                        <div className="corte-config-field">
                            <label>Vendedor (%)</label>
                            <input
                                type="number" min="0" max="100" step="0.5"
                                value={seller}
                                onChange={e => handleSellerChange(e.target.value)}
                                className="corte-config-input"
                            />
                        </div>
                    </div>
                    {error && <span className="corte-error">{error}</span>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-corte-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button className="btn-corte-ghost" onClick={() => { setEdit(false); setError(''); }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Panel configuración Delivery ────────────────────────────────────────
const DeliveryConfigPanel = ({ config, onSave }) => {
    const [edit, setEdit]     = useState(false);
    const [fee, setFee]       = useState(String(config.fee_per_order));
    const [minFee, setMinFee] = useState(String(config.min_daily_fee));
    const [error, setError]   = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFee(String(config.fee_per_order));
        setMinFee(String(config.min_daily_fee));
    }, [config]);

    const handleSave = async () => {
        const f = parseFloat(fee);
        const m = parseFloat(minFee);
        if (!f || !m || f <= 0 || m <= 0) {
            setError('Ambos montos deben ser mayores a 0');
            return;
        }
        setSaving(true);
        try {
            await onSave({ fee_per_order: f, min_daily_fee: m });
            setEdit(false);
            setError('');
        } catch (e) {
            setError(e?.response?.data?.detail || 'Error al guardar');
        }
        setSaving(false);
    };

    return (
        <div className="corte-card">
            <p className="corte-card-title">🚚 Configuración Delivery</p>
            {!edit ? (
                <div className="corte-config-panel">
                    <div className="corte-config-pcts">
                        <div className="corte-pct-badge">
                            <span className="pct-value">{fmtMoney(config.fee_per_order)}</span>
                            <span className="pct-label">Por pedido</span>
                        </div>
                        <div className="corte-pct-badge royale">
                            <span className="pct-value">{fmtMoney(config.min_daily_fee)}</span>
                            <span className="pct-label">Mínimo diario</span>
                        </div>
                    </div>
                    <button className="btn-corte-ghost" onClick={() => setEdit(true)}>
                        ✏ Editar tarifas
                    </button>
                    <span className="corte-config-note">
                        1 entrega/día = mínimo diario. 2+ entregas = tarifa por pedido c/u.
                    </span>
                </div>
            ) : (
                <div className="corte-config-panel" style={{ flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div className="corte-config-field">
                            <label>Por pedido ($)</label>
                            <input type="number" min="0.01" step="0.5"
                                value={fee} onChange={e => { setFee(e.target.value); setError(''); }}
                                className="corte-config-input" />
                        </div>
                        <div className="corte-config-field">
                            <label>Mínimo diario ($)</label>
                            <input type="number" min="0.01" step="0.5"
                                value={minFee} onChange={e => { setMinFee(e.target.value); setError(''); }}
                                className="corte-config-input" />
                        </div>
                    </div>
                    {error && <span className="corte-error">{error}</span>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-corte-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button className="btn-corte-ghost" onClick={() => { setEdit(false); setError(''); }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Panel para crear un nuevo corte ─────────────────────────────────────
const NuevoCortePanel = ({ config, onCreated, onCancel }) => {
    const [form, setForm] = useState({
        label:        '',
        period_start: firstDayOfMonth(),
        period_end:   lastDayOfMonth(),
    });
    const [preview, setPreview]   = useState(null);
    const [loadingPrev, setLPrev] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError]       = useState('');

    const canPreview = form.period_start && form.period_end && form.period_start <= form.period_end;

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setPreview(null);
        setError('');
    };

    const loadPreview = async () => {
        if (!canPreview) return;
        setLPrev(true);
        setError('');
        try {
            const res = await getCortesPreviewRequest(
                `${form.period_start}T00:00:00-05:00`,
                `${form.period_end}T23:59:59-05:00`,
            );
            setPreview(res.data);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Error al cargar preview');
        }
        setLPrev(false);
    };

    const handleCreate = async () => {
        if (!form.label.trim()) { setError('Ingresa una etiqueta para el corte'); return; }
        if (!canPreview)         { setError('Selecciona un período válido'); return; }
        setCreating(true);
        setError('');
        try {
            await postCorteRequest({
                label:        form.label.trim(),
                period_start: `${form.period_start}T00:00:00-05:00`,
                period_end:   `${form.period_end}T23:59:59-05:00`,
            });
            onCreated();
        } catch (e) {
            setError(e?.response?.data?.detail || 'Error al crear el corte');
        }
        setCreating(false);
    };

    return (
        <div className="corte-card">
            <p className="corte-card-title">✦ Nuevo Corte</p>
            <div className="corte-nuevo-form">
                <div className="corte-form-row">
                    <div className="corte-form-field">
                        <label>Etiqueta</label>
                        <input
                            type="text"
                            name="label"
                            value={form.label}
                            onChange={handleChange}
                            placeholder="Ej: Corte Semana 27 — Julio 2026"
                        />
                    </div>
                    <div className="corte-form-field">
                        <label>Desde</label>
                        <input
                            type="date"
                            name="period_start"
                            value={form.period_start}
                            max={form.period_end || todayISO()}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="corte-form-field">
                        <label>Hasta</label>
                        <input
                            type="date"
                            name="period_end"
                            value={form.period_end}
                            max={todayISO()}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="corte-form-actions">
                    <button
                        className="btn-corte-secondary"
                        onClick={loadPreview}
                        disabled={!canPreview || loadingPrev}
                    >
                        {loadingPrev ? 'Calculando...' : '🔍 Calcular preview'}
                    </button>
                </div>

                {error && <span className="corte-error">{error}</span>}

                {preview && (
                    <>
                        <p className="corte-preview-title">
                            Preview — {preview.sellers.length} usuario{preview.sellers.length !== 1 ? 's' : ''} encontrado{preview.sellers.length !== 1 ? 's' : ''}
                            {' · '}Total a pagar: <strong>{fmtMoney(preview.total_pay)}</strong>
                        </p>
                        <UnifiedUserTable
                            sellers={preview.sellers}
                            royale_pct={config.royale_pct}
                            seller_pct={config.seller_pct}
                            isAdmin={true}
                            corteId={null}
                            onTogglePaid={() => {}}
                        />
                        {preview.sellers.length > 0 && (
                            <div className="corte-form-actions">
                                <button
                                    className="btn-corte-primary"
                                    onClick={handleCreate}
                                    disabled={creating || !form.label.trim()}
                                >
                                    {creating ? 'Creando...' : '✓ Crear Corte'}
                                </button>
                                <button className="btn-corte-ghost" onClick={onCancel}>
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Ventas sin corte ─────────────────────────────────────────────────────
const fmtProducts = (products = []) => {
    if (!products.length) return '—';
    return products.map(p => p.includes('=') ? p.split('=')[1] : p).join(', ');
};

const UncutSection = ({ uncut }) => {
    const [expanded, setExpanded] = useState(false);
    if (!uncut) return null;
    const { transactions, total_seller_cut, tx_count, seller_pct, since } = uncut;
    const sinceLabel = since
        ? new Date(since).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    return (
        <div className="uncut-section">
            <div className="uncut-header" onClick={() => setExpanded(v => !v)} style={{ cursor: 'pointer' }}>
                <div className="uncut-header-left">
                    <span className="uncut-title">Ventas Pendientes de Corte</span>
                    {sinceLabel && (
                        <span className="uncut-since">desde {sinceLabel}</span>
                    )}
                </div>
                <div className="uncut-header-right">
                    <span className="uncut-kpi">
                        <span className="uncut-kpi-label">{tx_count} venta{tx_count !== 1 ? 's' : ''}</span>
                    </span>
                    <span className="uncut-kpi">
                        <span className="uncut-kpi-label">Ganancia estimada</span>
                        <span className="uncut-kpi-value">{fmtMoney(total_seller_cut)}</span>
                        <span className="uncut-kpi-pct">({seller_pct}%)</span>
                    </span>
                    <span className="uncut-toggle">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {expanded && (
                <div className="uncut-table-wrap">
                    {!transactions.length ? (
                        <p className="uncut-empty">No hay ventas pendientes de corte.</p>
                    ) : (
                        <table className="uncut-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>N° Pedido</th>
                                    <th>Productos</th>
                                    <th style={{ textAlign: 'right' }}>Total Venta</th>
                                    <th style={{ textAlign: 'right' }}>Tu Ganancia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx._id}>
                                        <td>{fmtDate(tx.createdAt)}</td>
                                        <td className="uncut-order">{tx.order_number || '—'}</td>
                                        <td className="uncut-products">{fmtProducts(tx.products)}</td>
                                        <td style={{ textAlign: 'right', color: '#2ecc71' }}>{fmtMoney(tx.total)}</td>
                                        <td style={{ textAlign: 'right', color: '#fdd05e', fontWeight: 600 }}>{fmtMoney(tx.seller_cut)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="uncut-total-row">
                                    <td colSpan={3}></td>
                                    <td style={{ textAlign: 'right', color: '#2ecc71' }}>
                                        {fmtMoney(transactions.reduce((s, t) => s + t.total, 0))}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#fdd05e', fontWeight: 700 }}>
                                        {fmtMoney(total_seller_cut)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Vista del vendedor / repartidor ─────────────────────────────────────
const SellerView = () => {
    const [summary, setSummary] = useState(null);
    const [cortes, setCortes]   = useState([]);
    const [uncut, setUncut]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getCortesRequest(),
            getSellerSummaryRequest(),
            getSellerUncutRequest(),
        ]).then(([cortesRes, summaryRes, uncutRes]) => {
            setCortes(cortesRes.data || []);
            setSummary(summaryRes.data);
            setUncut(uncutRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="cortes-loading">Cargando tus ganancias...</div>;

    return (
        <>
            {summary && (
                <div className="corte-seller-summary-card">
                    <div className="corte-summary-kpi">
                        <span className="kpi-label">Total Ganado</span>
                        <span className="kpi-value">{fmtMoney(summary.total_earned)}</span>
                    </div>
                    <div className="corte-summary-kpi">
                        <span className="kpi-label">Cobrado</span>
                        <span className="kpi-value paid">{fmtMoney(summary.total_paid)}</span>
                    </div>
                    <div className="corte-summary-kpi">
                        <span className="kpi-label">Por Cobrar</span>
                        <span className="kpi-value pending">{fmtMoney(summary.total_pending)}</span>
                    </div>
                    <div className="corte-summary-kpi">
                        <span className="kpi-label">Cortes</span>
                        <span className="kpi-value" style={{ color: '#a78bfa' }}>{summary.corte_count}</span>
                    </div>
                </div>
            )}

            <UncutSection uncut={uncut} />

            <div className="cortes-history">
                <p className="cortes-history-title">Historial de Cortes</p>
                {!cortes.length ? (
                    <div className="cortes-empty">Aún no tienes cortes registrados.</div>
                ) : (
                    cortes.map(c => (
                        <CorteCard
                            key={c._id}
                            corte={c}
                            isAdmin={false}
                            onDelete={() => {}}
                            onTogglePaid={() => {}}
                        />
                    ))
                )}
            </div>
        </>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────
export const Cortes = () => {
    const { user } = useAuth();
    const isAdmin  = user?.roles?.includes(1) || user?.rol == 1;

    const [config, setConfig]               = useState({ royale_pct: 50, seller_pct: 50 });
    const [deliveryConfig, setDeliveryConfig] = useState({ fee_per_order: 5, min_daily_fee: 8 });
    const [cortes, setCortes]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [showNewCorte, setShowNew]        = useState(false);
    const [viewMode, setViewMode]           = useState('gestion'); // 'gestion' | 'personal'
    const [sellerSummary, setSellerSummary] = useState(null);
    const [sellerUncut, setSellerUncut]     = useState(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cortesRes, configRes, summaryRes, deliveryCfgRes, uncutRes] = await Promise.all([
                getCortesRequest(),
                getCortesConfigRequest(),
                getSellerSummaryRequest(),
                getDeliveryConfigRequest(),
                getSellerUncutRequest(),
            ]);
            setCortes(cortesRes.data || []);
            setConfig(configRes.data);
            setSellerSummary(summaryRes.data);
            setDeliveryConfig(deliveryCfgRes.data);
            setSellerUncut(uncutRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSaveConfig = async (data) => {
        await putCortesConfigRequest(data);
        setConfig(data);
    };

    const handleSaveDeliveryConfig = async (data) => {
        await putDeliveryConfigRequest(data);
        setDeliveryConfig(data);
    };

    const handleCreated = () => {
        setShowNew(false);
        loadAll();
    };

    const handleDelete = async (id, label) => {
        if (!confirm(`¿Eliminar el corte "${label}"? Esta acción no se puede deshacer.`)) return;
        try {
            await deleteCorteRequest(id);
            setCortes(prev => prev.filter(c => c._id !== id));
        } catch (e) { alert(e?.response?.data?.detail || 'Error al eliminar'); }
    };

    const handleTogglePaid = async (corteId, sellerId, isPaid) => {
        try {
            if (isPaid) {
                await markUnpaidRequest(corteId, sellerId);
            } else {
                await markPaidRequest(corteId, sellerId);
            }
            setCortes(prev => prev.map(c => {
                if (c._id !== corteId) return c;
                return {
                    ...c,
                    sellers: c.sellers.map(s =>
                        s.seller_id === sellerId
                            ? { ...s, paid: !isPaid, paid_at: isPaid ? null : new Date().toISOString() }
                            : s
                    ),
                };
            }));
        } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
    };

    const myCortes = cortes
        .map(c => ({ ...c, sellers: c.sellers.filter(s => s.seller_id === user?.id) }))
        .filter(c => c.sellers.length > 0);

    if (!user) return <div className="cortes-loading">Cargando...</div>;

    return (
        <div className="cortes-page">
            {/* Header */}
            <div className="cortes-header">
                <div className="cortes-header-left">
                    <div className="volverAnadir">
                        <Link to="/admin" className="btn-volver">← Volver</Link>
                    </div>
                    <h1 className="cortes-title">
                        {isAdmin ? 'Días de Corte' : 'Mis Ganancias'}
                    </h1>
                </div>
                {isAdmin && (
                    <div className="cortes-header-actions">
                        <div className="cortes-view-tabs">
                            <button
                                className={`cortes-tab-btn${viewMode === 'gestion' ? ' active' : ''}`}
                                onClick={() => { setViewMode('gestion'); setShowNew(false); }}
                            >
                                Gestión
                            </button>
                            <button
                                className={`cortes-tab-btn${viewMode === 'personal' ? ' active' : ''}`}
                                onClick={() => { setViewMode('personal'); setShowNew(false); }}
                            >
                                Mis Ganancias
                            </button>
                        </div>
                        {viewMode === 'gestion' && (
                            <button
                                className="btn-corte-primary"
                                onClick={() => setShowNew(v => !v)}
                            >
                                {showNewCorte ? '✕ Cancelar' : '+ Nuevo Corte'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Vista vendedor / repartidor */}
            {!isAdmin && <SellerView />}

            {/* Vista admin — Gestión */}
            {isAdmin && viewMode === 'gestion' && (
                <>
                    <div className="corte-configs-row">
                        <ConfigPanel config={config} onSave={handleSaveConfig} />
                        <DeliveryConfigPanel config={deliveryConfig} onSave={handleSaveDeliveryConfig} />
                    </div>

                    {showNewCorte && (
                        <NuevoCortePanel
                            config={config}
                            onCreated={handleCreated}
                            onCancel={() => setShowNew(false)}
                        />
                    )}

                    <div className="cortes-history">
                        <p className="cortes-history-title">
                            Historial — {cortes.length} corte{cortes.length !== 1 ? 's' : ''}
                        </p>
                        {loading ? (
                            <div className="cortes-loading">Cargando historial...</div>
                        ) : !cortes.length ? (
                            <div className="cortes-empty">No hay cortes registrados aún.</div>
                        ) : (
                            cortes.map(c => (
                                <CorteCard
                                    key={c._id}
                                    corte={c}
                                    isAdmin={true}
                                    onDelete={handleDelete}
                                    onTogglePaid={handleTogglePaid}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Vista admin — Mis Ganancias */}
            {isAdmin && viewMode === 'personal' && (
                <>
                    {sellerSummary && (
                        <div className="corte-seller-summary-card">
                            <div className="corte-summary-kpi">
                                <span className="kpi-label">Total Ganado</span>
                                <span className="kpi-value">{fmtMoney(sellerSummary.total_earned)}</span>
                            </div>
                            <div className="corte-summary-kpi">
                                <span className="kpi-label">Cobrado</span>
                                <span className="kpi-value paid">{fmtMoney(sellerSummary.total_paid)}</span>
                            </div>
                            <div className="corte-summary-kpi">
                                <span className="kpi-label">Por Cobrar</span>
                                <span className="kpi-value pending">{fmtMoney(sellerSummary.total_pending)}</span>
                            </div>
                            <div className="corte-summary-kpi">
                                <span className="kpi-label">Cortes</span>
                                <span className="kpi-value" style={{ color: '#a78bfa' }}>{sellerSummary.corte_count}</span>
                            </div>
                        </div>
                    )}

                    <UncutSection uncut={sellerUncut} />

                    <div className="cortes-history">
                        <p className="cortes-history-title">Mi historial de cortes</p>
                        {loading ? (
                            <div className="cortes-loading">Cargando...</div>
                        ) : !myCortes.length ? (
                            <div className="cortes-empty">No apareces en ningún corte.</div>
                        ) : (
                            myCortes.map(c => (
                                <CorteCard
                                    key={c._id}
                                    corte={c}
                                    isAdmin={false}
                                    onDelete={() => {}}
                                    onTogglePaid={() => {}}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
