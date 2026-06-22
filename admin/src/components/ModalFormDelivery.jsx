import { useState, useEffect } from 'react';
import { postDeliveryPriceRequest, putDeliveryPriceRequest, deleteDeliveryPriceRequest } from '../api/Delivery.api.js';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { PROVINCES, DISTRICTS, CORREGIMIENTOS, METRO_STATIONS } from '../data/panamaGeo.js';

const EMPTY_FORM = {
    delivery_type: 'zona',
    zona_level:    'provincia',
    province:      '',
    district:      '',
    corregimiento: '',
    metro_line:    'Línea 1',
    metro_station: '',
    label:         '',
    price:         '',
    active:        true,
    notes:         '',
};

function autoLabel(form) {
    if (form.delivery_type === 'gratis') return 'Delivery Gratuito';
    if (form.delivery_type === 'metro') {
        return (form.metro_line && form.metro_station)
            ? `Metro ${form.metro_line} — ${form.metro_station}` : '';
    }
    if (form.delivery_type === 'zona') {
        if (form.zona_level === 'corregimiento' && form.corregimiento && form.district && form.province)
            return `${form.corregimiento}, ${form.district} (${form.province})`;
        if (form.zona_level === 'distrito' && form.district && form.province)
            return `${form.district} (${form.province})`;
        if (form.zona_level === 'provincia' && form.province)
            return `Provincia de ${form.province}`;
    }
    return '';
}

const TYPE_BTNS = [
    { key: 'zona',   label: 'Zona Geográfica' },
    { key: 'metro',  label: 'Estación Metro' },
    { key: 'gratis', label: 'Umbral Gratis' },
];

const ZONA_LEVELS = [
    { key: 'provincia',     label: 'Provincia (precio para toda la prov.)' },
    { key: 'distrito',      label: 'Distrito (precio para todo el distrito)' },
    { key: 'corregimiento', label: 'Corregimiento (precio específico)' },
];

