import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllBrandsRequest } from '../api/Admin.api.js';
import {
    postDiscountRuleRequest,
    putDiscountRuleRequest,
    deleteDiscountRuleRequest,
    postDiscountPreviewRequest,
} from '../api/Discounts.api.js';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import '../css/Descuentos.css';

const imgSrc = (path) => {
    const URLServer = import.meta.env.VITE_SERVER_URL || '';
    return (!path || path.startsWith('http')) ? path : `${URLServer}${path}`;
};

// Solo dos modos: sin fin o rango libre
const SCHEDULE_MODES = [
    { key: 'none',  label: 'Sin fin (activo desde la fecha de inicio sin expirar)' },
    { key: 'day',   label: 'Día específico' },
    { key: 'range', label: 'Rango libre (inicio y fin personalizados)' },
];

function calcEnd(mode, start) {
    if (!start || mode === 'none' || mode === 'range') return null;
    const d = new Date(start);
    if (mode === 'day') { d.setHours(23, 59, 59, 999); return d.toISOString().slice(0, 10); }
    return null;
}

function scheduleStatus(rule) {
    if (!rule.schedule_enabled) return 'none';
    const now = Date.now();
    const start = rule.schedule_start ? new Date(rule.schedule_start).getTime() : null;
    const end   = rule.schedule_end   ? new Date(rule.schedule_end).getTime()   : null;
    if (end && now > end) return 'expired';
    if (start && now < start) return 'pending';
    return 'active';
}

// DD/MM/YYYY
function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
}

const EMPTY_FORM = {
    title: '',
    description: '',
    discount_pct: '',
    status: 1,
    order_index: 0,
    filter_brand_ids: [],
    filter_gender: '',
    filter_price_min: '',
    filter_price_max: '',
    filter_created_after:  '2025-01-01',  // default: 1 enero 2025
    filter_created_before: '',
    schedule_enabled: false,
    schedule_mode:    'none',
    schedule_start:   '',
    schedule_end:     '',
};

