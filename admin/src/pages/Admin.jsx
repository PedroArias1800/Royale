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
    <div className='pageAdmin'>
        <section>
          <h1>Bienvenido {user.firstname} {user.lastname}</h1>
        </section>
        <div className='adminLinks'>
            <Link to="/data?id=1">Perfumes</Link>
            <Link to="/data?id=2">Tipos de Perfumes</Link>
            <Link to="/data?id=3">Marcas</Link>
            <Link to="/data?id=4">Versiones</Link>
            <Link to="/data?id=5">Fondos de Inicio</Link>
            <Link to="/data?id=8">Promociones</Link>
            {
              (user.rol == 1 ? <Link to="/data?id=6">Usuarios</Link> : '')
            }
            {
              (user.rol == 1 ? <Link to="/data?id=7">Transacciones</Link> : '')
            }
        </div>
    </div>
  )
}