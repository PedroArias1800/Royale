import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx'
import { useEffect, useState } from 'react';

export const Admin = () => {
    const { user, closeModal, countSell } = useAuth();
    const [profit, setProfit] = useState(.50)

    useEffect(() => {
      closeModal();
    }, [user, closeModal]);

    useEffect(() => {
      // Determinar el profit
      if (countSell >= 0 && countSell <= 5) {
          setProfit(0.50);
      } else if (countSell >= 6 && countSell <= 8) {
          setProfit(0.55);
      } else if (countSell >= 9) {
          setProfit(0.60);
      }
  }, [countSell]);


    if (!user) {
      return <p>Cargando...</p>;
    }

    // if (!countSell) {
    //   return <p>Cargando...</p>;
    // }

  return (
    <div className='pageAdmin'>
        <section className='infoAdmin'>
          <h1>Bienvenido: {user.firstname} {user.lastname}</h1>
          <h3>
            <p>Venta Mensual: {countSell}</p>
            <p>Ganancia: {Number(profit * 100).toFixed(0)}%</p>
          </h3>
        </section>
        <div className='adminLinks'>
            <Link to="/data?id=1">Perfumes</Link>
            <Link to="/data?id=2">Tipos de Perfumes</Link>
            <Link to="/data?id=3">Marcas</Link>
            <Link to="/data?id=4">Versiones</Link>
            {
              user.rol == 1 && (
                <>
                  <Link to="/data?id=5">Fondos de Inicio</Link>
                </>
              )
            }
            <Link to="/data?id=8">Promociones</Link>
            <Link to="/data?id=9">Cupones</Link>
            {
              user.rol == 1 && (
                <>
                  <Link to="/data?id=6">Usuarios</Link>
                  <Link to="/data?id=7">Transacciones</Link>
                </>
              )
            }
        </div>
    </div>
  )
}