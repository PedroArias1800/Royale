import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import { getTransactionsRequest, putTransactionsRequest } from '../api/Admin.api.js';

export const Header = () => {
  const { isAuthenticated, closeSession, transaction, setTransaction, user, URLAdmin } = useAuth();
  const [mostrarSesion, setMostrarSesion] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTransaction() {
      const response = await getTransactionsRequest()
      setTransaction(response.data)
    }
    if (isAuthenticated){
      loadTransaction()
    }
  }, [])

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
          <div className='DivCerrarSesion2'>
            <p>Administración</p>
            {
              mostrarSesion && (
                <button onClick={handleSession} className='CerrarSesion'>Cerrar Sesión</button>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}