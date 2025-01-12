import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider.jsx'
import { DataTable } from '../components/DataTable.jsx';

export const Data = () => {

    const { setModalData, setIdNumber, cargarDataTables, response, closeModal, user, pagination } = useAuth();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const navigate = useNavigate();
    const [consulta, setConsulta] = useState('')
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    

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
    
            await cargarDataTables(id, page);
        }
        loadData()
        setTotalPages(pagination.totalPages);
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
                        backgroundColor: page === i ? '#007bff' : '#f8f9fa',
                        color: page === i ? '#fff' : '#000',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

  return (
    <div>
        <h1>Consulta de {consulta}</h1>
        <div>
            <div>
                <button onClick={volver}>Volver</button>
                <button onClick={openModal}>Añadir</button>
            </div>
            <div>{renderPageButtons()}</div>
        </div>
        <DataTable data={response} idCategory={id}/>
    </div>
  )
}