import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx'
import { useEffect } from 'react';

export const Admin = () => {

    const { user, closeModal } = useAuth();

    useEffect(() => {
      closeModal()
    }, [])

    if (!user) {
      return <p>Cargando...</p>;
    }

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
        </div>
    </div>
  )
}