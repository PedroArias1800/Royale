import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider.jsx'
import { DataTable } from '../components/DataTable.jsx';

export const Data = () => {

    const { setModalData, setIdNumber, cargarDataTables, response, closeModal, user } = useAuth();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const navigate = useNavigate();
    const [consulta, setConsulta] = useState('')

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
    
            await cargarDataTables(id);
        }
        loadData()
    }, [])

    const openModal = () => {
        setIdNumber(parseInt(id, 10))
        setModalData({})
    }

  return (
    <div>
        <h1>Consulta de {consulta}</h1>
        <div>
            <button onClick={volver}>Volver</button>
            <button onClick={openModal}>Añadir</button>
        </div>
        <DataTable data={response} idCategory={id}/>
    </div>
  )
}