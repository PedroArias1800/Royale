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

  const roles = user.roles || [user.rol];
  const isAdmin    = roles.includes(1);
  const isSeller   = roles.includes(2);
  const isDelivery = roles.includes(3);
  const isNonAdmin = !isAdmin;

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
            {/* ── Sección Admin ── */}
            {isAdmin && (
              <>
                <p className='adminLinksTitle'>Administración</p>
                <Link to="/consolidacion">Consolidación</Link>
                <Link to="/cortes">Días de Corte</Link>
                <Link to="/delivery">Delivery</Link>
                <Link to="/descuentos">Descuentos</Link>
                <Link to="/finanzas">Finanzas</Link>
                <Link to="/data?id=5">Fondos de Inicio</Link>
                <Link to="/data?id=10">Proveedores</Link>
                <Link to="/promo-config">Promo Landing</Link>
                <Link to="/suscriptores">Suscriptores</Link>
                <Link to="/data?id=7">Transacciones</Link>
                <Link to="/data?id=6">Usuarios</Link>
              </>
            )}
            {/* ── Sección Catálogo ── */}
            {(isAdmin || isSeller) && (
              <>
                <p className='adminLinksTitle'>Catálogo</p>
                <Link to="/data?id=9">Cupones</Link>
                <Link to="/data?id=3">Marcas</Link>
                <Link to="/data?id=1">Perfumes</Link>
                <Link to="/data?id=8">Promociones</Link>
                <Link to="/data?id=2">Tipos de Perfumes</Link>
                <Link to="/data?id=4">Versiones</Link>
              </>
            )}
            {/* ── No-admin: módulos según roles sin duplicar ── */}
            {isNonAdmin && (isSeller || isDelivery) && (
              <>
                {isDelivery && <Link to="/consolidacion">Consolidación</Link>}
                <Link to="/cortes">Mis Ganancias</Link>
              </>
            )}
        </div>
    </div>
  )
}