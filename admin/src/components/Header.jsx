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
        <a href={URLAdmin}><img src="/icons/RoyalePanama.png" alt="Logo de Royale Panamá" /></a>
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