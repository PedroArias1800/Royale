import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom';
const URLAdmin = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'

export const Header = () => {
  const { isAuthenticated, closeSession } = useAuth();
  const [mostrarSesion, setMostrarSesion] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    setMostrarSesion(isAuthenticated);
  }, [isAuthenticated]);

  const handleSession = async () => {
    await closeSession()
    navigate('/login');
  }

return (
    <div className='adminHeader'>
      <div className='adminHeader1'>
        <a href={URLAdmin}><img src="/icons/RoyaleDorado.webp" alt="Logo de Royale Panamá" /></a>
        <div className='DivCerrarSesion'>
          <p>Royale Panama - Admin</p>
          {
            mostrarSesion && (
              <button onClick={handleSession} className='CerrarSesion'>Cerrar Sesión</button>
            )
          }
        </div>
      </div>
    </div>
  )
}