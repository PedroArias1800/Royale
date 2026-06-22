import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthProvider';
import { getDiscountRulesRequest, postFilteredDiscountsRequest } from '../api/Discounts.api.js';
import { ModalFormDiscount } from '../components/ModalFormDiscount';
import '../css/Descuentos.css';

function scheduleInfo(rule) {
    if (!rule.schedule_enabled) return { label: 'Sin fecha', cls: 'ds-schedule--none' };
    const now = Date.now();
    const start = rule.schedule_start ? new Date(rule.schedule_start).getTime() : null;
    const end   = rule.schedule_end   ? new Date(rule.schedule_end).getTime()   : null;

    const fmt = (iso) => iso
        ? new Date(iso).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    if (end && now > end) return { label: `Vencido (${fmt(rule.schedule_end)})`, cls: 'ds-schedule--expired' };
    if (start && now < start) return { label: `Inicia ${fmt(rule.schedule_start)}`, cls: 'ds-schedule--pending' };
    return {
        label: `Activo${rule.schedule_end ? ` hasta ${fmt(rule.schedule_end)}` : ' (sin fin)'}`,
        cls: 'ds-schedule--active',
    };
}

export const Descuentos = () => {
    const { user, showAlert } = useAuth();
    const [data, setData]             = useState([]);
    const [pagination, setPagination] = useState({});
    const [page, setPage]             = useState(1);
    const [filterText, setFilterText] = useState('');
    const [filtering, setFiltering]   = useState(false);
    const [loading, setLoading]       = useState(false);
    const [modal, setModal]           = useState(null);

    const load = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await getDiscountRulesRequest(p);
            setData(res.data.data || []);
            setPagination(res.data.pagination || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const loadFiltered = useCallback(async (p = 1, text = filterText) => {
        setLoading(true);
        try {
            const res = await postFilteredDiscountsRequest(p, { filter: text });
            setData(res.data.data || []);
            setPagination(res.data.pagination || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filterText]);

    useEffect(() => {
        filtering ? loadFiltered(page) : load(page);
    }, [page]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        if (filterText.trim()) { setFiltering(true); loadFiltered(1, filterText); }
        else { setFiltering(false); load(1); }
    };

    const handleFilterChange = (e) => {
        const val = e.target.value;
        setFilterText(val);
        if (!val.trim()) { setFiltering(false); setPage(1); load(1); }
    };

    const handleSaved = () => {
        setModal(null);
        filtering ? loadFiltered(page) : load(page);
    };

    const handleDeleted = () => {
        setModal(null);
        const newPage = data.length === 1 && page > 1 ? page - 1 : page;
        setPage(newPage);
        filtering ? loadFiltered(newPage) : load(newPage);
    };

    const totalPages = pagination.totalPages || 1;

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return (
            <nav className="admin-pagination">
                <button className="admin-pag-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {pages.map((p, i) => p === '...'
                    ? <span key={`e${i}`} className="admin-pag-ellipsis">…</span>
                    : <button key={p} className={`admin-pag-page ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                )}
                <button className="admin-pag-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </nav>
        );
    };

    return (
        <div className="dataContent">
            <div className="pageHeader">
                <div className="pageHeader1">
                    <div className="volverAnadir">
                        <Link to="/admin" className="btn-volver">← Volver</Link>
                        {user?.rol === 1 && (
                            <button className="btn-anadir" onClick={() => setModal({ item: null })}>+ Añadir</button>
                        )}
                    </div>
                    <form onSubmit={handleFilterSubmit} className="formFilter">
                        <button type="submit" className="btnFilter">
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                        <input
                            type="text"
                            placeholder="Filtrar descuentos"
                            className="inputFilter"
                            value={filterText}
                            onChange={handleFilterChange}
                        />
                    </form>
                </div>
                <div className="pageHeader-title-row">
                    <h1>Descuentos por Métricas</h1>
                    {pagination.totalItems > 0 && (
                        <span className="pageHeader-count">
                            {pagination.totalItems} regla{pagination.totalItems !== 1 ? 's' : ''} · Página {page} de {totalPages}
                        </span>
                    )}
                </div>
            </div>

            <div className="dataTable">
                {loading ? (
                    <div className="sinDatosParaMostrar">Cargando…</div>
                ) : data.length === 0 ? (
                    <div className="sinDatosParaMostrar">
                        {filtering ? 'Sin resultados para esta búsqueda' : 'No hay reglas de descuento creadas aún'}
                    </div>
                ) : (
                    <table className="responsiveTable">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descuento</th>
                                <th>Métricas activas</th>
                                <th>Programación</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(rule => {
                                const sched = scheduleInfo(rule);
                                const hasBrands  = rule.filter_brand_ids?.length > 0;
                                const hasGender  = rule.filter_gender != null;
                                const hasPrice   = rule.filter_price_min != null || rule.filter_price_max != null;
                                const hasDate    = rule.filter_created_after || rule.filter_created_before;
                                return (
                                    <tr key={rule._id} onClick={() => user?.rol === 1 && setModal({ item: rule })} style={{ cursor: user?.rol === 1 ? 'pointer' : 'default' }}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{rule.title}</div>
                                            {rule.description && <div style={{ fontSize: '0.78rem', opacity: 0.5, marginTop: 2 }}>{rule.description}</div>}
                                        </td>
                                        <td>
                                            <span className="ds-pct-badge">−{rule.discount_pct}%</span>
                                        </td>
                                        <td>
                                            <div className="ds-badges">
                                                {hasBrands && <span className="ds-badge ds-badge-brand">Marca</span>}
                                                {hasGender && <span className="ds-badge ds-badge-gender">{rule.filter_gender === 1 ? 'Damas' : 'Caballeros'}</span>}
                                                {hasPrice  && <span className="ds-badge ds-badge-price">Precio</span>}
                                                {hasDate   && <span className="ds-badge ds-badge-date">Fecha</span>}
                                                {!hasBrands && !hasGender && !hasPrice && !hasDate && (
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic' }}>Todos</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`ds-schedule ${sched.cls}`}>{sched.label}</span>
                                        </td>
                                        <td>
                                            <span className={`dz-status ${rule.status === 1 ? 'dz-active' : 'dz-inactive'}`}>
                                                {rule.status === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {renderPagination()}

            {modal && (
                <ModalFormDiscount
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
