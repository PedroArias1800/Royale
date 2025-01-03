import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthProvider.jsx'

export const Admin = () => {

    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
      if (!isAuthenticated) navigate('/login')      
    }, [isAuthenticated]) 

    useEffect(() => {
      // Asegúrate de que `user` exista antes de hacer la redirección
      if (!user) {
        navigate('/login');
      }
    }, [user, navigate]);

    if (!user) {
      return <p>Cargando...</p>; // Muestra un mensaje de carga mientras `user` no esté disponible
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
            <Link to="/data?id=6">Usuarios</Link>
        </div>
    </div>
  )
}