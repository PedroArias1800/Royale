import { useState, useEffect, useCallback } from 'react';
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

// ─── Tabla de preview / detalle ───────────────────────────────────────────
const SellerTable = ({ sellers, royale_pct, seller_pct, isAdmin, corteId, onTogglePaid }) => {
    if (!sellers?.length) {
        return <div className="corte-preview-empty">No hay vendedores con transacciones en este período.</div>;
    }

    const totIngresos   = sellers.reduce((s, r) => s + r.total_ingresos, 0);
    const totCogs       = sellers.reduce((s, r) => s + r.total_cogs,     0);
    const totUtilidad   = sellers.reduce((s, r) => s + r.utilidad,        0);
    const totSeller     = sellers.reduce((s, r) => s + r.seller_cut,      0);
    const totRoyale     = sellers.reduce((s, r) => s + r.royale_cut,      0);

    return (
        <div className="corte-preview-table-wrap">
            <table className="corte-table">
                <thead>
                    <tr>
                        <th>Vendedor</th>
                        <th style={{ textAlign: 'right' }}>Tx</th>
                        <th style={{ textAlign: 'right' }}>Ingresos</th>
                        <th style={{ textAlign: 'right' }}>COGS</th>
                        <th style={{ textAlign: 'right' }}>Utilidad</th>
                        <th style={{ textAlign: 'right' }}>Vendedor ({seller_pct}%)</th>
                        {isAdmin && <th style={{ textAlign: 'right' }}>Royale ({royale_pct}%)</th>}
                        {isAdmin && corteId && <th style={{ textAlign: 'center' }}>Estado</th>}
                    </tr>
                </thead>
                <tbody>
                    {sellers.map((s, i) => (
                        <tr key={i}>
                            <td className="td-name">{s.seller_name}</td>
                            <td className="td-money" style={{ textAlign: 'right', color: 'rgba(237,232,235,0.5)' }}>
                                {s.tx_count}
                            </td>
                            <td className="td-money td-ingreso">{fmtMoney(s.total_ingresos)}</td>
                            <td className="td-money td-cogs">{fmtMoney(s.total_cogs)}</td>
                            <td className="td-money td-utilidad">{fmtMoney(s.utilidad)}</td>
                            <td className="td-money td-seller-cut">{fmtMoney(s.seller_cut)}</td>
                            {isAdmin && <td className="td-money td-royale-cut">{fmtMoney(s.royale_cut)}</td>}
                            {isAdmin && corteId && (
                                <td style={{ textAlign: 'center' }}>
                                    {s.paid ? (
                                        <span className="badge-paid">✓ Pagado</span>
                                    ) : (
                                        <span className="badge-pending">◉ Pendiente</span>
                                    )}
                                    <button
                                        className={s.paid ? 'btn-corte-ghost' : 'btn-corte-secondary'}
                                        style={{ marginLeft: 6, padding: '3px 10px', fontSize: '0.72rem' }}
                                        onClick={() => onTogglePaid(s.seller_id, s.paid)}
                                    >
                                        {s.paid ? 'Revertir' : 'Marcar Pagado'}
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="td-name">Total</td>
                        <td />
                        <td className="td-money td-ingreso">{fmtMoney(totIngresos)}</td>
                        <td className="td-money td-cogs">{fmtMoney(totCogs)}</td>
                        <td className="td-money td-utilidad">{fmtMoney(totUtilidad)}</td>
                        <td className="td-money td-seller-cut">{fmtMoney(totSeller)}</td>
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

    const allPaid = corte.sellers.every(s => s.paid);

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
                        <span className="stat-label">Vendedores</span>
                        <span className="stat-value vendedor">{fmtMoney(corte.total_seller_cuts)}</span>
                    </div>
                    {isAdmin && (
                        <div className="corte-stat">
                            <span className="stat-label">Royale</span>
                            <span className="stat-value royale">{fmtMoney(corte.total_royale_cuts)}</span>
                        </div>
                    )}
                    <span className="corte-sellers-count">
                        {corte.sellers.length} vendedor{corte.sellers.length !== 1 ? 'es' : ''}
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
                    <SellerTable
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

// ─── Panel de configuración ───────────────────────────────────────────────
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

// ─── Panel para crear un nuevo corte ─────────────────────────────────────
const NuevoCortePanel = ({ config, onCreated, onCancel }) => {
    const [form, setForm] = useState({
        label:        '',
        period_start: '',
        period_end:   todayISO(),
    });
    const [preview, setPreview]     = useState(null);
    const [loadingPrev, setLPrev]   = useState(false);
    const [creating, setCreating]   = useState(false);
    const [error, setError]         = useState('');

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
                            Preview — {preview.sellers.length} vendedor{preview.sellers.length !== 1 ? 'es' : ''} encontrado{preview.sellers.length !== 1 ? 's' : ''}
                        </p>
                        <SellerTable
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

// ─── Vista del vendedor ───────────────────────────────────────────────────
const SellerView = ({ user }) => {
    const [summary, setSummary]     = useState(null);
    const [cortes, setCortes]       = useState([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([
            getCortesRequest(),
            getSellerSummaryRequest(),
        ]).then(([cortesRes, summaryRes]) => {
            setCortes(cortesRes.data || []);
            setSummary(summaryRes.data);
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
    const isAdmin  = user?.rol == 1;

    const [config, setConfig]           = useState({ royale_pct: 50, seller_pct: 50 });
    const [cortes, setCortes]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showNewCorte, setShowNew]    = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cortesRes, configRes] = await Promise.all([
                getCortesRequest(),
                getCortesConfigRequest(),
            ]);
            setCortes(cortesRes.data || []);
            setConfig(configRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSaveConfig = async (data) => {
        await putCortesConfigRequest(data);
        setConfig(data);
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
                        <button
                            className="btn-corte-primary"
                            onClick={() => setShowNew(v => !v)}
                        >
                            {showNewCorte ? '✕ Cancelar' : '+ Nuevo Corte'}
                        </button>
                    </div>
                )}
            </div>

            {/* Vista vendedor */}
            {!isAdmin && <SellerView user={user} />}

            {/* Vista admin */}
            {isAdmin && (
                <>
                    <ConfigPanel config={config} onSave={handleSaveConfig} />

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
        </div>
    );
};
