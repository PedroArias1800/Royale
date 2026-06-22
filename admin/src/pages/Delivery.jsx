import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthProvider';
import { getDeliveryPricesRequest, postFilteredDeliveryRequest } from '../api/Delivery.api.js';
import { ModalFormDelivery } from '../components/ModalFormDelivery';
import '../css/Delivery.css';

const TYPE_BADGE = {
    gratis: { cls: 'dz-badge-free',     label: 'Gratis' },
    metro:  { cls: 'dz-badge-metro',    label: 'Metro' },
    zona:   { cls: 'dz-badge-province', label: 'Zona' },
    // legacy
    free:     { cls: 'dz-badge-free',     label: 'Gratis' },
    province: { cls: 'dz-badge-province', label: 'Provincia' },
    district: { cls: 'dz-badge-district', label: 'Distrito' },
};

const LEVEL_LABELS = { provincia: 'Provincia', distrito: 'Distrito', corregimiento: 'Corregimiento' };

function ZoneDetail({ item }) {
    const dt = item.delivery_type || item.zone_type;
    if (dt === 'metro' || item.metro_station) {
        return <span className="dz-zone-detail">{item.metro_line} — {item.metro_station}</span>;
    }
    if (dt === 'gratis') {
        return <span className="dz-zone-detail">Compras mayores a <strong>${Number(item.price).toFixed(2)}</strong></span>;
    }
    // zona
    const parts = [item.corregimiento, item.district, item.province].filter(Boolean);
    const level = item.zona_level ? LEVEL_LABELS[item.zona_level] : '';
    return (
        <span className="dz-zone-detail">
            {parts.join(', ')}
            {level && <span className="dz-zone-sub"> · {level}</span>}
        </span>
    );
}

export const Delivery = () => {
    const { showAlert, user } = useAuth();
    const [data, setData]             = useState([]);
    const [loading, setLoading]       = useState(false);
    const [pagination, setPagination] = useState({});
    const [page, setPage]             = useState(1);
    const [filterText, setFilterText] = useState('');
    const [filtering, setFiltering]   = useState(false);
    const [modal, setModal]           = useState(null);

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await getDeliveryPricesRequest(p);
            setData(res.data?.data || []);
            setPagination(res.data?.pagination || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const loadFiltered = useCallback(async (text, p = 1) => {
        setLoading(true);
        try {
            const res = await postFilteredDeliveryRequest(p, { filter: text });
            setData(res.data?.data || []);
            setPagination(res.data?.pagination || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!filtering) load(page);
    }, [page, filtering]);

    const handleFilterSubmit = async (e) => {
        e.preventDefault();
        const val = e.target.querySelector('.inputFilter').value.trim();
        setFilterText(val);
        if (!val) { setFiltering(false); setPage(1); load(1); return; }
        setFiltering(true); setPage(1); loadFiltered(val, 1);
    };

    const handleFilterChange = (e) => {
        if (!e.target.value.trim()) { setFiltering(false); setFilterText(''); setPage(1); load(1); }
    };

    const handleSaved = () => { setModal(null); setFiltering(false); setFilterText(''); setPage(1); load(1); };
    const handleDeleted = () => { setModal(null); setFiltering(false); setFilterText(''); setPage(1); load(1); };

    const totalPages = pagination.totalPages || 1;

    return (
        <div className="dataContent">
            <div className="pageHeader">
                <div className="pageHeader1">
                    <div className="volverAnadir">
                        <Link to="/admin" className="btn-volver">← Volver</Link>
                        {user?.rol == 1 && (
                            <button className="btn-anadir" onClick={() => setModal({ item: null })}>+ Añadir</button>
                        )}
                    </div>
                    <form onSubmit={handleFilterSubmit} className="formFilter">
                        <button type="submit" className="btnFilter"><FontAwesomeIcon icon={faSearch} /></button>
                        <input type="text" placeholder="Filtrar" className="inputFilter" onChange={handleFilterChange} />
                    </form>
                </div>
                <div className="pageHeader-title-row">
                    <h1>Opciones de Delivery</h1>
                    {pagination.totalItems > 0 && (
                        <span className="pageHeader-count">
                            {pagination.totalItems} opción{pagination.totalItems !== 1 ? 'es' : ''}
                            {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
                        </span>
                    )}
                </div>
            </div>

            <div className="dataTable">
                {loading ? (
                    <div className="sinDatosParaMostrar">Cargando...</div>
                ) : data.length === 0 ? (
                    <div className="sinDatosParaMostrar"><h1>No hay opciones de delivery configuradas</h1></div>
                ) : (
                    <table className="responsiveTable">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nombre</th>
                                <th>Zona / Metro</th>
                                <th>Precio</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => {
                                const dt   = item.delivery_type || item.zone_type || 'zona';
                                const badge = TYPE_BADGE[dt] || { cls: '', label: dt };
                                return (
                                    <tr key={item._id} className="dz-row"
                                        onClick={() => user?.rol == 1 && setModal({ item })}>
                                        <td>
                                            <span className={`dz-badge ${badge.cls}`}>{badge.label}</span>
                                        </td>
                                        <td className="dz-label">{item.label}</td>
                                        <td><ZoneDetail item={item} /></td>
                                        <td className="dz-price">
                                            {dt === 'gratis'
                                                ? <span className="dz-free-tag">Umbral: ${Number(item.price).toFixed(2)}</span>
                                                : `$${Number(item.price).toFixed(2)}`
                                            }
                                        </td>
                                        <td>
                                            <span className={`dz-status ${item.active ? 'dz-active' : 'dz-inactive'}`}>
                                                {item.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <nav className="admin-pagination">
                    <button className="admin-pag-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`admin-pag-page${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="admin-pag-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                </nav>
            )}

            {modal && (
                <ModalFormDelivery
                    item={modal.item}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    showAlert={showAlert}
                />
            )}
        </div>
    );
};
