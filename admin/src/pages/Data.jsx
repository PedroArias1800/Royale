import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAuth } from '../context/AuthProvider.jsx'
import { DataTable } from '../components/DataTable.jsx';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

export const Data = () => {

    const { setModalData, setIdNumber, cargarDataTables, response, closeModal, user, pagination, filtrarData } = useAuth();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const navigate = useNavigate();
    const [consulta, setConsulta] = useState('')
    const [page, setPage] = useState(1);
    

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

    const filtrar = async (e) => {
        e.preventDefault();
        
        const filter = {
            "filter": String(e.target.querySelector('.inputFilter').value)
        }
        await filtrarData(id, page, filter)
    }

    const validarFiltrar = async (e) => {
        const longitudFiltrar = e.target.value;
        if (longitudFiltrar.length == 0){
            await cargarDataTables(id, page);
        } 
    }

  return (
    <div className='dataContent'>
        <div className='pageHeader'>
            <div className='pageHeader1'>
                <div className='volverAnadir'>
                    <button className='btn-volver' onClick={volver}>← Volver</button>
                    {user?.rol == 1 && (
                        <button className='btn-anadir' onClick={openModal}>+ Añadir</button>
                    )}
                </div>
                <form onSubmit={filtrar} className='formFilter'>
                    <button type='submit' className='btnFilter'>
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                    <input type="text" placeholder='Filtrar' className='inputFilter' onChange={validarFiltrar}/>
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
        </div>
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