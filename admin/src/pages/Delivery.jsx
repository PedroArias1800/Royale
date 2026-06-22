import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthProvider';
import { getDeliveryPricesRequest, postFilteredDeliveryRequest } from '../api/Delivery.api.js';
import { ModalFormDelivery } from '../components/ModalFormDelivery';
import { ZONE_TYPE_LABELS } from '../data/panamaGeo.js';
import '../css/Delivery.css';

const ZONE_BADGE_CLASS = {
    free: 'dz-badge-free',
    province: 'dz-badge-province',
    district: 'dz-badge-district',
    metro: 'dz-badge-metro',
};

function ZoneDetail({ item }) {
    if (item.zone_type === 'metro') {
        return <span className="dz-zone-detail">{item.metro_line} — {item.metro_station}</span>;
    }
    if (item.zone_type === 'district') {
        return <span className="dz-zone-detail">{item.district}<span className="dz-zone-sub">, {item.province}</span></span>;
    }
    if (item.zone_type === 'province') {
        return <span className="dz-zone-detail">{item.province}</span>;
    }
    return <span className="dz-zone-detail dz-free-tag">—</span>;
}

export const Delivery = () => {
    const { showAlert, user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);
    const [filterText, setFilterText] = useState('');
    const [filtering, setFiltering] = useState(false);
    const [modal, setModal] = useState(null); // null | { item: obj | null }

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
        setFiltering(true);
        setPage(1);
        loadFiltered(val, 1);
    };

    const handleFilterChange = (e) => {
        if (e.target.value.length === 0) {
            setFiltering(false);
            setFilterText('');
            setPage(1);
            load(1);
        }
    };

    const handleSaved = () => {
        setModal(null);
        setFiltering(false);
        setFilterText('');
        setPage(1);
        load(1);
    };

    const handleDeleted = () => {
        setModal(null);
        setFiltering(false);
        setFilterText('');
        setPage(1);
        load(1);
    };

    // Paginación inteligente
    const pageNumbers = () => {
        const total = pagination.totalPages || 1;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = [];
        if (page <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('…');
            pages.push(total);
        } else if (page >= total - 3) {
            pages.push(1); pages.push('…');
            for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
            pages.push(1); pages.push('…');
            pages.push(page - 1, page, page + 1);
            pages.push('…'); pages.push(total);
        }
        return pages;
    };

    const total = pagination.totalPages || 1;

    return (
        <div className="dataContent">
            <div className="pageHeader">
                <div className="pageHeader1">
                    <div className="volverAnadir">
                        <Link to="/admin" className="btn-volver">← Volver</Link>
                        {user?.rol == 1 && (
                            <button className="btn-anadir" onClick={() => setModal({ item: null })}>
                                + Añadir
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleFilterSubmit} className="formFilter">
                        <button type="submit" className="btnFilter">
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                        <input
                            type="text"
                            placeholder="Filtrar"
                            className="inputFilter"
                            onChange={handleFilterChange}
                        />
                    </form>
                </div>
                <div className="pageHeader-title-row">
                    <h1>Métricas de Delivery</h1>
                    {pagination.totalItems > 0 && (
                        <span className="pageHeader-count">
                            {pagination.totalItems} precio{pagination.totalItems !== 1 ? 's' : ''}
                            {pagination.totalPages > 1 && ` · Página ${page} de ${pagination.totalPages}`}
                        </span>
                    )}
                </div>
            </div>

            <div className="dataTable">
                {loading ? (
                    <div className="sinDatosParaMostrar">Cargando...</div>
                ) : data.length === 0 ? (
                    <div className="sinDatosParaMostrar"><h1>No hay precios registrados</h1></div>
                ) : (
                    <table className="responsiveTable">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Nombre</th>
                                <th>Zona</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr
                                    key={item._id}
                                    className="dz-row"
                                    onClick={() => user?.rol == 1 && setModal({ item })}
                                    title={user?.rol == 1 ? 'Clic para editar' : ''}
                                >
                                    <td>
                                        <span className={`dz-badge ${ZONE_BADGE_CLASS[item.zone_type] || ''}`}>
                                            {ZONE_TYPE_LABELS[item.zone_type] || item.zone_type}
                                        </span>
                                    </td>
                                    <td className="dz-label">{item.label}</td>
                                    <td><ZoneDetail item={item} /></td>
                                    <td className="dz-price">
                                        {item.is_free
                                            ? <span className="dz-free-tag">Gratis</span>
                                            : `$${Number(item.price).toFixed(2)}`
                                        }
                                    </td>
                                    <td>
                                        <span className={`dz-status ${item.active ? 'dz-active' : 'dz-inactive'}`}>
                                            {item.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="dz-notes">{item.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {total > 1 && (
                <nav className="admin-pagination">
                    <button
                        className="admin-pag-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Página anterior"
                    >‹</button>
                    <div className="admin-pag-pages">
                        {pageNumbers().map((p, i) =>
                            p === '…' ? (
                                <span key={`e-${i}`} className="admin-pag-ellipsis">…</span>
                            ) : (
                                <button
                                    key={p}
                                    className={`admin-pag-page${page === p ? ' active' : ''}`}
                                    onClick={() => setPage(p)}
                                    aria-label={`Página ${p}`}
                                    aria-current={p === page ? 'page' : undefined}
                                >{p}</button>
                            )
                        )}
                    </div>
                    <button
                        className="admin-pag-btn"
                        onClick={() => setPage(p => Math.min(total, p + 1))}
                        disabled={page === total}
                        aria-label="Página siguiente"
                    >›</button>
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
