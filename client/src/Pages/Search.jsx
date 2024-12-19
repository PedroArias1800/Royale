import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductList } from "../components/ProductList";
import { Filter } from '../components/Filter';
import { getParfumsRequest } from '../api/Parfum.api.js';
import '../css/Search.css';

export const Search = () => {
  // Obtén los parámetros de la URL
  const location = useLocation();
  const params = new URLSearchParams(location.search); // Para leer los parámetros de consulta

  const id = params.get('id'); // Obtiene el valor de "id" de la URL
  const type = params.get('type'); // Obtiene el valor de "type" de la URL

  const [products, setProducts] = useState([]); // Inicializamos como array vacío
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    async function loadParfums() {
      try {
        const response = await getParfumsRequest();
        console.log(response.data);
        setProducts(response.data);
        setFilteredProducts(response.data); // Inicializamos con todos los productos
      } catch (error) {
        console.error("Error al cargar los perfumes:", error);
        setProducts([]);
        setFilteredProducts([]);
      }
    }
    loadParfums();
  }, []);

  // Obtener marcas de manera segura
  const brands = products.length > 0 ? [...new Set(products.map((product) => product.brand))] : [];

  const handleFilter = ({ search, gender, minPrice, maxPrice, brand }) => {
    if (!products || products.length === 0) return;

    const filtered = products.filter((product) => {
      const matchesSearch = search
        ? product.title?.toLowerCase().includes(search.toLowerCase()) ||
          product.brand?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesGender = gender ? product.gender === gender : true;
      const matchesBrand = brand ? product.brand === brand : true;
      const matchesPrice = product.types.some((type) => {
        const price = parseFloat(type.price);
        return (
          (minPrice ? price >= minPrice : true) &&
          (maxPrice ? price <= maxPrice : true)
        );
      });
      return matchesSearch && matchesGender && matchesBrand && matchesPrice;
    });

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    window.scrollTo(0, 0); // Desplazar al inicio
  }, []);

  return (
    <>
      <div className="app">
        <Filter onFilter={handleFilter} brands={brands} id={id} type={type} />
        <ProductList products={{ Parfum: filteredProducts }} />
      </div>
    </>
  );
};