export const ModalFormDiscount = ({ item, onClose, onSaved, onDeleted, showAlert }) => {
    const isUpdate = Boolean(item?._id);

    const [form, setForm] = useState(() => {
        if (item) {
            return {
                ...EMPTY_FORM,
                title:               item.title || '',
                description:         item.description || '',
                discount_pct:        item.discount_pct ?? '',
                status:              item.status ?? 1,
                order_index:         item.order_index ?? 0,
                filter_brand_ids:    item.filter_brand_ids || [],
                filter_gender:       item.filter_gender ?? '',
                filter_price_min:    item.filter_price_min ?? '',
                filter_price_max:    item.filter_price_max ?? '',
                filter_created_after:  item.filter_created_after
                    ? item.filter_created_after.slice(0, 10) : '2025-01-01',
                filter_created_before: item.filter_created_before
                    ? item.filter_created_before.slice(0, 10) : '',
                schedule_enabled: item.schedule_enabled || false,
                schedule_mode:    item.schedule_end ? 'range' : (item.schedule_start ? 'day' : 'none'),
                schedule_start:   item.schedule_start ? item.schedule_start.slice(0, 10) : '',
                schedule_end:     item.schedule_end   ? item.schedule_end.slice(0, 10)   : '',
            };
        }
        return { ...EMPTY_FORM };
    });

    const [brands, setBrands]   = useState([]);
    const [saving, setSaving]   = useState(false);
    const [preview, setPreview] = useState({ loading: false, count: 0, parfums: [] });
    const debounceRef = useRef(null);

    useEffect(() => {
        getAllBrandsRequest().then(res => {
            const list = res.data?.data || res.data || [];
            setBrands(Array.isArray(list) ? list : []);
        }).catch(() => {});
    }, []);

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const toggleBrand = (id) => {
        setForm(f => ({
            ...f,
            filter_brand_ids: f.filter_brand_ids.includes(id)
                ? f.filter_brand_ids.filter(b => b !== id)
                : [...f.filter_brand_ids, id],
        }));
    };

    // Preview en tiempo real (debounce 400ms)
    const triggerPreview = useCallback((currentForm) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setPreview(p => ({ ...p, loading: true }));
            try {
                const filters = {
                    filter_brand_ids:   currentForm.filter_brand_ids,
                    filter_gender:      currentForm.filter_gender !== '' ? parseInt(currentForm.filter_gender) : null,
                    filter_price_min:   currentForm.filter_price_min !== '' ? parseFloat(currentForm.filter_price_min) : null,
                    filter_price_max:   currentForm.filter_price_max !== '' ? parseFloat(currentForm.filter_price_max) : null,
                    filter_created_after:  currentForm.filter_created_after  ? `${currentForm.filter_created_after}T00:00:00Z`  : null,
                    filter_created_before: currentForm.filter_created_before ? `${currentForm.filter_created_before}T23:59:59Z` : null,
                };
                const res = await postDiscountPreviewRequest(filters);
                setPreview({ loading: false, count: res.data.count, parfums: res.data.parfums || [] });
            } catch {
                setPreview({ loading: false, count: 0, parfums: [] });
            }
        }, 400);
    }, []);

    useEffect(() => {
        triggerPreview(form);
    }, [
        form.filter_brand_ids,
        form.filter_gender,
        form.filter_price_min,
        form.filter_price_max,
        form.filter_created_after,
        form.filter_created_before,
    ]);

    const computedEnd = () => {
        if (!form.schedule_enabled) return '';
        if (form.schedule_mode === 'range') return form.schedule_end;
        return calcEnd(form.schedule_mode, form.schedule_start) || '';
    };

    const buildPayload = () => {
        const endVal = computedEnd();
        return {
            title:             form.title.trim(),
            description:       form.description.trim(),
            discount_pct:      parseFloat(form.discount_pct) || 0,
            status:            parseInt(form.status),
            order_index:       parseInt(form.order_index) || 0,
            filter_brand_ids:  form.filter_brand_ids,
            filter_gender:     form.filter_gender !== '' ? parseInt(form.filter_gender) : null,
            filter_price_min:  form.filter_price_min !== '' ? parseFloat(form.filter_price_min) : null,
            filter_price_max:  form.filter_price_max !== '' ? parseFloat(form.filter_price_max) : null,
            filter_created_after:  form.filter_created_after
                ? `${form.filter_created_after}T00:00:00Z` : null,
            filter_created_before: form.filter_created_before
                ? `${form.filter_created_before}T23:59:59Z` : null,
            schedule_enabled: form.schedule_enabled,
            schedule_start:   form.schedule_enabled && form.schedule_start
                ? `${form.schedule_start}T00:00:00Z` : null,
            schedule_end:     form.schedule_enabled && endVal
                ? `${endVal}T23:59:59Z` : null,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { showAlert('El nombre es requerido', 0); return; }
        if (!form.discount_pct || isNaN(parseFloat(form.discount_pct))) {
            showAlert('El porcentaje de descuento es requerido', 0); return;
        }
        setSaving(true);
        try {
            const payload = buildPayload();
            if (isUpdate) {
                await putDiscountRuleRequest(item._id, payload);
                showAlert('Descuento actualizado', 1);
            } else {
                await postDiscountRuleRequest(payload);
                showAlert('Descuento creado', 1);
            }
            onSaved();
        } catch {
            showAlert('Ocurrió un error. Inténtalo de nuevo.', 0);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteDiscountRuleRequest(item._id);
            showAlert('Descuento eliminado', 1);
            onDeleted();
        } catch {
            showAlert('Error al eliminar', 0);
        }
    };

    const endDisplay = computedEnd();
    const sStatus = scheduleStatus({
        schedule_enabled: form.schedule_enabled,
        schedule_start: form.schedule_start ? `${form.schedule_start}T00:00:00Z` : null,
        schedule_end:   endDisplay ? `${endDisplay}T23:59:59Z` : null,
    });

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content discount-modal" onClick={e => e.stopPropagation()}
                style={{ maxWidth: 660, maxHeight: '92vh', overflowY: 'auto' }}>
                <div className="modal-header-row">
                    <h2 className="modal-title">{isUpdate ? 'Editar descuento' : 'Nuevo descuento'}</h2>
                    <button type="button" className="btnX" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ── Info básica ── */}
                    <div className="ds-modal-section">
                        <p className="ds-section-title">Información general</p>
                        <div className="form-group3">
                            <label>
                                <p>Nombre</p>
                                <input type="text" value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="Ej: Recién Llegados" required />
                            </label>
                            <label>
                                <p>Descuento (%)</p>
                                <input type="number" min="1" max="99" step="0.5"
                                    value={form.discount_pct}
                                    onChange={e => set('discount_pct', e.target.value)}
                                    placeholder="15" required />
                            </label>
                        </div>
                        <div className="form-group3">
                            <label>
                                <p>Descripción (opcional)</p>
                                <input type="text" value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    placeholder="Ej: Parfums incorporados este mes" />
                            </label>
                        </div>
                        <div className="form-group3">
                            <label>
                                <p>Estado</p>
                                <select value={form.status} onChange={e => set('status', e.target.value)}>
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </label>
                            <label>
                                <p>Orden en cliente</p>
                                <input type="number" min="0" value={form.order_index}
                                    onChange={e => set('order_index', e.target.value)} placeholder="0" />
                            </label>
                        </div>
                    </div>

                    {/* ── Criterios de filtrado ── */}
                    <div className="ds-modal-section">
                        <p className="ds-section-title">Filtros de parfums</p>
                        <p className="ds-filter-note">
                            Estos criterios determinan <strong>qué parfums</strong> aparecen en esta sección de descuento.
                            Deja todo vacío para incluir todos los parfums del catálogo.
                        </p>

                        {/* Marcas */}
                        {brands.length > 0 && (
                            <label style={{ display: 'block', marginBottom: 12 }}>
                                <p>Marca (vacío = todas las marcas)</p>
                                <div className="ds-brand-grid">
                                    {brands.map(b => (
                                        <label key={b._id}
                                            className={`ds-brand-check ${form.filter_brand_ids.includes(b._id) ? 'checked' : ''}`}>
                                            <input type="checkbox"
                                                checked={form.filter_brand_ids.includes(b._id)}
                                                onChange={() => toggleBrand(b._id)} />
                                            {b.brand_name}
                                        </label>
                                    ))}
                                </div>
                            </label>
                        )}

                        <div className="form-group3">
                            <label>
                                <p>Género</p>
                                <select value={form.filter_gender} onChange={e => set('filter_gender', e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="1">Damas</option>
                                    <option value="2">Caballeros</option>
                                </select>
                            </label>
                        </div>

                        <div className="form-group3">
                            <label>
                                <p>Precio mínimo (USD)</p>
                                <input type="number" min="0" step="0.01"
                                    value={form.filter_price_min}
                                    onChange={e => set('filter_price_min', e.target.value)} placeholder="0.00" />
                            </label>
                            <label>
                                <p>Precio máximo (USD)</p>
                                <input type="number" min="0" step="0.01"
                                    value={form.filter_price_max}
                                    onChange={e => set('filter_price_max', e.target.value)} placeholder="999.99" />
                            </label>
                        </div>

                        {/* Fechas de incorporación al catálogo */}
                        <p style={{ fontSize: '0.78rem', color: 'rgba(237,232,235,0.45)', margin: '10px 0 6px' }}>
                            Fecha de incorporación al catálogo (DD/MM/AAAA)
                        </p>
                        <div className="form-group3">
                            <label>
                                <p>Desde</p>
                                <input type="date" value={form.filter_created_after}
                                    onChange={e => set('filter_created_after', e.target.value)} />
                            </label>
                            <label>
                                <p>Hasta</p>
                                <input type="date" value={form.filter_created_before}
                                    onChange={e => set('filter_created_before', e.target.value)} />
                            </label>
                        </div>

                        {/* Preview en tiempo real */}
                        <div className="ds-preview-box">
                            {preview.loading ? (
                                <div className="ds-preview-loading">Calculando parfums que aplican…</div>
                            ) : (
                                <>
                                    <div className="ds-preview-header">
                                        <span className="ds-preview-count">{preview.count}</span>
                                        <span className="ds-preview-label">
                                            {preview.count === 1 ? 'parfum aplica' : 'parfums aplican'} con estos criterios
                                        </span>
                                    </div>
                                    {preview.count === 0 ? (
                                        <div className="ds-preview-empty">
                                            Ningún parfum coincide. Ajusta los filtros o amplía el rango de fechas.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="ds-preview-grid">
                                                {preview.parfums.slice(0, 16).map(p => {
                                                    const t = p.types?.[0];
                                                    const discPct  = parseFloat(form.discount_pct) || 0;
                                                    const priceNew = t ? (t.price * (1 - discPct / 100)).toFixed(2) : null;
                                                    const brandName = p.brand?.brand_name || '';
                                                    return (
                                                        <div key={p._id} className="ds-preview-card">
                                                            {t?.img && <img src={imgSrc(t.img)} alt={p.title} />}
                                                            <div className="ds-preview-card__info">
                                                                <div className="ds-preview-card__name">{brandName} {p.title}</div>
                                                                {t && (
                                                                    <>
                                                                        <div className="ds-preview-card__price-old">${parseFloat(t.price).toFixed(2)}</div>
                                                                        {discPct > 0 && <div className="ds-preview-card__price-new">${priceNew}</div>}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {preview.count > 16 && (
                                                <div className="ds-preview-more">+{preview.count - 16} más no mostrados</div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Programación automática ── */}
                    <div className="ds-modal-section">
                        <p className="ds-section-title">Programación automática</p>
                        <p className="ds-filter-note">
                            Controla <strong>cuándo es visible esta regla</strong> para el cliente.
                            Independiente de los filtros de parfums de arriba.
                        </p>

                        <div className="ds-schedule-toggle">
                            <label className="ds-toggle-switch">
                                <input type="checkbox" checked={form.schedule_enabled}
                                    onChange={e => set('schedule_enabled', e.target.checked)} />
                                <span className="ds-toggle-track" />
                            </label>
                            <span className="ds-schedule-label">
                                {form.schedule_enabled ? 'Programación activa' : 'Sin programación (visible siempre si está Activo)'}
                            </span>
                        </div>

                        {form.schedule_enabled && (
                            <>
                                <div className="ds-mode-grid">
                                    {SCHEDULE_MODES.map(m => (
                                        <div key={m.key}
                                            className={`ds-mode-opt ${form.schedule_mode === m.key ? 'ds-mode-opt--selected' : ''}`}
                                            onClick={() => setForm(f => ({ ...f, schedule_mode: m.key, schedule_end: '' }))}>
                                            {m.label}
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group3" style={{ marginTop: 12 }}>
                                    <label>
                                        <p>Fecha de inicio (DD/MM/AAAA)</p>
                                        <input type="date" value={form.schedule_start}
                                            onChange={e => set('schedule_start', e.target.value)} />
                                    </label>
                                    {form.schedule_mode === 'range' && (
                                        <label>
                                            <p>Fecha de fin (DD/MM/AAAA)</p>
                                            <input type="date" value={form.schedule_end}
                                                onChange={e => set('schedule_end', e.target.value)} />
                                        </label>
                                    )}
                                    {form.schedule_mode === 'day' && (
                                        <label>
                                            <p>Fin (calculado)</p>
                                            <input type="text" value={form.schedule_start ? `${form.schedule_start} · 23:59` : '—'} disabled />
                                        </label>
                                    )}
                                    {form.schedule_mode === 'none' && (
                                        <label>
                                            <p>Fin</p>
                                            <input type="text" value="Indefinido" disabled />
                                        </label>
                                    )}
                                </div>

                                {form.schedule_start && (
                                    <div className={`ds-schedule-summary ${sStatus === 'expired' ? 'ds-schedule-summary--warning' : ''}`}>
                                        {sStatus === 'active' && (
                                            `Activo · desde el ${fmtDate(form.schedule_start + 'T00:00:00Z')}` +
                                            (endDisplay ? ` hasta el ${fmtDate(endDisplay + 'T23:59:59Z')}` : ' (sin fin)')
                                        )}
                                        {sStatus === 'pending' && `Programado · inicia el ${fmtDate(form.schedule_start + 'T00:00:00Z')}`}
                                        {sStatus === 'expired' && `⚠ Programación vencida · finalizó el ${fmtDate((endDisplay || '') + 'T23:59:59Z')}`}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="btnBorrarCrear" style={{ justifyContent: isUpdate ? 'space-between' : 'flex-end' }}>
                        {isUpdate && <ConfirmDeleteButton onConfirm={handleDelete} />}
                        <input type="submit"
                            value={saving ? 'Guardando…' : isUpdate ? 'Actualizar' : 'Crear descuento'}
                            className="btnActualizarCrear"
                            disabled={saving} />
                    </div>
                </form>
            </div>
        </div>
    );
};
