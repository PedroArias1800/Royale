import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx'
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faInbox } from '@fortawesome/free-solid-svg-icons';
import { getTransactionsRequest, putTransactionsRequest } from '../api/Admin.api.js';
import { useState } from 'react';

export const Admin = () => {
    const { user, closeModal } = useAuth();
    const [transaction, setTransaction] = useState([])
    const [showTransaction, setShowTransaction] = useState(false)

    useEffect(() => {
      async function loadTransaction() {
        const response = await getTransactionsRequest()
        setTransaction(response.data)
      }
      loadTransaction()
      closeModal()
    }, [])

    if (!user) {
      return <p>Cargando...</p>;
    }

    const handleViewTransaction = () => {
      setShowTransaction(!showTransaction)
    }

    const updateTransaction = async (id) => {
      try{
        const response = await putTransactionsRequest(id)
        if (Array.isArray(response.data)){
          setTransaction(response.data)
        } else {
          setTransaction([])
        }
      } catch (e){
        console.log(e)
      }
    }

  return (
    <div className='pageAdmin'>
        <section>
          <h1>Bienvenido {user.firstname} {user.lastname}</h1>
          <div className='inbox'>
            <div onClick={handleViewTransaction} className='numberInbox'>
              {
                transaction.length > 0 && (
                  <p>{transaction.length}</p>
                )
              }
              <FontAwesomeIcon icon={faInbox} className='contactIcon'/>
            </div>
            <div className='infoInbox'>
              {
                transaction.map(tran => (
                  <div style={{display: showTransaction ? 'block' : 'none'}} key={tran._id} onClick={() => updateTransaction(tran._id)} className='notificationInbox'>
                    <div>
                      <p>{tran.userName}, {tran.phone}</p>
                      <p>Total: {tran.total}</p>
                      <p>{(tran.createdAt).split('T')[0]} a las {(tran.createdAt).split('T')[1].split('.')[0]}</p>
                    </div>
                    <FontAwesomeIcon icon={faCheck} className='contactIcon'/>
                  </div>
                ))
              }
            </div>
          </div>
        </section>
        <div>
            <Link to="/data?id=1">Perfumes</Link>
            <Link to="/data?id=2">Tipos de Perfumes</Link>
            <Link to="/data?id=3">Marcas</Link>
            <Link to="/data?id=4">Versiones</Link>
            <Link to="/data?id=5">Fondos de Inicio</Link>
            {
              (user.rol == 1 ? <Link to="/data?id=6">Usuarios</Link> : '')
            }
        </div>
    </div>
  )
}