import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider.jsx'

export const Admin = () => {

    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isAuthenticated) navigate('/login')
    }, [isAuthenticated])



    // const [parfums, setParfums] = useState([])
    // const [types, setTypes] = useState([])
    // const [bodies, setBodies] = useState([])
    // const [brands, setBrands] = useState([])
    // const [versions, setVersions] = useState([])

    // useEffect(() => {
    //     async function loadParfums() {
    //         const response = await getParfumsRequest()
    //         setParfums(response.data)
    //     }
    //     async function loadTypes() {
    //         const response = await getTypesRequest()
    //         setTypes(response.data)
    //     }
    //     async function loadBodies() {
    //         const response = await getBodiesRequest()
    //         setBodies(response.data)
    //     }
    //     async function loadBrands() {
    //         const response = await getBrandsRequest()
    //         setBrands(response.data)
    //     }
    //     async function loadVersions() {
    //         const response = await getVersionsRequest()
    //         setVersions(response.data)
    //     }
    //     loadParfums()
    //     loadTypes()
    //     loadBodies()
    //     loadBrands()
    //     loadVersions()
    // }, [])

  return (
    <div>
        <h1>Bienvenido {user.firstname} {user.lastname}</h1>
        <div>
            <h2>Selecciona la data a ver</h2>
            <Link to="/data?id=1">Perfumes</Link>
            <Link to="/data?id=2">Tipos de Perfumes</Link>
            <Link to="/data?id=3">Marcas</Link>
            <Link to="/data?id=4">Versiones</Link>
            <Link to="/data?id=5">Fondos de Inicio</Link>
            <Link to="/data?id=6">Usuarios</Link>
        </div>
    </div>
  )
}