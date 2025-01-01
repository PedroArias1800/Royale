import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { getParfumsRequest, getTypesRequest, getBodiesRequest, getBrandsRequest, getVersionsRequest } from '../api/Admin.api.js'

import { useAuth } from '../context/AuthProvider.jsx'
import { DataTable } from '../components/DataTable.jsx';

export const Data = () => {

    const { isAuthenticated } = useAuth();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const navigate = useNavigate();
    const [response, setResponse] = useState([])
    const [consulta, setConsulta] = useState('')


    useEffect(() => {
        if (!isAuthenticated){
            navigate('/login')
            return;
        }
        if (!id){
            navigate('/admin')
        }
    }, [isAuthenticated, id])


    useEffect(() => {
        async function loadParfums() {
            const response = await getParfumsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
            async function loadTypes() {
            const response = await getTypesRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
            async function loadBodies() {
            const response = await getBodiesRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
            async function loadBrands() {
            const response = await getBrandsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
            async function loadVersions() {
            const response = await getVersionsRequest();
            setResponse(Array.isArray(response.data) ? response.data : []);
        }
        if (id == 1){
            loadParfums()
            setConsulta('Perfumes')
        } 
        else if (id == 2){
            loadTypes()
            setConsulta('Tipos de Perfumes')
        } 
        else if (id == 3){
            loadBrands()
            setConsulta('Marcas')
        } 
        else if (id == 4){
            loadVersions()
            setConsulta('Versiones')
        }
        else if (id == 5){
            loadBodies()
            setConsulta('Fondos de Inicio')
        } 
        // else if (id == 6){
        //     loadUsers()
        //     setConsulta('Usuarios')
        // }
    }, [])

  return (
    <div>
        <div>
            <h1>Consulta de {consulta}</h1>
            <Link to="/admin">Volver</Link>
        </div>
        <DataTable data={response} idCategory={id}/>
    </div>
  )
}