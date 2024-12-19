import React from 'react';
import { Link } from 'react-router-dom';

export const LinkWay = ({ product, id }) => {

  if (!product) {
    return <p>Error: No se pudo cargar el producto.</p>;
  }

  const genero = product.gender === 1 ? "Damas" : "Caballeros";

  return (
    <div className='linkWay'>
      <Link to={`/search?type=${product.gender}`}>{genero}</Link>
      <p>/</p>
      <Link to={`/parfum?id=${id}`}>{product.brand} {product.title}</Link>
    </div>
  );
};
