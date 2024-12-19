import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LinkWay } from '../components/LinkWay';
import { ParfumInfo } from '../components/ParfumInfo';
import { getParfumVersionRequest } from '../api/Parfum.api.js';
import '../css/Search.css';

export const ParfumDetails = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const [product, setProduct] = useState();

  useEffect(() => {
    if (!id) {
      console.error('El parámetro "id" no está presente en la URL');
      return;
    }

    async function loadParfum() {
      try {
        const response = await getParfumVersionRequest(id);
        setProduct(response.data);
      } catch (error) {
        console.error('Error al cargar el perfume:', error);
      }
    }

    loadParfum();
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <>
      <LinkWay product={product} id={id} />
      <ParfumInfo product={product} />
    </>
  );
};
