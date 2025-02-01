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
            else if (user?.rol == 1 && id == 6){
                setConsulta('Usuarios')
            }
            else if (user?.rol == 1 && id == 7){
                setConsulta('Transacciones')
            }
            else if (id == 8){
                setConsulta('Promociones')
            }

    
            await cargarDataTables(id, page);
        }
        loadData()
    }, [page])

    const openModal = () => {
        setIdNumber(parseInt(id, 10))
        setModalData({})
    }

    const renderPageButtons = () => {
        const pages = [];
        for (let i = 1; i <= pagination.totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                        margin: '0 5px',
                        padding: '5px 10px',
                        backgroundColor: page === i ? '#ee0d6b' : '#f8f9fa',
                        color: page === i ? '#fff' : '#000',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        filter: 'drop-shadow(2px 2px 2px rgba(97, 97, 97, 0.4))'
                    }}
                >
                    {i}
                </button>
            );
        }
        return pages;
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
    <div>
        <div className='pageHeader'>
            <div className='pageHeader1'>
                <h1>Consulta de {consulta}</h1>
                <div className='pages'>{renderPageButtons()}</div>
            </div>
            <div className='pageHeader1'>
                <div className='volverAnadir'>
                    <button onClick={volver}>Volver</button>
                    <button onClick={openModal} style={{display: id!=7 ? 'block': 'none'}}>Añadir</button>
                </div>
                <form onSubmit={filtrar} className='formFilter'>
                    <button type='submit' className='btnFilter'>
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                    <input type="text" placeholder='Filtrar' className='inputFilter' onChange={validarFiltrar}/>
                </form>
            </div>
        </div>
        <div className='dataTable' style={{display: response.length > 0 ? 'block' : 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {
                response.length > 0 && (
                    <DataTable data={response} idCategory={id}/>
                )
            }
            {
                response.length == 0 && (
                    <div className='sinDatosParaMostrar'>
                        <h1>No hay datos para mostrar</h1>
                    </div>
                )
            }
        </div>
    </div>
  )
}