export const ModalFormDelivery = ({ item, onClose, onSaved, onDeleted, showAlert }) => {
    const isUpdate = Boolean(item?._id);

    const [form, setForm] = useState(() => {
        if (item) {
            // Support old schema (zone_type) for backwards compat
            const dt = item.delivery_type || (item.zone_type === 'metro' ? 'metro' : item.zone_type === 'free' ? 'gratis' : 'zona');
            let zl = item.zona_level;
            if (!zl) {
                if (item.zone_type === 'district') zl = 'distrito';
                else if (item.zone_type === 'province') zl = 'provincia';
            }
            return {
                delivery_type: dt,
                zona_level:    zl || 'provincia',
                province:      item.province      || '',
                district:      item.district      || '',
                corregimiento: item.corregimiento || '',
                metro_line:    item.metro_line    || 'Línea 1',
                metro_station: item.metro_station || '',
                label:         item.label         || '',
                price:         item.price ?? '',
                active:        item.active !== false,
                notes:         item.notes  || '',
            };
        }
        return { ...EMPTY_FORM };
    });

    const [labelEdited, setLabelEdited] = useState(isUpdate);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!labelEdited) {
            const auto = autoLabel(form);
            if (auto) setForm(f => ({ ...f, label: auto }));
        }
    }, [form.delivery_type, form.zona_level, form.province, form.district, form.corregimiento, form.metro_line, form.metro_station]);

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleTypeChange = (val) => {
        setLabelEdited(false);
        setForm(f => ({
            ...f, delivery_type: val,
            zona_level: 'provincia',
            province: '', district: '', corregimiento: '',
            metro_line: 'Línea 1', metro_station: '',
            price: '',
        }));
    };

    const handleZonaLevel = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, zona_level: val, district: '', corregimiento: '' }));
    };

    const handleProvince = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, province: val, district: '', corregimiento: '' }));
    };

    const handleDistrict = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, district: val, corregimiento: '' }));
    };

    const handleMetroLine = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, metro_line: val, metro_station: '' }));
    };

    const validate = () => {
        if (!form.label.trim()) { showAlert('El nombre/etiqueta es requerido', 0); return false; }
        if (form.price === '' || isNaN(Number(form.price))) { showAlert('Ingresa un precio válido', 0); return false; }
        if (form.delivery_type === 'zona') {
            if (!form.province) { showAlert('Selecciona una provincia', 0); return false; }
            if (form.zona_level === 'distrito' && !form.district) { showAlert('Selecciona un distrito', 0); return false; }
            if (form.zona_level === 'corregimiento' && (!form.district || !form.corregimiento)) {
                showAlert('Selecciona distrito y corregimiento', 0); return false;
            }
        }
        if (form.delivery_type === 'metro' && !form.metro_station) { showAlert('Selecciona una estación', 0); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                delivery_type: form.delivery_type,
                zona_level:    form.delivery_type === 'zona' ? form.zona_level : null,
                province:      form.delivery_type === 'zona' ? form.province || null : null,
                district:      form.delivery_type === 'zona' && form.zona_level !== 'provincia' ? form.district || null : null,
                corregimiento: form.delivery_type === 'zona' && form.zona_level === 'corregimiento' ? form.corregimiento || null : null,
                metro_line:    form.delivery_type === 'metro' ? form.metro_line || null : null,
                metro_station: form.delivery_type === 'metro' ? form.metro_station || null : null,
                label:         form.label.trim(),
                price:         Number(form.price),
                active:        form.active,
                notes:         form.notes || '',
            };
            if (isUpdate) {
                await putDeliveryPriceRequest(item._id, payload);
                showAlert('Precio actualizado con éxito', 1);
            } else {
                await postDeliveryPriceRequest(payload);
                showAlert('Precio creado con éxito', 1);
            }
            onSaved();
        } catch (err) {
            console.error(err);
            showAlert('Ocurrió un error. Inténtalo más tarde.', 0);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteDeliveryPriceRequest(item._id);
            showAlert('Precio eliminado', 1);
            onDeleted();
        } catch (err) {
            showAlert('Error al eliminar', 0);
        }
    };

    const districts      = form.province ? (DISTRICTS[form.province] || []) : [];
    const corregimientos = (form.province && form.district)
        ? ((CORREGIMIENTOS[form.province] || {})[form.district] || []) : [];
    const stations = METRO_STATIONS[form.metro_line] || [];

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content delivery-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header-row">
                    <h2 className="modal-title">{isUpdate ? 'Editar opción' : 'Nueva opción de delivery'}</h2>
                    <button type="button" className="btnX" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ── Tipo de delivery ── */}
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(237,232,235,0.55)', marginBottom: 8 }}>Tipo de delivery</p>
                        <div className="dz-type-tabs">
                            {TYPE_BTNS.map(t => (
                                <button
                                    key={t.key} type="button"
                                    className={`dz-type-tab ${form.delivery_type === t.key ? 'dz-type-tab--active' : ''}`}
                                    onClick={() => handleTypeChange(t.key)}
                                >{t.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* ── Umbral gratis ── */}
                    {form.delivery_type === 'gratis' && (
                        <div className="dz-info-box">
                            <p>Este umbral define el monto mínimo de compra para que el cliente obtenga <strong>delivery gratis automáticamente</strong>. Solo puede haber una configuración activa.</p>
                        </div>
                    )}

                    {/* ── Campos según tipo ── */}
                    {form.delivery_type === 'zona' && (
                        <>
                            <div style={{ marginBottom: 14 }}>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(237,232,235,0.55)', marginBottom: 6 }}>Nivel de la zona</p>
                                <div className="dz-level-tabs">
                                    {ZONA_LEVELS.map(l => (
                                        <label key={l.key} className={`dz-level-opt ${form.zona_level === l.key ? 'dz-level-opt--active' : ''}`}>
                                            <input type="radio" name="zona_level" value={l.key} checked={form.zona_level === l.key} onChange={() => handleZonaLevel(l.key)} />
                                            {l.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group3">
                                <label>
                                    <p>Provincia</p>
                                    <select value={form.province} onChange={e => handleProvince(e.target.value)} required>
                                        <option value="">Selecciona</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </label>
                                {(form.zona_level === 'distrito' || form.zona_level === 'corregimiento') && (
                                    <label>
                                        <p>Distrito</p>
                                        <select value={form.district} onChange={e => handleDistrict(e.target.value)} required disabled={!form.province}>
                                            <option value="">Selecciona</option>
                                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </label>
                                )}
                            </div>
                            {form.zona_level === 'corregimiento' && (
                                <div className="form-group3">
                                    <label>
                                        <p>Corregimiento</p>
                                        <select value={form.corregimiento} onChange={e => { setLabelEdited(false); set('corregimiento', e.target.value); }} required disabled={!form.district}>
                                            <option value="">Selecciona</option>
                                            {corregimientos.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </label>
                                </div>
                            )}
                        </>
                    )}

                    {form.delivery_type === 'metro' && (
                        <div className="form-group3">
                            <label>
                                <p>Línea de Metro</p>
                                <select value={form.metro_line} onChange={e => handleMetroLine(e.target.value)}>
                                    <option value="Línea 1">Línea 1</option>
                                    <option value="Línea 2">Línea 2</option>
                                </select>
                            </label>
                            <label>
                                <p>Estación</p>
                                <select value={form.metro_station} onChange={e => { setLabelEdited(false); set('metro_station', e.target.value); }} required>
                                    <option value="">Selecciona</option>
                                    {stations.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                        </div>
                    )}

                    {/* ── Nombre, precio y estado ── */}
                    <div className="form-group3">
                        <label>
                            <p>Nombre / Etiqueta</p>
                            <input
                                type="text" value={form.label}
                                onChange={e => { setLabelEdited(true); set('label', e.target.value); }}
                                placeholder="Ej: Entrega en Bella Vista"
                                required
                            />
                        </label>
                        <label>
                            <p>{form.delivery_type === 'gratis' ? 'Monto mínimo para gratis (USD)' : 'Precio (USD)'}</p>
                            <input
                                type="number" min="0" step="0.01"
                                value={form.price}
                                onChange={e => set('price', e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </label>
                    </div>

                    <div className="form-group3">
                        <label>
                            <p>Estado</p>
                            <select value={form.active ? '1' : '0'} onChange={e => set('active', e.target.value === '1')}>
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </label>
                    </div>

                    <label style={{ display: 'block', marginTop: 12 }}>
                        <p>Notas (opcional)</p>
                        <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            rows={2}
                            placeholder="Observaciones adicionales..."
                            className="delivery-textarea"
                        />
                    </label>

                    <div className="btnBorrarCrear" style={{ justifyContent: isUpdate ? 'space-between' : 'flex-end', marginTop: 20 }}>
                        {isUpdate && <ConfirmDeleteButton onConfirm={handleDelete} />}
                        <input
                            type="submit"
                            value={saving ? 'Guardando...' : isUpdate ? 'Actualizar' : 'Crear'}
                            className="btnActualizarCrear"
                            disabled={saving}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};
