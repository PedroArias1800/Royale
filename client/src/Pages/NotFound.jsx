import { Link } from 'react-router-dom'

export const NotFound = () => {
  return (
    <div>
        <h2>Lo sentimos, la página buscada no se encuentra disponible</h2>
        <Link to='/'>Volver</Link>
    </div>
  )
}
