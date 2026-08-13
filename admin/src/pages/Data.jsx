import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAuth } from '../context/AuthProvider.jsx'
import { DataTable } from '../components/DataTable.jsx';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import {
    getPendingTransactionsRequest,
    getProcessedTransactionsRequest,
    putTransactionRequest,
    postManualTransactionRequest,
    deleteManualTransactionRequest,
} from '../api/Transaction.api.js';
import { MovimientosCRUD } from '../components/finanzas/MovimientosCRUD.jsx';

function firstOfMonthISO() {
    const d = new Date();
    d.setDate(1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

export const Data = () => {

    const { setModalData, setIdNumber, cargarDataTables, response, closeModal, user, pagination, filtrarData } = useAuth();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const navigate = useNavigate();
    const [consulta, setConsulta] = useState('')
    const [page, setPage] = useState(1);
    const [filterText, setFilterText] = useState('');
    const [txTab, setTxTab] = useState('all'); // 'all' | 'ingreso' | 'salida'
    const debounceRef = useRef(null);

    // Estado de la sección de gestión de transacciones (solo id == 7)
    const [pendientes, setPendientes] = useState([]);
    const [procesadas, setProcesadas] = useState([]);
    const [loadingPendientes, setLoadingPendientes] = useState(false);
    const [loadingProcesadas, setLoadingProcesadas] = useState(false);
    const [showAgregarTx, setShowAgregarTx] = useState(false);
    

    const volver = () => {
        closeModal()
        navigate("/admin")
    }

    useEffect(() => {
        closeModal()
    }, [])
    
    useEffect(() => {
        async function loadData() {

            if (id == 1){
                setConsulta('Perfumes')
            } 
            else if (id == 2){
                setConsulta('Tipos de Perfumes')
            } 
            else if (id == 3){
                setConsulta('Marcas')
            } 
            else if (id == 4){
                setConsulta('Versiones')
            }
            else if (id == 5){
                setConsulta('Fondos de Inicio')
            }
            else if (id == 6){
                setConsulta('Usuarios')
            }
            else if (id == 7){
                setConsulta('Transacciones')
            }
            else if (id == 8){
                setConsulta('Promociones')
            }
            else if (id == 9){
                setConsulta('Cupones')
            }
            else if (id == 10){
                setConsulta('Proveedores')
            }


            await cargarDataTables(id, page);
        }
        loadData()
    }, [page])

    const openModal = () => {
        setIdNumber(parseInt(id, 10))
        setModalData({})
    }

    const pageNumbers = () => {
        const total = pagination.totalPages || 1;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = [];
        if (page <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('…');
            pages.push(total);
        } else if (page >= total - 3) {
            pages.push(1);
            pages.push('…');
            for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('…');
            pages.push(page - 1, page, page + 1);
            pages.push('…');
            pages.push(total);
        }
        return pages;
    };

    const renderPagination = () => {
        const total = pagination.totalPages || 1;
        if (total <= 1) return null;
        return (
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
                            >
                                {p}
                            </button>
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
        );
    };

    const applyFilter = useCallback(async (text, currentPage = 1, tab = txTab) => {
        const finType = id == 7 && tab !== 'all' ? tab : undefined;
        if (!text.trim() && !finType) {
            await cargarDataTables(id, currentPage);
        } else {
            const body = { filter: text.trim() };
            if (finType) body.fin_type = finType;
            await filtrarData(id, currentPage, body);
        }
    }, [id, txTab, cargarDataTables, filtrarData]);

    const filtrar = async (e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        await applyFilter(filterText, page);
    };

    const handleFilterChange = (e) => {
        const val = e.target.value;
        setFilterText(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilter(val, 1), 400);
    };

    const clearFilter = async () => {
        setFilterText('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (id == 7 && txTab !== 'all') {
            await filtrarData(id, 1, { filter: '', fin_type: txTab });
        } else {
            await cargarDataTables(id, 1);
        }
        setPage(1);
    };

    const handleTxTab = async (tab) => {
        setTxTab(tab);
        setPage(1);
        setFilterText('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        await applyFilter('', 1, tab);
    };

    // ── Gestión de transacciones (id == 7) ──────────────────────────────────────
    const loadPendientes = useCallback(async () => {
        setLoadingPendientes(true);
        try {
            const res = await getPendingTransactionsRequest();
            setPendientes(res.data?.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingPendientes(false); }
    }, []);

    const loadProcesadas = useCallback(async () => {
        setLoadingProcesadas(true);
        try {
            const res = await getProcessedTransactionsRequest(firstOfMonthISO(), todayISO());
            setProcesadas(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingProcesadas(false); }
    }, []);

    useEffect(() => {
        if (id == 7) {
            loadPendientes();
            loadProcesadas();
        }
    }, [id]);

    const handleProcess = async (tx_id, data) => {
        try {
            await putTransactionRequest(tx_id, data);
            loadPendientes();
            loadProcesadas();
            await cargarDataTables(id, page);
        } catch (e) { console.error(e); }
    };

    const handleAddTransaction = async (data) => {
        try {
            await postManualTransactionRequest(data);
            if (data.status === 2) {
                loadProcesadas();
            } else {
                loadPendientes();
            }
            await cargarDataTables(id, page);
        } catch (e) { console.error(e); }
    };

    const handleRejectPending = async (tx_id) => {
        if (!confirm('¿Rechazar esta transacción? Quedará como cancelada.')) return;
        try {
            await putTransactionRequest(tx_id, { status: 0 });
            loadPendientes();
        } catch (e) { console.error(e); }
    };

    const handleDeletePending = async (tx_id) => {
        if (!confirm('¿Eliminar esta transacción permanentemente? Esta acción no se puede deshacer.')) return;
        try {
            await deleteManualTransactionRequest(tx_id);
            loadPendientes();
            await cargarDataTables(id, page);
        } catch (e) { console.error(e); }
    };

    const handleRevert = async (tx_id) => {
        if (!confirm('¿Revertir esta transacción a pendiente?')) return;
        try {
            await putTransactionRequest(tx_id, { status: 1 });
            loadProcesadas();
            loadPendientes();
            await cargarDataTables(id, page);
        } catch (e) { console.error(e); }
    };

    const handleToggleOmit = async (tx_id, omitted) => {
        try {
            await putTransactionRequest(tx_id, { omitted });
            setProcesadas(prev => prev.map(t => t._id === tx_id ? { ...t, omitted } : t));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (tx_id) => {
        if (!confirm('¿Eliminar esta transacción permanentemente?')) return;
        try {
            await deleteManualTransactionRequest(tx_id);
            loadProcesadas();
            await cargarDataTables(id, page);
        } catch (e) { console.error(e); }
    };

  return (
    <div className='dataContent'>
        {id == 7 && (
            <>
                <div className='volverAnadir'>
                    <button className='btn-volver' onClick={volver}>← Volver</button>
                    {(user?.roles?.includes(1) || user?.rol == 1) && (
                        <button className='btn-anadir' type="button" onClick={() => setShowAgregarTx(true)}>+ Añadir</button>
                    )}
                </div>
                <div className='tx-gestion'>
                    <h2 className='tx-gestion-title'>Gestión de Transacciones</h2>
                    <MovimientosCRUD
                        pendientes={pendientes}
                        procesadas={procesadas}
                        onProcess={handleProcess}
                        onAddTransaction={handleAddTransaction}
                        onRejectPending={handleRejectPending}
                        onDeletePending={handleDeletePending}
                        onRevert={handleRevert}
                        onToggleOmit={handleToggleOmit}
                        onDelete={handleDelete}
                        loadingPendientes={loadingPendientes}
                        loadingProcesadas={loadingProcesadas}
                        openExternal={showAgregarTx}
                        onCloseExternal={() => setShowAgregarTx(false)}
                    />
                </div>
                <div style={{borderTop: '1px solid rgba(253,208,94,0.18)', margin: '0'}} />
            </>
        )}
        <div className='pageHeader'>
            {id == 7 ? (
                /* Transacciones: solo el título, el buscador va junto a los tabs */
                <div className='pageHeader-consulta-meta'>
                    <h1 style={{fontSize: '1.15rem', fontWeight: 700, color: '#ede8eb', margin: 0}}>
                        Consulta de {consulta}
                    </h1>
                    {pagination.totalItems > 0 && (
                        <span className='pageHeader-count'>
                            {pagination.totalItems} registro{pagination.totalItems !== 1 ? 's' : ''}
                            {pagination.totalPages > 1 && ` · Página ${page} de ${pagination.totalPages}`}
                        </span>
                    )}
                </div>
            ) : (
                /* Resto de módulos: Volver + Añadir arriba, título abajo */
                <>
                    <div className='pageHeader1'>
                        <div className='volverAnadir'>
                            <button className='btn-volver' onClick={volver}>← Volver</button>
                            {(user?.roles?.includes(1) || user?.rol == 1) && (
                                <button className='btn-anadir' onClick={openModal}>+ Añadir</button>
                            )}
                        </div>
                        <form onSubmit={filtrar} className='formFilter'>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder='Buscar...'
                                    className='inputFilter'
                                    value={filterText}
                                    onChange={handleFilterChange}
                                />
                                {filterText && (
                                    <button
                                        type="button"
                                        onClick={clearFilter}
                                        style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'rgba(237,232,235,0.45)', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                                        title="Limpiar"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                            <button type='submit' className='btnFilter' title="Buscar">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </form>
                    </div>
                    <div className='pageHeader-title-row'>
                        <h1>Consulta de {consulta}</h1>
                        {pagination.totalItems > 0 && (
                            <span className='pageHeader-count'>
                                {pagination.totalItems} registro{pagination.totalItems !== 1 ? 's' : ''}
                                {pagination.totalPages > 1 && ` · Página ${page} de ${pagination.totalPages}`}
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
        {id == 7 && (
            <div className='tx-tab-filters'>
                <div className='tx-tabs-group'>
                    {[['all','Todos'],['ingreso','Ingresos'],['salida','Salidas']].map(([key,label]) => (
                        <button key={key} type="button"
                            className={`tx-tab-btn${txTab === key ? ' active' : ''}`}
                            onClick={() => handleTxTab(key)}
                        >{label}</button>
                    ))}
                </div>
                <form onSubmit={filtrar} className='formFilter'>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder='Buscar...'
                            className='inputFilter'
                            value={filterText}
                            onChange={handleFilterChange}
                        />
                        {filterText && (
                            <button
                                type="button"
                                onClick={clearFilter}
                                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'rgba(237,232,235,0.45)', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                                title="Limpiar"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>
                    <button type='submit' className='btnFilter' title="Buscar">
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </form>
            </div>
        )}

        <div className='dataTable' style={{display: response.length > 0 ? 'block' : 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {response.length > 0 && <DataTable data={response} idCategory={id}/>}
            {response.length == 0 && (
                <div className='sinDatosParaMostrar'>
                    <h1>No hay datos para mostrar</h1>
                </div>
            )}
        </div>
        {renderPagination()}
    </div>
  )
}