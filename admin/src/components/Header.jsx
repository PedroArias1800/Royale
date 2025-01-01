import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { isAuthenticated, closeSession } = useAuth();
  const [mostrarSesion, setMostrarSesion] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    setMostrarSesion(isAuthenticated); // Sincronizar cuando cambia isAuthenticated
  }, [isAuthenticated]);

  const handleSession = async () => {
    await closeSession()
    navigate('/login');
  }

return (
    <div className='adminHeader'>
      <div className='adminHeader1'>
        <img src="" alt="" />
        <p>Royale Panama - Admin</p>
      </div>
      {
        mostrarSesion && (
          <button onClick={handleSession}>Cerrar Sesión</button>
        )
      }
    </div>
  )
}