import { useState, useEffect } from 'react';
import { postDeliveryPriceRequest, putDeliveryPriceRequest, deleteDeliveryPriceRequest } from '../api/Delivery.api.js';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { PROVINCES, DISTRICTS, METRO_STATIONS, ZONE_TYPE_LABELS } from '../data/panamaGeo.js';

const EMPTY_FORM = {
    zone_type: 'province',
    label: '',
    province: '',
    district: '',
    metro_line: 'Línea 1',
    metro_station: '',
    price: '',
    is_free: false,
    active: true,
    notes: '',
};

function autoLabel(form) {
    switch (form.zone_type) {
        case 'free':     return 'Delivery Gratuito';
        case 'province': return form.province ? `Provincia de ${form.province}` : '';
        case 'district': return (form.province && form.district)
            ? `${form.district} (${form.province})` : '';
        case 'metro':    return (form.metro_line && form.metro_station)
            ? `Metro ${form.metro_line} — ${form.metro_station}` : '';
        default:         return '';
    }
}

export const ModalFormDelivery = ({ item, onClose, onSaved, onDeleted, showAlert }) => {
    const isUpdate = Boolean(item?._id);

    const [form, setForm] = useState(() => {
        if (item) {
            return {
                zone_type: item.zone_type || 'province',
                label: item.label || '',
                province: item.province || '',
                district: item.district || '',
                metro_line: item.metro_line || 'Línea 1',
                metro_station: item.metro_station || '',
                price: item.is_free ? '0' : (item.price ?? ''),
                is_free: item.is_free || false,
                active: item.active !== false,
                notes: item.notes || '',
            };
        }
        return { ...EMPTY_FORM };
    });

    const [labelEdited, setLabelEdited] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!labelEdited) {
            const auto = autoLabel(form);
            if (auto) setForm(f => ({ ...f, label: auto }));
        }
    }, [form.zone_type, form.province, form.district, form.metro_line, form.metro_station]);

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleZoneType = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, zone_type: val, is_free: val === 'free', price: val === 'free' ? '0' : '' }));
    };

    const handleProvince = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, province: val, district: '' }));
    };

    const handleMetroLine = (val) => {
        setLabelEdited(false);
        setForm(f => ({ ...f, metro_line: val, metro_station: '' }));
    };

    const handleLabelChange = (e) => {
        setLabelEdited(true);
        set('label', e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.label.trim()) { showAlert('El nombre/etiqueta es requerido', 0); return; }
        if (form.zone_type !== 'free' && (form.price === '' || isNaN(Number(form.price)))) {
            showAlert('Ingresa un precio válido', 0); return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: form.is_free ? 0 : Number(form.price),
                province: form.province || null,
                district: form.district || null,
                metro_line: form.metro_line || null,
                metro_station: form.metro_station || null,
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
            console.error(err);
            showAlert('Error al eliminar', 0);
        }
    };

    const districts = form.province ? (DISTRICTS[form.province] || []) : [];
    const stations = form.metro_line ? (METRO_STATIONS[form.metro_line] || []) : [];

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content delivery-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header-row">
                    <h2 className="modal-title">{isUpdate ? 'Editar precio' : 'Nuevo precio de delivery'}</h2>
                    <button type="button" className="btnX" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Tipo de zona */}
                    <div className="form-group3">
                        <label>
                            <p>Tipo de zona</p>
                            <select value={form.zone_type} onChange={e => handleZoneType(e.target.value)}>
                                <option value="province">Provincia</option>
                                <option value="district">Distrito</option>
                                <option value="metro">Estación de Metro</option>
                                <option value="free">Gratis</option>
                            </select>
                        </label>

                        {/* Activo */}
                        <label>
                            <p>Estado</p>
                            <select value={form.active ? '1' : '0'} onChange={e => set('active', e.target.value === '1')}>
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </label>
                    </div>

                    {/* Campos según tipo de zona */}
                    {(form.zone_type === 'province' || form.zone_type === 'district') && (
                        <div className="form-group3">
                            <label>
                                <p>Provincia</p>
                                <select value={form.province} onChange={e => handleProvince(e.target.value)} required>
                                    <option value="">Selecciona una provincia</option>
                                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </label>
                            {form.zone_type === 'district' && (
                                <label>
                                    <p>Distrito</p>
                                    <select value={form.district} onChange={e => { setLabelEdited(false); set('district', e.target.value); }} required disabled={!form.province}>
                                        <option value="">Selecciona un distrito</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </label>
                            )}
                        </div>
                    )}

                    {form.zone_type === 'metro' && (
                        <div className="form-group3">
                            <label>
                                <p>Línea de Metro</p>
                                <select value={form.metro_line} onChange={e => handleMetroLine(e.target.value)} required>
                                    <option value="Línea 1">Línea 1</option>
                                    <option value="Línea 2">Línea 2</option>
                                </select>
                            </label>
                            <label>
                                <p>Estación</p>
                                <select value={form.metro_station} onChange={e => { setLabelEdited(false); set('metro_station', e.target.value); }} required>
                                    <option value="">Selecciona una estación</option>
                                    {stations.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                        </div>
                    )}

                    {/* Nombre y precio */}
                    <div className="form-group3">
                        <label>
                            <p>Nombre / Etiqueta</p>
                            <input
                                type="text"
                                value={form.label}
                                onChange={handleLabelChange}
                                placeholder="Ej: Entrega en Albrook"
                                required
                            />
                        </label>
                        <label>
                            <p>Precio (USD)</p>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.is_free ? '0' : form.price}
                                onChange={e => set('price', e.target.value)}
                                disabled={form.is_free}
                                placeholder="0.00"
                                required={!form.is_free}
                            />
                        </label>
                    </div>

                    {/* Notas */}
                    <label style={{ display: 'block', marginTop: '12px' }}>
                        <p>Notas (opcional)</p>
                        <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            rows={2}
                            placeholder="Observaciones adicionales..."
                            className="delivery-textarea"
                        />
                    </label>

                    <div className="btnBorrarCrear" style={{ justifyContent: isUpdate ? 'space-between' : 'flex-end' }}>
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
