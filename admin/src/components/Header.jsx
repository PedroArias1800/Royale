import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faInbox } from '@fortawesome/free-solid-svg-icons';
import { getTransactionsRequest, putTransactionsRequest } from '../api/Admin.api.js';
const URLAdmin = process.env.VITE_ADMIN_URL || 'http://localhost:5174'

export const Header = () => {
  const { isAuthenticated, closeSession, transaction, setTransaction, user } = useAuth();
  const [mostrarSesion, setMostrarSesion] = useState(false)
  const [showTransaction, setShowTransaction] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTransaction() {
      const response = await getTransactionsRequest()
      setTransaction(response.data)
    }
    loadTransaction()
  }, [])

  useEffect(() => {
    setMostrarSesion(isAuthenticated);
  }, [isAuthenticated]);

  const handleSession = async () => {
    await closeSession()
    navigate('/login');
  }

  const updateTransaction = async (id) => {
    try{
      const response = await putTransactionsRequest(id)
      if (Array.isArray(response.data)){
        setTransaction(response.data)
      } else {
        setTransaction([])
      }
      if (response.data == 0){
        handleViewTransaction()
      }
    } catch (e){
      console.log(e)
    }
  }

  const handleViewTransaction = () => {
    setShowTransaction(!showTransaction)
  }

return (
    <div className='adminHeader'>
      <div className='adminHeader1'>
        <a href={URLAdmin}><img src="/icons/RoyaleDorado.webp" alt="Logo de Royale Panamá" /></a>
        <div className='DivCerrarSesion'>
          <div onClick={handleViewTransaction} className='inbox'>
            <div className='numberInbox' style={{display: isAuthenticated && user?.rol == 1 ? 'flex' : 'none'}}>
              {
                transaction.length > 0 && (
                  <p>{transaction.length}</p>
                )
              }
              <FontAwesomeIcon icon={faInbox} className='contactIcon'/>
            </div>
          </div>
          <div className='DivCerrarSesion2'>
            <p>Royale Panama - Admin</p>
            {
              mostrarSesion && (
                <button onClick={handleSession} className='CerrarSesion'>Cerrar Sesión</button>
              )
            }
          </div>
          <div style={{display: showTransaction ? 'block' : 'none'}} className='infoInbox'>
            {
              transaction.map(tran => (
                <div key={tran._id} className='notificationInbox'>
                  <div>
                    <p>{tran.userName}, ${tran.total}</p>
                    <p>{(tran.createdAt).split('T')[0]} a las {(tran.createdAt).split('T')[1].split('.')[0]}</p>
                  </div>
                  <FontAwesomeIcon icon={faCheck} className='updateTransactionCheck' onClick={() => updateTransaction(tran._id)}/>
                </div>
              ))
            }
            {
              transaction.length == 0 && (
                <h3 style={{color: 'black', textAlign: 'center', alignSelf: 'center'}}>No hay nuevas transacciones</h3>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}